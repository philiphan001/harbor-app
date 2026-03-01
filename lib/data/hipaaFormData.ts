// HIPAA Authorization form data — universal federal form (same in all states)

import { getStateFormInfo } from "./stateHealthcareProxyForms";

export const HIPAA_FORM = {
  title: "HIPAA Authorization for Release of Medical Information",
  description:
    "A federal form that authorizes healthcare providers to share your parent's medical information with you or another designated person.",
  pdfPath: "/forms/hipaa/HIPAA_Authorization.pdf",
  downloadFileName: "HIPAA_Authorization.pdf",
  requirements: {
    notaryRequired: false,
    witnessesRequired: false,
    parentSignature: true,
  },
  estimatedCompletionTime: "5-10 minutes",
};

export const HIPAA_COMPLETION_CHECKLIST = [
  { id: "filled", label: "Fill out the authorization form" },
  { id: "signed", label: "Signed by your parent" },
  { id: "distributed", label: "Give a copy to each healthcare provider" },
  { id: "kept-copy", label: "Keep a copy for your records" },
];

export const HIPAA_PITFALLS = [
  "Not giving a copy to every provider — each doctor's office, hospital, pharmacy, and specialist needs their own copy",
  "Assuming a healthcare proxy or POA covers HIPAA — it doesn't automatically; a separate authorization is often needed",
  "Waiting until your parent is incapacitated — they must be able to sign the form themselves",
  "Forgetting to update the form when switching providers or adding new specialists",
];

export const HIPAA_ONLINE_SERVICES = [
  {
    name: "HIPAA Authorization Generator",
    url: "https://www.rocketlawyer.com/family-and-personal/personal-health/hipaa-authorization",
    cost: "Free with trial",
    features: [
      "Guided form builder",
      "Fillable HIPAA authorization",
      "Download and print",
    ],
  },
];

/**
 * Returns a note when the state's advance directive form already includes
 * HIPAA authorization language, or null if it doesn't (or state is unknown).
 */
export function getStateHipaaNote(stateCode: string): string | null {
  const info = getStateFormInfo(stateCode);
  if (!info) return null;
  if (!info.includesHIPAA) return null;
  return `Good news — ${info.state}'s ${info.terminology} form already includes HIPAA authorization language. You may still want a standalone HIPAA form if you need to give providers access before completing the advance directive, or if a provider requires a separate authorization.`;
}
