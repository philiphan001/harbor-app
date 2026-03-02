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
    pattern: /hipaa|medical record.?access/i,
    checklist: [
      { id: "hipaa-1", label: "Discuss medical record access with parent", completed: false },
      { id: "hipaa-2", label: "Get the HIPAA authorization form", completed: false, linkTo: "/hipaa-authorization" },
      { id: "hipaa-3", label: "Have parent sign the form", completed: false, linkTo: "/hipaa-authorization" },
      { id: "hipaa-4", label: "Distribute copies to each healthcare provider", completed: false },
    ],
  },
  {
    pattern: /housing plan|living arrangement|housing cost|rent.*mortgage|assisted living|senior living/i,
    checklist: [
      { id: "hp-1", label: "Document current living arrangement", completed: false, linkTo: "/housing-plan" },
      { id: "hp-2", label: "Record housing costs (rent/mortgage/fees)", completed: false, linkTo: "/housing-plan" },
      { id: "hp-3", label: "Assess home services and support needs", completed: false, linkTo: "/housing-plan" },
      { id: "hp-4", label: "Research transition options and costs", completed: false, linkTo: "/housing-plan" },
      { id: "hp-5", label: "Discuss long-term housing preferences with parent", completed: false },
    ],
  },
  {
    pattern: /home safety|fall prevention|grab bar|aging in place/i,
    checklist: [
      { id: "hs-1", label: "Complete a room-by-room safety walkthrough", completed: false, linkTo: "/home-safety" },
      { id: "hs-2", label: "Install grab bars and non-slip mats", completed: false, linkTo: "/home-safety" },
      { id: "hs-3", label: "Set up smoke detectors and emergency alert system", completed: false, linkTo: "/home-safety" },
      { id: "hs-4", label: "Record emergency contact information", completed: false, linkTo: "/home-safety" },
      { id: "hs-5", label: "Discuss aging in place vs. moving options", completed: false },
    ],
  },
  {
    pattern: /transportation|medical transport|ride service|getting to appointments/i,
    checklist: [
      { id: "tp-1", label: "Review current transportation options", completed: false, linkTo: "/transportation-plan" },
      { id: "tp-2", label: "Set up primary and backup transport plan", completed: false, linkTo: "/transportation-plan" },
      { id: "tp-3", label: "Research local ride services and NEMT", completed: false, linkTo: "/transportation-plan" },
      { id: "tp-4", label: "Set up delivery services for essentials", completed: false, linkTo: "/transportation-plan" },
      { id: "tp-5", label: "Discuss driving safety if applicable", completed: false },
    ],
  },
  {
    pattern: /social care|social isolation|pet care|check.?in|loneliness/i,
    checklist: [
      { id: "sc-1", label: "Record emergency contacts for social support", completed: false, linkTo: "/social-care" },
      { id: "sc-2", label: "Set up a regular check-in schedule", completed: false, linkTo: "/social-care" },
      { id: "sc-3", label: "Explore community resources and programs", completed: false, linkTo: "/social-care" },
      { id: "sc-4", label: "Create a pet care plan (if applicable)", completed: false, linkTo: "/social-care" },
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
