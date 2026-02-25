import { Domain } from "@/components/DomainProgress";

export interface CaptureField {
  key: string; // e.g. "pcpName", "pcpPhone"
  label: string; // e.g. "Doctor's name"
  placeholder: string;
  type?: "text" | "tel" | "email"; // defaults to "text"
  required?: boolean; // if false, user can skip
}

export interface FollowUp {
  /** Which selected options trigger this follow-up */
  triggerOptions: string[];
  /** Prompt shown above the fields */
  prompt: string;
  /** Data capture fields */
  fields: CaptureField[];
  /** Whether the user can skip ("I'll add this later") */
  skippable: boolean;
}

export interface Question {
  id: string;
  text: string;
  /** Reframed around user's crisis readiness */
  subtext?: string;
  options: string[];
  allowUncertainty: boolean;
  /** Follow-up data capture for certain answers */
  followUp?: FollowUp;
}

export interface DomainQuestions {
  domain: Domain;
  title: string;
  description: string;
  questions: Question[];
}

// Medical Domain Questions — framed around USER's readiness
const medicalQuestions: Question[] = [
  {
    id: "med-1",
    text: "If your parent had a medical emergency tonight, could you reach their primary care doctor?",
    subtext: "Not just 'do they have a doctor' — could YOU contact them right now?",
    options: ["Yes, I have their contact info", "They have a doctor, but I don't have details", "No primary care doctor"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I have their contact info"],
      prompt: "Great — let's capture this so you can find it instantly in a crisis.",
      fields: [
        { key: "pcpName", label: "Doctor's name", placeholder: "e.g. Dr. Sarah Chen", required: true },
        { key: "pcpPhone", label: "Office phone", placeholder: "e.g. (555) 123-4567", type: "tel" },
        { key: "pcpPractice", label: "Practice / clinic name", placeholder: "e.g. Bay Area Family Medicine" },
      ],
      skippable: true,
    },
  },
  {
    id: "med-2",
    text: "If a doctor asked you for your parent's medication list right now, could you provide it?",
    subtext: "In an ER, this is one of the first things they'll ask.",
    options: ["Yes, I have a current list", "I know some but not all", "No, I couldn't"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I have a current list"],
      prompt: "Enter what you know — you can always update this later.",
      fields: [
        { key: "medications", label: "Current medications (one per line)", placeholder: "e.g. Lisinopril 10mg daily\nMetformin 500mg twice daily" },
      ],
      skippable: true,
    },
  },
  {
    id: "med-3",
    text: "Do you know your parent's chronic health conditions and how they're being managed?",
    subtext: "Doctors need this to avoid harmful interactions and prioritize treatment.",
    options: ["Yes, I'm up to date", "I know the conditions but not the details", "No"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I'm up to date"],
      prompt: "List what you know — this is critical for emergency providers.",
      fields: [
        { key: "conditions", label: "Conditions", placeholder: "e.g. Type 2 diabetes, hypertension, mild cognitive impairment" },
      ],
      skippable: true,
    },
  },
  {
    id: "med-4",
    text: "Could you access your parent's medical records if a new doctor or ER needed them?",
    subtext: "Patient portal access, knowing which hospital systems, having authorization.",
    options: ["Yes, I have portal access / records", "Limited access", "No access"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I have portal access / records"],
      prompt: "Note which portals or systems you can access.",
      fields: [
        { key: "portalName", label: "Patient portal / system", placeholder: "e.g. MyChart at Stanford Health" },
      ],
      skippable: true,
    },
  },
  {
    id: "med-5",
    text: "Do you know your parent's health insurance details well enough to use them?",
    subtext: "Not just 'do they have Medicare' — do you know the plan, ID number, and how to file a claim?",
    options: ["Yes, I know the details", "I know the carrier but not specifics", "No"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I know the details"],
      prompt: "Capture the key details so you have them when you need them.",
      fields: [
        { key: "insuranceCarrier", label: "Insurance carrier", placeholder: "e.g. Medicare Part A + B, Aetna Supplement" },
        { key: "insuranceId", label: "Member / Policy ID", placeholder: "e.g. 1EG4-TE5-MK72" },
        { key: "insurancePhone", label: "Claims / customer service phone", placeholder: "e.g. 1-800-MEDICARE", type: "tel" },
      ],
      skippable: true,
    },
  },
  {
    id: "med-6",
    text: "Is there a healthcare proxy or medical power of attorney — and could you invoke it today?",
    subtext: "If your parent can't speak for themselves, do you know who can? And do you have the document?",
    options: ["Yes, documented and I have a copy", "Yes, but I don't have the document", "No / Not yet", "I don't know what this is"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, documented and I have a copy"],
      prompt: "Note who is named and where the document is stored.",
      fields: [
        { key: "proxyName", label: "Named healthcare proxy", placeholder: "e.g. Jane Smith (daughter)" },
        { key: "proxyLocation", label: "Where is the document stored?", placeholder: "e.g. Safe deposit box at Chase, copy with Dr. Chen" },
      ],
      skippable: true,
    },
  },
];

