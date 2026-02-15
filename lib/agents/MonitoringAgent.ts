// Abstract base class for all monitoring agents

import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { Signal, createSignal } from "@/lib/types/signal";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("MonitoringAgent");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class MonitoringAgent<TExternalData = any, TChange = any> {
  abstract agentId: string;
  abstract domain: Signal["domain"];
  abstract description: string;

  /**
   * Main entry point - runs the monitoring agent for a specific parent
   * @param parentId The parent to monitor
   * @param context The parent's situation context
   * @returns Array of signals detected
   */
  async run(parentId: string, context: SituationContext): Promise<Signal[]> {
    log.info("Starting monitoring", {
      agentId: this.agentId,
      parentName: context.profile.name
    });

    try {
      // 1. Fetch external data
      const externalData = await this.fetchExternalData(context);

      // 2. Detect changes/events
      const changes = await this.detectChanges(context, externalData);

      // 3. Generate signals
      const signals = await this.generateSignals(changes, context);

      log.info("Generated signals", { agentId: this.agentId, count: signals.length });
      return signals;
    } catch (error) {
      log.errorWithStack("Monitoring agent error", error);
      return [];
    }
  }

  /**
   * Fetch external data from APIs, web scraping, or databases
   * @param context The parent's situation context
   * @returns Raw external data
   */
  protected abstract fetchExternalData(context: SituationContext): Promise<TExternalData>;

  /**
   * Compare external data against context to detect changes/events
   * @param context The parent's situation context
   * @param externalData Data fetched from external sources
   * @returns Array of detected changes
   */
  protected abstract detectChanges(
    context: SituationContext,
    externalData: TExternalData
  ): Promise<TChange[]>;

  /**
   * Convert detected changes into structured signals
   * @param changes Detected changes
   * @param context The parent's situation context
   * @returns Array of signals
   */
  protected abstract generateSignals(
    changes: TChange[],
    context: SituationContext
  ): Promise<Signal[]>;

  /**
   * Helper: Create a signal with agent metadata
   */
  protected createSignal(
    parentId: string,
    title: string,
    description: string,
    priority: Signal["priority"],
    options: Partial<Signal> = {}
  ): Signal {
    return createSignal(this.agentId, parentId, this.domain, title, description, priority, {
      metadata: {
        agentDescription: this.description,
        ...options.metadata,
      },
      ...options,
    });
  }

  /**
   * Helper: Log agent activity
   */
  protected log(message: string): void {
    log.info(message, { agentId: this.agentId });
  }

  /**
   * Helper: Get situation summary for context
   */
  protected getSituationSummary(context: SituationContext): string {
    return getSituationSummary(context);
  }
}
