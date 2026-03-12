import type { WellnessQuestion } from "@/lib/types/wellnessCheckin";

export const WELLNESS_QUESTIONS: WellnessQuestion[] = [
  {
    id: "sleep_quality",
    label: "Sleep quality",
    description: "How well have you been sleeping lately? Consider both falling asleep and staying asleep.",
  },
  {
    id: "stress_level",
    label: "Stress and anxiety",
    description: "How often do you feel stressed, anxious, or on edge about caregiving responsibilities?",
  },
  {
    id: "missing_activities",
    label: "Missing your own activities",
    description: "Have you been giving up hobbies, social events, or things you enjoy because of caregiving?",
  },
  {
    id: "feeling_overwhelmed",
    label: "Feeling overwhelmed",
    description: "Do you feel like caregiving demands are more than you can handle?",
  },
  {
    id: "getting_help",
    label: "Getting enough help",
    description: "Are you getting enough support from family, friends, or professional services?",
  },
];