// Legal Domain Questions
const legalQuestions: Question[] = [
  {
    id: "legal-1",
    text: "Does your parent have a will — and do you know where it is?",
    subtext: "A will that exists but can't be found is almost as bad as no will at all.",
    options: ["Yes, recent and I know where it is", "Yes, but it's outdated or I can't find it", "No will", "In progress"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, recent and I know where it is"],
      prompt: "Note where it's stored and who prepared it.",
      fields: [
        { key: "willLocation", label: "Where is the will stored?", placeholder: "e.g. Attorney's office — Smith & Associates" },
        { key: "willAttorney", label: "Attorney name / firm", placeholder: "e.g. Robert Smith, (555) 456-7890" },
      ],
      skippable: true,
    },
  },
  {
    id: "legal-2",
    text: "Is there a durable power of attorney — and could you use it if needed tomorrow?",
    subtext: "This lets someone manage finances, property, and legal matters if your parent can't.",
    options: ["Yes, documented and accessible", "Yes, but I don't have a copy", "No", "I don't know what this is"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, documented and accessible"],
      prompt: "Note who holds the POA and where it's filed.",
      fields: [
        { key: "poaAgent", label: "Named agent", placeholder: "e.g. Jane Smith (daughter)" },
        { key: "poaLocation", label: "Document location", placeholder: "e.g. Filed with County Clerk, copy at home in filing cabinet" },
      ],
      skippable: true,
    },
  },
  {
    id: "legal-3",
    text: "Does your parent have advance directives (living will, DNR preferences)?",
    subtext: "Without this, you may face agonizing decisions with no guidance — and doctors will default to maximum intervention.",
    options: ["Yes, documented", "We've discussed it but nothing is written", "No"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, documented"],
      prompt: "Note where these are stored and key preferences.",
      fields: [
        { key: "directivesLocation", label: "Where are they stored?", placeholder: "e.g. Copy with PCP, original at home" },
        { key: "directivesNotes", label: "Key preferences (if you know them)", placeholder: "e.g. No intubation, comfort care preferred" },
      ],
      skippable: true,
    },
  },
  {
    id: "legal-4",
    text: "Do you know where ALL of your parent's important legal documents are?",
    subtext: "Deed, title, insurance policies, tax returns, Social Security card, birth certificate.",
    options: ["Yes, I know where everything is", "I know where some things are", "No idea"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I know where everything is"],
      prompt: "Note the primary location(s).",
      fields: [
        { key: "docsLocation", label: "Primary document storage location", placeholder: "e.g. Home office filing cabinet, safe deposit box at Wells Fargo" },
      ],
      skippable: true,
    },
  },
  {
    id: "legal-5",
    text: "Has your parent discussed their end-of-life wishes with you?",
    subtext: "This conversation is hard — but not having it is harder when the moment comes.",
    options: ["Yes, in detail", "Briefly / informally", "Not at all"],
    allowUncertainty: false,
  },
];

