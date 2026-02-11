// Calendar Monitor Agent - watches for age-based transitions and important dates

import { MonitoringAgent } from "./MonitoringAgent";
import { SituationContext } from "@/lib/types/situationContext";
import { Signal } from "@/lib/types/signal";

interface CalendarEvent {
  type: "birthday" | "medicare_enrollment" | "medicaid_renewal" | "document_expiry" | "appointment";
  date: string;
  title: string;
  description: string;
  daysUntil: number;
  metadata?: any;
}

export class CalendarMonitor extends MonitoringAgent {
  agentId = "calendar_monitor";
  domain: Signal["domain"] = "general";
  description = "Monitors age-based transitions, enrollment periods, and important dates";

  protected async fetchExternalData(context: SituationContext): Promise<any> {
    // In production, this would query:
    // - Federal calendar APIs for Medicare/Medicaid dates
    // - State-specific enrollment periods
    // - National holiday calendars

    // For now, return hardcoded federal dates
    const currentYear = new Date().getFullYear();

    return {
      medicareDates: {
        openEnrollment: {
          start: `${currentYear}-10-15`,
          end: `${currentYear}-12-07`,
        },
        partDDeadline: `${currentYear}-12-07`,
      },
      medicaidDates: {
        renewalMonth: 12, // December for most states
      },
    };
  }

