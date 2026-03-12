import type { CognitiveQuestion } from "@/lib/types/cognitiveCheckin";

export const COGNITIVE_QUESTIONS: CognitiveQuestion[] = [
  {
    id: "missed_medications",
    label: "Missing medications",
    description: "Forgetting to take medications or taking them at the wrong time, even with reminders.",
  },
  {
    id: "repeating_stories",
    label: "Repeating questions or stories",
    description: "Asking the same question multiple times in a conversation, or retelling the same story as if for the first time.",
  },
  {
    id: "finance_trouble",
    label: "Difficulty managing finances",
    description: "Trouble paying bills on time, making unusual purchases, or confusion with basic math like calculating change.",
  },
  {
    id: "getting_lost",
    label: "Getting lost or disoriented",
    description: "Confusion in familiar places, trouble finding the way home, or difficulty following directions.",
  },
  {
    id: "personality_changes",
    label: "Personality or mood changes",
    description: "Becoming unusually withdrawn, suspicious, anxious, or easily upset in situations that wouldn't have bothered them before.",
  },
  {
    id: "familiar_task_difficulty",
    label: "Trouble with familiar tasks",
    description: "Struggling with everyday activities they used to do easily, like cooking a favorite recipe or using the TV remote.",
  },
  {
    id: "word_finding",
    label: "Word-finding problems",
    description: "Frequently pausing mid-sentence to search for words, using substitute words, or losing the thread of a conversation.",
  },
  {
    id: "poor_judgment",
    label: "Poor judgment or decision-making",
    description: "Making uncharacteristically poor decisions, like dressing inappropriately for the weather or falling for scams.",
  },
];