// Financial Domain Questions
const financialQuestions: Question[] = [
  {
    id: "fin-1",
    text: "If you had to pay your parent's bills next month, could you?",
    subtext: "Do you know their income sources, bank accounts, and recurring expenses?",
    options: ["Yes, I have full financial visibility", "I know some but not everything", "No visibility"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I have full financial visibility"],
      prompt: "Note the key financial accounts and income sources.",
      fields: [
        { key: "incomeSource", label: "Primary income sources", placeholder: "e.g. Social Security $1,800/mo, pension $1,200/mo" },
        { key: "bankInfo", label: "Primary bank / accounts", placeholder: "e.g. Chase checking, Fidelity IRA" },
      ],
      skippable: true,
    },
  },
  {
    id: "fin-2",
    text: "Do you know what your parent spends each month — and on what?",
    subtext: "Mortgage/rent, utilities, medications, insurance premiums, food, transportation.",
    options: ["Yes, detailed understanding", "General idea", "No"],
    allowUncertainty: true,
  },
  {
    id: "fin-3",
    text: "Does your parent have long-term care insurance?",
    subtext: "This can cover $5,000-$10,000/month in care costs. Without it, savings drain fast.",
    options: ["Yes, active policy", "No", "Had it but it lapsed"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, active policy"],
      prompt: "Capture the policy details — you'll need these to file a claim.",
      fields: [
        { key: "ltcCarrier", label: "Insurance company", placeholder: "e.g. Genworth, Mutual of Omaha" },
        { key: "ltcPolicy", label: "Policy number", placeholder: "e.g. LTC-4567890" },
        { key: "ltcPhone", label: "Claims phone", placeholder: "e.g. 1-800-555-0123", type: "tel" },
      ],
      skippable: true,
    },
  },
  {
    id: "fin-4",
    text: "Could you access your parent's financial accounts in an emergency?",
    subtext: "Joint account, power of attorney, or authorized user status — you need at least one.",
    options: ["Yes, joint accounts or POA", "Limited access", "No access"],
    allowUncertainty: true,
  },
  {
    id: "fin-5",
    text: "Is there an estate plan or trust in place?",
    subtext: "This protects assets and avoids probate — especially important if Medicaid may be needed.",
    options: ["Yes, up to date", "Yes, but needs review", "No"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, up to date"],
      prompt: "Note the attorney or firm managing the estate plan.",
      fields: [
        { key: "estateAttorney", label: "Estate attorney / firm", placeholder: "e.g. Johnson Elder Law, (555) 789-0123" },
      ],
      skippable: true,
    },
  },
  {
    id: "fin-6",
    text: "Could your parent afford 6+ months of assisted living or in-home care if needed?",
    subtext: "Assisted living averages $4,500-$8,000/month. In-home care can run $25-$35/hour.",
    options: ["Yes, comfortably", "Possibly with adjustments", "No — would need Medicaid", "No idea"],
    allowUncertainty: true,
  },
];

// Housing Domain Questions
const housingQuestions: Question[] = [
  {
    id: "house-1",
    text: "Where does your parent currently live?",
    options: ["Own home", "Rental", "With family", "Senior living community", "Other"],
    allowUncertainty: false,
    followUp: {
      triggerOptions: ["Own home", "Rental", "With family", "Senior living community", "Other"],
      prompt: "Note the address so it's in your care record.",
      fields: [
        { key: "address", label: "Address or location", placeholder: "e.g. 123 Oak St, Sacramento, CA" },
      ],
      skippable: true,
    },
  },
  {
    id: "house-2",
    text: "If your parent fell at home tonight, would the home be set up to prevent or respond to it?",
    subtext: "Falls are the #1 cause of injury in seniors. Grab bars, lighting, and clear pathways matter.",
    options: ["Yes, home is adapted for safety", "Needs modifications", "Not suitable for aging in place", "Haven't assessed"],
    allowUncertainty: true,
  },
  {
    id: "house-3",
    text: "Are there safety features installed (grab bars, non-slip mats, stair rails, emergency alert)?",
    options: ["Yes, comprehensive", "Some features", "None"],
    allowUncertainty: false,
  },
  {
    id: "house-4",
    text: "Has your parent told you where they want to live as they age?",
    subtext: "Knowing their wishes before a crisis avoids rushed decisions under pressure.",
    options: ["Yes, clear preferences", "Briefly discussed", "Not at all", "Actively planning a move"],
    allowUncertainty: false,
  },
  {
    id: "house-5",
    text: "If your parent couldn't stay in their current home, do you have a plan?",
    subtext: "Waitlists for good facilities can be 6-18 months. Planning ahead matters.",
    options: ["Yes, researched options", "General ideas", "No plan"],
    allowUncertainty: true,
  },
  {
    id: "house-6",
    text: "Does your parent have reliable support for daily tasks (meals, cleaning, transportation)?",
    subtext: "Can they get groceries, get to appointments, and maintain their home?",
    options: ["Yes, adequate support", "Some support but gaps exist", "Managing alone", "Struggling"],
    allowUncertainty: true,
  },
];

