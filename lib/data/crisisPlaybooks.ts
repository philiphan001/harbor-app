// Static playbook content for ER triage crisis types — no AI/API calls

export type CrisisType = "fall" | "stroke-cardiac" | "cognitive-decline" | "hospitalization";

export interface PlaybookStep {
  text: string;
  detail?: string;
  urgent: boolean;
}

export interface PlaybookSection {
  title: string;
  steps: PlaybookStep[];
}

export interface CrisisPlaybook {
  id: CrisisType;
  label: string;
  icon: string;
  description: string;
  sections: PlaybookSection[];
}

export const CRISIS_PLAYBOOKS: CrisisPlaybook[] = [
  {
    id: "fall",
    label: "Fall / Fracture",
    icon: "🦴",
    description: "Hip fracture, broken bone, or serious fall requiring ER visit",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Ask if surgery is needed and the timeline", detail: "Hip fractures often need surgery within 24–48 hours. Ask the orthopedic surgeon about the plan.", urgent: true },
          { text: "Request a pain management plan", detail: "Ensure adequate pain control is in place — ask about both scheduled and as-needed options.", urgent: true },
          { text: "Ask about blood thinners and surgical risks", detail: "If your parent takes blood thinners, the surgical team needs to know immediately.", urgent: true },
          { text: "Request a physical therapy consult", detail: "Early PT evaluation helps plan recovery. Ask for PT to assess before or shortly after surgery.", urgent: false },
          { text: "Confirm fall circumstances with the care team", detail: "Was it a mechanical fall (tripped) or medical (dizziness, fainting)? This affects the workup.", urgent: false },
        ],
      },
      {
        title: "Before Discharge",
        steps: [
          { text: "Get a rehab facility plan", detail: "Most hip fractures need inpatient rehab (SNF). Ask the case manager about options and insurance coverage.", urgent: true },
          { text: "Request a home safety evaluation referral", detail: "An occupational therapist can assess the home for fall risks before your parent returns.", urgent: false },
          { text: "Ask about bone density testing", detail: "If not recently done, a DEXA scan can identify osteoporosis that needs treatment.", urgent: false },
          { text: "Get a medication review", detail: "Some medications increase fall risk (sleep aids, blood pressure meds). Ask the pharmacist to review.", urgent: false },
          { text: "Clarify weight-bearing restrictions", detail: "Understand exactly what your parent can and cannot do physically during recovery.", urgent: true },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Install grab bars and remove tripping hazards at home", detail: "Bathroom grab bars, remove loose rugs, improve lighting in hallways and stairs.", urgent: false },
          { text: "Arrange follow-up with orthopedic surgeon", detail: "Typically 2 weeks post-surgery for wound check and X-ray.", urgent: false },
          { text: "Set up home health or outpatient PT", detail: "Continuous physical therapy is critical for recovery. Start arranging before discharge.", urgent: false },
          { text: "Get a walker or assistive device fitted", detail: "PT will recommend the right device. Make sure it's properly adjusted for height.", urgent: false },
          { text: "Notify primary care doctor about the fall and hospitalization", detail: "PCP should be in the loop for follow-up care coordination.", urgent: false },
        ],
      },
    ],
  },
  {
    id: "stroke-cardiac",
    label: "Stroke / Cardiac",
    icon: "❤️",
    description: "Stroke symptoms, heart attack, or acute cardiac event",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Confirm the time symptoms started", detail: "For stroke: tPA (clot-busting drug) must be given within 4.5 hours of symptom onset. Every minute matters.", urgent: true },
          { text: "Ask if this is a stroke center / cardiac center", detail: "If not, ask about transfer to a certified stroke or cardiac center for specialized care.", urgent: true },
          { text: "Provide the complete medication list to the team", detail: "Blood thinners, blood pressure meds, and diabetes medications are especially critical to communicate.", urgent: true },
          { text: "Ask about the treatment plan and interventions", detail: "Stroke: tPA, thrombectomy? Cardiac: catheterization, stent, bypass? Understand what's being considered.", urgent: true },
          { text: "Request a neurology or cardiology consult", detail: "Specialist involvement early improves outcomes. Ask if one has been consulted.", urgent: false },
        ],
      },
      {
        title: "Before Discharge",
        steps: [
          { text: "Get a clear understanding of the diagnosis and prognosis", detail: "What type of stroke/cardiac event? What's the expected recovery trajectory?", urgent: true },
          { text: "Ask about driving restrictions", detail: "Most states require a waiting period after stroke or cardiac event before driving is allowed.", urgent: true },
          { text: "Understand new medications and their purpose", detail: "Blood thinners, statins, blood pressure meds — know what changed and why.", urgent: true },
          { text: "Request rehabilitation assessment", detail: "Stroke patients often need inpatient rehab for speech, physical, and occupational therapy.", urgent: false },
          { text: "Ask about cardiac or stroke rehab programs", detail: "Structured outpatient rehab programs significantly improve recovery outcomes.", urgent: false },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Schedule follow-up with neurologist or cardiologist", detail: "Usually within 1–2 weeks of discharge for reassessment and medication adjustment.", urgent: false },
          { text: "Set up home monitoring if prescribed", detail: "Blood pressure monitor, heart rate monitor, or Holter monitor as directed.", urgent: false },
          { text: "Review and implement dietary changes", detail: "Low-sodium, heart-healthy diet. Consider a nutritionist consult.", urgent: false },
          { text: "Assess home for accessibility needs", detail: "Stroke may cause mobility or cognitive changes requiring home modifications.", urgent: false },
          { text: "Notify all other doctors about the event", detail: "PCP, other specialists need to know for medication coordination and ongoing care.", urgent: false },
        ],
      },
    ],
  },
  {
    id: "cognitive-decline",
    label: "Cognitive Decline",
    icon: "🧠",
    description: "Sudden confusion, wandering, memory crisis, or new dementia diagnosis",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Ask the ER to rule out delirium (reversible causes)", detail: "UTIs, medication reactions, dehydration, and infections can cause sudden confusion that looks like dementia but is treatable.", urgent: true },
          { text: "Request a medication review for cognitive side effects", detail: "Anticholinergics, benzodiazepines, and some pain meds can cause or worsen confusion.", urgent: true },
          { text: "Assess immediate safety concerns", detail: "Can your parent be left alone? Is there wandering risk? Are they able to manage medications and cooking safely?", urgent: true },
          { text: "Ask about baseline cognitive testing", detail: "If not recently done, request a cognitive screening (MMSE or MoCA) to establish a baseline.", urgent: false },
          { text: "Document the timeline of changes", detail: "When did you first notice changes? Sudden onset suggests delirium; gradual suggests dementia.", urgent: false },
        ],
      },
      {
        title: "Before Discharge",
        steps: [
          { text: "Get a referral for full neuropsychological evaluation", detail: "A thorough evaluation distinguishes dementia types and guides treatment planning.", urgent: true },
          { text: "Ask about legal capacity while your parent can still participate", detail: "If dementia is progressing, now is the time to establish POA, advance directives, and healthcare proxy.", urgent: true },
          { text: "Request a driving evaluation referral", detail: "Cognitive decline often impairs driving ability. An occupational therapy driving eval provides an objective assessment.", urgent: false },
          { text: "Ask about wandering prevention strategies", detail: "Door alarms, GPS trackers, ID bracelets — especially if there's any history of wandering.", urgent: false },
          { text: "Get a social work consult for care planning", detail: "Hospital social workers can connect you with dementia support resources and day programs.", urgent: false },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Secure the home environment", detail: "Remove or lock up dangerous items, secure stove knobs, lock medications, install door chimes.", urgent: false },
          { text: "Set up a medication management system", detail: "Pill organizers, medication reminders, or a pharmacy blister-pack service.", urgent: false },
          { text: "Research local Alzheimer's/dementia support groups", detail: "Both for your parent and for yourself as caregiver. The Alzheimer's Association has a 24/7 helpline.", urgent: false },
          { text: "Review financial accounts for vulnerability", detail: "People with cognitive decline are targets for scams. Consider adding account alerts or trusted contacts.", urgent: false },
          { text: "Start a care journal", detail: "Track symptoms, behaviors, and changes daily. This information is invaluable for doctors.", urgent: false },
        ],
      },
    ],
  },
  {
    id: "hospitalization",
    label: "Hospitalization (General)",
    icon: "🏥",
    description: "Any hospital admission — surgery, illness, or medical emergency",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Verify insurance coverage and get pre-authorization if needed", detail: "Call the insurance company's emergency line. Note the authorization number. Ask about in-network vs out-of-network.", urgent: true },
          { text: "Know your parent's patient rights", detail: "They have the right to informed consent, a second opinion, and to refuse treatment. Ask for the patient advocate.", urgent: true },
          { text: "Start discharge planning from day 1", detail: "Ask to speak with the case manager or discharge planner. Early planning prevents unsafe discharges.", urgent: true },
          { text: "Bring or request a complete medication reconciliation", detail: "Every medication, vitamin, and supplement with doses. This prevents dangerous drug interactions.", urgent: true },
          { text: "Identify the attending physician and care team", detail: "Know who is in charge of your parent's care. Ask for their name and how to reach them with questions.", urgent: false },
        ],
      },
      {
        title: "Before Discharge",
        steps: [
          { text: "Get a written discharge plan with follow-up appointments", detail: "Don't leave without a clear plan: medications, restrictions, warning signs, and follow-up dates.", urgent: true },
          { text: "Request a home health referral if needed", detail: "Visiting nurses, home PT, wound care — ask the case manager what services are appropriate.", urgent: true },
          { text: "Complete medication reconciliation at discharge", detail: "Compare the discharge medication list to what they were taking before. Ask about every change.", urgent: true },
          { text: "Understand warning signs that require return to ER", detail: "Get a specific list of symptoms or changes that mean you should come back immediately.", urgent: false },
          { text: "Arrange transportation home and any needed equipment", detail: "Hospital bed, wheelchair, walker, commode — ensure everything is arranged before discharge day.", urgent: false },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Fill all new prescriptions before leaving the pharmacy area", detail: "Many hospitals have an on-site pharmacy. Fill everything before you leave to avoid gaps in medication.", urgent: false },
          { text: "Schedule all follow-up appointments", detail: "PCP within 7 days, specialist follow-ups as directed. Don't wait — book now.", urgent: false },
          { text: "Set up the home recovery space", detail: "Bed on the main floor if needed, clear pathways, stock easy-to-prepare meals, organize medications.", urgent: false },
          { text: "Submit insurance claims and review bills", detail: "Keep all paperwork. Review the itemized bill for errors. Know your appeal rights.", urgent: false },
          { text: "Notify other family members and coordinate help", detail: "Create a schedule for visitors, meal deliveries, and care shifts. Don't try to do it all alone.", urgent: false },
        ],
      },
    ],
  },
];
