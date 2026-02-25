// Pre-defined checklists for known task types

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  linkTo?: string;
}

const CHECKLIST_MATCHERS: Array<{
  pattern: RegExp;
  checklist: ChecklistItem[];
}> = [
  {
    pattern: /power of attorney|financial poa|durable poa/i,
    checklist: [
      { id: "poa-1", label: "Discuss with parent who should be the agent", completed: false },
      { id: "poa-2", label: "Gather financial account information", completed: false },
      { id: "poa-3", label: "Get the state-specific POA form", completed: false, linkTo: "/power-of-attorney" },
      { id: "poa-4", label: "Fill out and sign the form (with notary)", completed: false, linkTo: "/power-of-attorney" },
      { id: "poa-5", label: "Distribute copies to agent, banks, and advisor", completed: false },
    ],
  },
  {
    pattern: /advance directive|living will|healthcare directive|healthcare proxy/i,
    checklist: [
      { id: "ad-1", label: "Discuss healthcare wishes with parent", completed: false },
      { id: "ad-2", label: "Choose a healthcare agent", completed: false },
      { id: "ad-3", label: "Get the state-specific form", completed: false, linkTo: "/advance-directives" },
      { id: "ad-4", label: "Fill out and sign (with witnesses/notary)", completed: false, linkTo: "/advance-directives" },
      { id: "ad-5", label: "Give copies to doctor, agent, and hospital", completed: false },
    ],
  },
  {
    pattern: /primary care doctor|pcp|find.*doctor/i,
    checklist: [
      { id: "doc-1", label: "Ask parent for their doctor's name", completed: false },
      { id: "doc-2", label: "Get the phone number and office address", completed: false },
      { id: "doc-3", label: "Add the information to Harbor", completed: false },
    ],
  },
  {
    pattern: /insurance|medicare|medicaid/i,
    checklist: [
      { id: "ins-1", label: "Find insurance card (front and back)", completed: false },
      { id: "ins-2", label: "Note provider name and policy number", completed: false },
      { id: "ins-3", label: "Add the information to Harbor", completed: false },
    ],
  },
];

export function getDefaultChecklist(taskTitle: string): ChecklistItem[] | undefined {
  for (const matcher of CHECKLIST_MATCHERS) {
    if (matcher.pattern.test(taskTitle)) {
      // Return a deep copy so modifications don't affect the template
      return matcher.checklist.map((item) => ({ ...item }));
    }
  }
  return undefined;
}