// Transportation Domain Questions
const transportationQuestions: Question[] = [
  {
    id: "trans-1",
    text: "Can your parent get to a doctor's appointment on their own?",
    subtext: "Missed appointments are one of the top reasons health declines accelerate.",
    options: ["Yes, they drive themselves", "Yes, with public transit or ride service", "Only if someone takes them", "No, they're homebound"],
    allowUncertainty: true,
  },
  {
    id: "trans-2",
    text: "If your parent had a non-emergency medical appointment tomorrow, how would they get there?",
    subtext: "Reliable transportation to medical care is a basic need that often breaks down gradually.",
    options: ["They'd drive", "Family member would take them", "They'd use a ride service (Uber, Lyft, etc.)", "They'd use a medical transport service", "I'm not sure"],
    allowUncertainty: true,
  },
  {
    id: "trans-3",
    text: "Is your parent still driving — and should they be?",
    subtext: "This is one of the hardest conversations. But unsafe driving puts everyone at risk.",
    options: ["Yes, driving safely", "Driving but I have concerns", "Voluntarily stopped driving", "License revoked / shouldn't drive", "Not applicable"],
    allowUncertainty: true,
  },
  {
    id: "trans-4",
    text: "Does your parent have access to grocery delivery, pharmacy delivery, or errand help?",
    subtext: "When someone can't drive, basic errands become a major challenge.",
    options: ["Yes, reliable delivery/errand services", "Some services but not consistent", "No, they depend on others for errands"],
    allowUncertainty: true,
  },
  {
    id: "trans-5",
    text: "Do you know about transportation assistance programs available in your parent's area?",
    subtext: "Many communities offer free or subsidized rides for seniors — most families don't know about them.",
    options: ["Yes, we use them", "I know they exist but haven't set them up", "No, I haven't looked into this"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, we use them"],
      prompt: "Note the services you use so they're in your care record.",
      fields: [
        { key: "transportService", label: "Service name(s)", placeholder: "e.g. GoGoGrandparent, county senior shuttle, Medicaid transport" },
        { key: "transportPhone", label: "Phone to schedule rides", placeholder: "e.g. (555) 123-4567", type: "tel" },
      ],
      skippable: true,
    },
  },
];

