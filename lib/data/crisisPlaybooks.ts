// Static playbook content for ER triage crisis types — no AI/API calls

export type CrisisType = "fall" | "stroke-cardiac" | "cognitive-decline" | "hospitalization" | "delirium" | "fall-no-er";

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
  {
    id: "delirium",
    label: "Sudden Confusion / Delirium",
    icon: "😵",
    description: "Acute confusion, disorientation, or sudden personality change — often treatable",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Tell the ER this is a sudden change, not baseline", detail: "Delirium is acute (hours/days). If your parent was functioning normally before, say so clearly — this changes the workup. Don't let staff assume it's dementia.", urgent: true },
          { text: "Request bloodwork and urinalysis immediately", detail: "UTIs are the #1 cause of sudden confusion in elderly patients. Also check for infection, electrolyte imbalance, dehydration, and blood sugar.", urgent: true },
          { text: "Provide the complete medication list", detail: "Anticholinergics, benzodiazepines, opioids, steroids, and sleep aids are common delirium triggers. Recent medication changes are especially suspect.", urgent: true },
          { text: "Ask about recent medication changes or new prescriptions", detail: "A new drug started in the past 1–2 weeks is a common culprit. Even over-the-counter meds like Benadryl can cause delirium in seniors.", urgent: true },
          { text: "Note when the confusion started and how it's fluctuating", detail: "Delirium waxes and wanes — they may seem fine one hour and confused the next. Track and document the pattern for the care team.", urgent: false },
        ],
      },
      {
        title: "While in the ER / Hospital",
        steps: [
          { text: "Push for a cause — don't accept 'just old age'", detail: "Delirium always has a cause. If the initial tests are negative, ask about CT scan, chest X-ray, or medication toxicity levels.", urgent: true },
          { text: "Request a medication review by a pharmacist", detail: "Hospital pharmacists can identify drug interactions and medications known to cause confusion in elderly patients.", urgent: true },
          { text: "Stay with your parent if possible", detail: "Familiar faces reduce agitation and disorientation. Bring familiar objects — glasses, hearing aids, family photos.", urgent: false },
          { text: "Maintain day/night orientation", detail: "Keep blinds open during the day, lights low at night. Reorient them: 'It's Tuesday afternoon, you're at the hospital.'", urgent: false },
          { text: "Ask about hydration and nutrition", detail: "Dehydration and malnutrition worsen confusion. Make sure they're getting adequate fluids and food.", urgent: false },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Follow up with PCP within 3–5 days", detail: "Delirium can take days to weeks to fully resolve. PCP should monitor recovery and re-evaluate medications.", urgent: false },
          { text: "Review all medications with PCP or pharmacist", detail: "Use this event to do a thorough medication cleanup. Ask if each medication is still necessary.", urgent: false },
          { text: "Monitor for recurrence", detail: "One delirium episode increases the risk of future episodes. Track mental status daily for the next 2 weeks.", urgent: false },
          { text: "Ensure adequate hydration at home", detail: "Dehydration is a common and preventable trigger. Aim for 6–8 glasses of fluid daily unless restricted by a doctor.", urgent: false },
          { text: "Consider a cognitive baseline test", detail: "After delirium resolves (2–4 weeks), a cognitive screening can establish whether there's any underlying decline.", urgent: false },
        ],
      },
    ],
  },
  {
    id: "fall-no-er",
    label: "Fall (No ER Visit)",
    icon: "⚠️",
    description: "Parent fell but didn't go to the ER — what to watch for and do next",
    sections: [
      {
        title: "Do Right Now",
        steps: [
          { text: "Assess for hidden injuries", detail: "Check for pain in hips, wrists, ribs, and head. Seniors may minimize pain or not feel it immediately. Bruising may take hours to appear.", urgent: true },
          { text: "Watch for head injury warning signs", detail: "Headache, confusion, dizziness, nausea, vision changes, or drowsiness in the next 24–72 hours could indicate a subdural hematoma. This can be fatal — go to the ER immediately if any appear.", urgent: true },
          { text: "Check if they're on blood thinners", detail: "Warfarin, Eliquis, Xarelto, or aspirin increase bleeding risk. Even a minor head bump on blood thinners warrants medical evaluation. Call the doctor.", urgent: true },
          { text: "Document what happened", detail: "Where did they fall? What were they doing? Did they trip, feel dizzy, or lose balance? Was there a loss of consciousness? This helps the doctor assess the cause.", urgent: false },
          { text: "Help them rest and apply ice to any sore areas", detail: "Ice for 20 minutes on, 20 off. Monitor for increasing pain or swelling over the next few hours.", urgent: false },
        ],
      },
      {
        title: "Next 24–72 Hours",
        steps: [
          { text: "Call their primary care doctor", detail: "Report the fall even if your parent seems fine. Falls are a major red flag in geriatrics — the PCP should know and may want to see them.", urgent: true },
          { text: "Continue monitoring for delayed symptoms", detail: "Subdural hematomas can appear 1–3 days after a fall. Watch for: increasing headache, confusion, one-sided weakness, difficulty speaking, excessive sleepiness.", urgent: true },
          { text: "Watch for difficulty walking or bearing weight", detail: "Hairline fractures (especially hip) may not show obvious symptoms initially but worsen over 24–48 hours. If they can't bear weight, go to the ER.", urgent: false },
          { text: "Check for new bruising", detail: "Large or spreading bruises, especially on the torso or head, may indicate internal bleeding. Call the doctor if concerning.", urgent: false },
          { text: "Assess their confidence and fear of falling", detail: "Fear of falling after a fall often leads to reduced activity, which increases weakness and future fall risk. Acknowledge the fear and encourage gentle movement.", urgent: false },
        ],
      },
      {
        title: "This Week",
        steps: [
          { text: "Do a home safety walkthrough", detail: "Remove loose rugs, improve lighting, install grab bars in the bathroom, clear clutter from walkways, secure electrical cords. Use the Harbor Home Safety checklist.", urgent: false },
          { text: "Request a medication fall-risk review", detail: "Ask the doctor or pharmacist to review all medications for fall risk: blood pressure meds, sleep aids, pain medications, and antidepressants are common culprits.", urgent: false },
          { text: "Ask about physical therapy for balance", detail: "A PT evaluation can identify balance and strength deficits. Programs like Otago or Tai Chi reduce fall risk by 30–50%.", urgent: false },
          { text: "Check their vision and hearing", detail: "When was their last eye exam? Poor vision and hearing loss both increase fall risk. Schedule appointments if overdue.", urgent: false },
          { text: "Consider a medical alert device", detail: "If they live alone or fall when no one is around, a wearable alert device (Life Alert, Apple Watch fall detection) can be life-saving.", urgent: false },
          { text: "Get proper footwear", detail: "Non-slip, well-fitting shoes worn at all times indoors. No walking in socks, slippers, or bare feet on smooth floors.", urgent: false },
        ],
      },
    ],
  },
];