  protected async detectChanges(
    context: SituationContext,
    externalData: any
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    const today = new Date();

    // 1. Check for upcoming birthday and age-based transitions
    if (context.profile.dateOfBirth) {
      const birthDate = new Date(context.profile.dateOfBirth);
      const nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const daysUntilBirthday = Math.floor(
        (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Alert for birthdays within 30 days
      if (daysUntilBirthday <= 30 && daysUntilBirthday >= 0) {
        const nextAge = context.profile.age + 1;

        events.push({
          type: "birthday",
          date: nextBirthday.toISOString(),
          title: `${context.profile.name} turns ${nextAge} soon`,
          description: `${context.profile.name}'s birthday is in ${daysUntilBirthday} days. ${this.getAgeTransitionNote(nextAge)}`,
          daysUntil: daysUntilBirthday,
          metadata: { nextAge },
        });
      }
    }

    // 2. Check Medicare open enrollment
    const openEnrollmentStart = new Date(externalData.medicareDates.openEnrollment.start);
    const openEnrollmentEnd = new Date(externalData.medicareDates.openEnrollment.end);

    const daysUntilMedicareStart = Math.floor(
      (openEnrollmentStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUntilMedicareEnd = Math.floor(
      (openEnrollmentEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Alert if within Medicare open enrollment period or 30 days before
    if (daysUntilMedicareStart <= 30 && daysUntilMedicareStart >= 0) {
      events.push({
        type: "medicare_enrollment",
        date: openEnrollmentStart.toISOString(),
        title: "Medicare Open Enrollment starting soon",
        description: `Medicare Open Enrollment starts in ${daysUntilMedicareStart} days (Oct 15 - Dec 7). Time to review ${context.profile.name}'s Part D plan and Medicare Advantage options.`,
        daysUntil: daysUntilMedicareStart,
      });
    } else if (daysUntilMedicareEnd > 0 && daysUntilMedicareEnd <= 14) {
      events.push({
        type: "medicare_enrollment",
        date: openEnrollmentEnd.toISOString(),
        title: "Medicare Open Enrollment ending soon",
        description: `Medicare Open Enrollment ends in ${daysUntilMedicareEnd} days. Last chance to make changes to ${context.profile.name}'s coverage for next year.`,
        daysUntil: daysUntilMedicareEnd,
      });
    }

    // 3. Check for upcoming appointments
    for (const appointment of context.medical.upcomingAppointments || []) {
      const appointmentDate = new Date(appointment.date);
      const daysUntil = Math.floor(
        (appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Alert for appointments within 7 days
      if (daysUntil <= 7 && daysUntil >= 0) {
        events.push({
          type: "appointment",
          date: appointment.date,
          title: `Upcoming appointment with ${appointment.doctor}`,
          description: `${context.profile.name} has an appointment with ${appointment.doctor} in ${daysUntil} days${appointment.purpose ? ` for ${appointment.purpose}` : ""}.`,
          daysUntil,
          metadata: appointment,
        });
      }
    }

    // 4. Check for expiring legal documents
    const legalDocuments = [
      context.legal.healthcareProxy,
      context.legal.powerOfAttorney,
      context.legal.will,
      context.legal.advanceDirective,
      ...context.legal.other,
    ].filter(Boolean);

    for (const doc of legalDocuments) {
      if (doc && doc.dateExpires) {
        const expiryDate = new Date(doc.dateExpires);
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Alert for documents expiring within 60 days
        if (daysUntilExpiry <= 60 && daysUntilExpiry >= 0) {
          events.push({
            type: "document_expiry",
            date: doc.dateExpires,
            title: `${doc.documentType} expiring soon`,
            description: `${context.profile.name}'s ${doc.documentType} expires in ${daysUntilExpiry} days. Consider renewing or updating this document.`,
            daysUntil: daysUntilExpiry,
            metadata: doc,
          });
        }
      }
    }

    return events;
  }

  protected async generateSignals(
    events: CalendarEvent[],
    context: SituationContext
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const event of events) {
      // Determine priority based on urgency
      let priority: Signal["priority"] = "low";
      if (event.daysUntil <= 7) {
        priority = "high";
      } else if (event.daysUntil <= 30) {
        priority = "medium";
      }

      // Determine if actionable
      const actionable = event.type !== "birthday";

      // Generate action items based on event type
      const actionItems: string[] = [];

      if (event.type === "medicare_enrollment") {
        actionItems.push("Review current Part D plan costs and coverage");
        actionItems.push("Compare Medicare Advantage options");
        actionItems.push("Check if current doctors are in network");
      } else if (event.type === "appointment") {
        actionItems.push("Confirm appointment with doctor's office");
        actionItems.push("Prepare list of questions or concerns");
        actionItems.push("Arrange transportation if needed");
      } else if (event.type === "document_expiry") {
        actionItems.push("Contact attorney to review document");
        actionItems.push("Update document if needed");
        actionItems.push("Ensure copies are distributed to relevant parties");
      } else if (event.type === "birthday") {
        const nextAge = event.metadata?.nextAge;
        if (nextAge === 65) {
          actionItems.push("Enroll in Medicare Part A and Part B");
          actionItems.push("Consider Medicare Supplement (Medigap) plans");
        } else if (nextAge && nextAge >= 85) {
          actionItems.push("Review long-term care insurance options");
          actionItems.push("Assess current living situation safety");
        }
      }

      const signal = this.createSignal(
        context.parentId,
        event.title,
        event.description,
        priority,
        {
          actionable,
          actionItems: actionItems.length > 0 ? actionItems : undefined,
          expiresAt: event.date,
          metadata: {
            eventType: event.type,
            daysUntil: event.daysUntil,
            ...event.metadata,
          },
        }
      );

      signals.push(signal);
    }

    return signals;
  }

  /**
   * Get note about age-based transitions
   */
  private getAgeTransitionNote(age: number): string {
    if (age === 65) {
      return "This is a critical year - Medicare enrollment begins!";
    } else if (age === 70) {
      return "Time to start required minimum distributions (RMDs) from retirement accounts.";
    } else if (age === 75) {
      return "Consider reviewing driving safety and home accessibility.";
    } else if (age === 80) {
      return "Many families begin exploring assisted living options around this age.";
    } else if (age === 85) {
      return "Increased health monitoring and fall prevention become priorities.";
    } else if (age >= 90) {
      return "Exceptional longevity - ensure care support is adequate.";
    }
    return "";
  }
}

// Export singleton instance
export const calendarMonitor = new CalendarMonitor();