// Social Domain Questions
const socialQuestions: Question[] = [
  {
    id: "social-1",
    text: "Do you know who your parent talks to regularly — friends, neighbors, community?",
    subtext: "Social isolation is one of the strongest predictors of decline in seniors.",
    options: ["Yes, I know their social circle", "I know some people but not all", "No, I don't really know"],
    allowUncertainty: true,
  },
  {
    id: "social-2",
    text: "Could you reach your parent's closest friends or neighbors in an emergency?",
    subtext: "In a crisis, these people can check on your parent faster than you can get there.",
    options: ["Yes, I have their contact info", "I know who they are but don't have contact info", "No"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, I have their contact info"],
      prompt: "Capture their key contacts so you can reach them in a crisis.",
      fields: [
        { key: "friendName", label: "Friend/neighbor name", placeholder: "e.g. Betty next door, Jim from church" },
        { key: "friendPhone", label: "Phone number", placeholder: "e.g. (555) 987-6543", type: "tel" },
      ],
      skippable: true,
    },
  },
  {
    id: "social-3",
    text: "Does your parent participate in any regular social activities?",
    subtext: "Church, senior center, card games, volunteer work — routine social contact matters.",
    options: ["Yes, regularly", "Occasionally", "No, they're mostly at home"],
    allowUncertainty: true,
  },
  {
    id: "social-4",
    text: "Has your parent's social circle shrunk noticeably in recent years?",
    subtext: "Losing friends and connections is common with aging but accelerates decline.",
    options: ["No, it's stable", "Somewhat — a few people have dropped off", "Yes, significantly"],
    allowUncertainty: true,
  },
  {
    id: "social-5",
    text: "Is there someone who checks on your parent regularly (besides you)?",
    subtext: "A neighbor, friend, or aide who sees them routinely can catch problems early.",
    options: ["Yes, someone checks regularly", "Occasionally but not reliably", "No, just me"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, someone checks regularly"],
      prompt: "Note who checks on them — this person is a key part of the care network.",
      fields: [
        { key: "checkerName", label: "Who checks on them?", placeholder: "e.g. Neighbor Betty, aide Maria" },
        { key: "checkerFrequency", label: "How often?", placeholder: "e.g. Daily, every other day, weekly" },
      ],
      skippable: true,
    },
  },
  {
    id: "social-6",
    text: "Does your parent have any pets?",
    subtext: "Pets are important companions — but they also need a care plan if your parent can't look after them.",
    options: ["Yes", "No"],
    allowUncertainty: false,
    followUp: {
      triggerOptions: ["Yes"],
      prompt: "Note the pet details so there's a plan if care is needed.",
      fields: [
        { key: "petType", label: "Type of pet(s)", placeholder: "e.g. Dog (golden retriever), two cats" },
        { key: "petName", label: "Pet name(s)", placeholder: "e.g. Buddy, Whiskers" },
      ],
      skippable: true,
    },
  },
  {
    id: "social-7",
    text: "If your parent were hospitalized or needed care, is there a plan for who would look after their pet(s)?",
    subtext: "Pets left without care can end up in shelters. Having a backup plan prevents this.",
    options: ["Yes, someone is lined up", "Informally — but nothing definite", "No plan", "No pets"],
    allowUncertainty: true,
    followUp: {
      triggerOptions: ["Yes, someone is lined up"],
      prompt: "Note who would take care of the pet(s).",
      fields: [
        { key: "petCaretaker", label: "Pet backup caretaker", placeholder: "e.g. Neighbor Sue, daughter Lisa" },
        { key: "petCaretakerPhone", label: "Their phone number", placeholder: "e.g. (555) 123-4567", type: "tel" },
      ],
      skippable: true,
    },
  },
];

export const DOMAIN_QUESTIONS: DomainQuestions[] = [
  {
    domain: "medical",
    title: "Medical Readiness",
    description: "Could you handle a medical emergency for your parent right now? Let's find out — and capture what you know.",
    questions: medicalQuestions,
  },
  {
    domain: "legal",
    title: "Legal Readiness",
    description: "Do you have the legal authority and documents you'd need in a crisis? Let's check and record what's in place.",
    questions: legalQuestions,
  },
  {
    domain: "financial",
    title: "Financial Readiness",
    description: "Could you manage your parent's finances if they couldn't? Let's assess and capture the key details.",
    questions: financialQuestions,
  },
  {
    domain: "housing",
    title: "Housing Readiness",
    description: "Is your parent's living situation safe and sustainable? Let's evaluate and plan ahead.",
    questions: housingQuestions,
  },
  {
    domain: "transportation",
    title: "Transportation Readiness",
    description: "Can your parent get where they need to go — doctors, groceries, pharmacy? Let's check.",
    questions: transportationQuestions,
  },
  {
    domain: "social",
    title: "Social & Pets",
    description: "Do you know your parent's social circle — friends, neighbors, and who checks on them? We'll also cover pet care planning. Social isolation is a critical risk factor.",
    questions: socialQuestions,
  },
];

export interface Answer {
  questionId: string;
  selectedOption: string | null;
  isUncertain: boolean;
  /** Data captured from follow-up fields */
  capturedData?: Record<string, string>;
}

export interface DomainScore {
  domain: Domain;
  score: number; // 0-100
  gaps: string[]; // Areas marked as uncertain or problematic
  strengths: string[]; // Areas that are well-covered
}

export interface ReadinessScore {
  overall: number; // 0-100
  domains: DomainScore[];
  completedAt: string;
}
