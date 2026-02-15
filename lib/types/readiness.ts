import { Domain } from "@/components/DomainProgress";

export interface Question {
  id: string;
  text: string;
  options: string[];
  allowUncertainty: boolean; // Allow "I don't know" / "Not certain"
}

export interface DomainQuestions {
  domain: Domain;
  title: string;
  description: string;
  questions: Question[];
}

// Medical Domain Questions
const medicalQuestions: Question[] = [
  {
    id: "med-1",
    text: "Does your parent have a primary care physician?",
    options: ["Yes, regular visits", "Yes, but rarely visits", "No"],
    allowUncertainty: true,
  },
  {
    id: "med-2",
    text: "Are you aware of all current medications your parent takes?",
    options: ["Yes, I have a complete list", "Partially aware", "No"],
    allowUncertainty: true,
  },
  {
    id: "med-3",
    text: "Does your parent have any chronic health conditions?",
    options: ["Yes, well-managed", "Yes, but management is inconsistent", "No conditions", "Yes, but declining"],
    allowUncertainty: true,
  },
  {
    id: "med-4",
    text: "Do you have access to your parent's medical records?",
    options: ["Yes, full access", "Limited access", "No access"],
    allowUncertainty: true,
  },
  {
    id: "med-5",
    text: "Does your parent have Medicare or other health insurance?",
    options: ["Yes, Medicare", "Yes, private insurance", "Yes, both", "No insurance"],
    allowUncertainty: true,
  },
  {
    id: "med-6",
    text: "Is there a healthcare proxy or medical power of attorney in place?",
    options: ["Yes, documented", "In progress", "No", "Don't understand what this is"],
    allowUncertainty: true,
  },
];

// Legal Domain Questions
const legalQuestions: Question[] = [
  {
    id: "legal-1",
    text: "Does your parent have a will?",
    options: ["Yes, recent (within 5 years)", "Yes, but outdated", "No", "In progress"],
    allowUncertainty: true,
  },
  {
    id: "legal-2",
    text: "Is there a durable power of attorney established?",
    options: ["Yes, documented", "In progress", "No", "Don't understand what this is"],
    allowUncertainty: true,
  },
  {
    id: "legal-3",
    text: "Does your parent have advance directives (living will, DNR)?",
    options: ["Yes, documented", "Discussed but not documented", "No"],
    allowUncertainty: true,
  },
  {
    id: "legal-4",
    text: "Do you know where important legal documents are stored?",
    options: ["Yes, I have access", "I know where they are", "No idea"],
    allowUncertainty: true,
  },
  {
    id: "legal-5",
    text: "Has your parent discussed their end-of-life wishes with you?",
    options: ["Yes, in detail", "Briefly", "Not at all"],
    allowUncertainty: false,
  },
];

// Financial Domain Questions
const financialQuestions: Question[] = [
  {
    id: "fin-1",
    text: "Do you know your parent's monthly income sources?",
    options: ["Yes, complete picture", "Partially aware", "No"],
    allowUncertainty: true,
  },
  {
    id: "fin-2",
    text: "Are you aware of your parent's monthly expenses?",
    options: ["Yes, detailed understanding", "General idea", "No"],
    allowUncertainty: true,
  },
  {
    id: "fin-3",
    text: "Does your parent have long-term care insurance?",
    options: ["Yes", "No", "Had it but lapsed"],
    allowUncertainty: true,
  },
  {
    id: "fin-4",
    text: "Do you have access to your parent's financial accounts (if needed)?",
    options: ["Yes, joint accounts or POA", "Limited access", "No access"],
    allowUncertainty: true,
  },
  {
    id: "fin-5",
    text: "Is there an estate plan or trust in place?",
    options: ["Yes, up to date", "Yes, but needs review", "No"],
    allowUncertainty: true,
  },
  {
    id: "fin-6",
    text: "Could your parent afford 6+ months of assisted living if needed?",
    options: ["Yes, easily", "Possibly with adjustments", "No", "Would need Medicaid"],
    allowUncertainty: true,
  },
];

// Housing Domain Questions
const housingQuestions: Question[] = [
  {
    id: "house-1",
    text: "Where does your parent currently live?",
    options: ["Own home", "Rental", "With family", "Senior living community"],
    allowUncertainty: false,
  },
  {
    id: "house-2",
    text: "Is your parent's current home safe for aging in place?",
    options: ["Yes, fully accessible", "Needs modifications", "Not suitable", "Haven't assessed"],
    allowUncertainty: true,
  },
  {
    id: "house-3",
    text: "Are there safety features installed (grab bars, ramps, etc.)?",
    options: ["Yes, comprehensive", "Some features", "None"],
    allowUncertainty: false,
  },
  {
    id: "house-4",
    text: "Has your parent discussed future living arrangements with you?",
    options: ["Yes, clear preferences", "Briefly", "Not at all", "Actively planning a move"],
    allowUncertainty: false,
  },
  {
    id: "house-5",
    text: "If your parent needed to move, is there a plan?",
    options: ["Yes, researched options", "General ideas", "No plan"],
    allowUncertainty: true,
  },
  {
    id: "house-6",
    text: "Does your parent have support for daily tasks (cleaning, cooking, transportation)?",
    options: ["Yes, adequate support", "Some support", "Managing alone", "Struggling"],
    allowUncertainty: true,
  },
];

export const DOMAIN_QUESTIONS: DomainQuestions[] = [
  {
    domain: "medical",
    title: "Medical Readiness",
    description: "Understanding your parent's healthcare situation and medical planning",
    questions: medicalQuestions,
  },
  {
    domain: "legal",
    title: "Legal Readiness",
    description: "Legal documents, powers of attorney, and end-of-life planning",
    questions: legalQuestions,
  },
  {
    domain: "financial",
    title: "Financial Readiness",
    description: "Income, expenses, insurance, and long-term financial planning",
    questions: financialQuestions,
  },
  {
    domain: "housing",
    title: "Housing Readiness",
    description: "Current living situation and future housing plans",
    questions: housingQuestions,
  },
];

export interface Answer {
  questionId: string;
  selectedOption: string | null;
  isUncertain: boolean; // User clicked "I don't know" or "Not certain"
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
