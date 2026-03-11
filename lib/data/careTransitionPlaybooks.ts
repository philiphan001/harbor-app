import type { CareTransitionPlaybook } from "@/lib/types/careTransitions";

export const CARE_TRANSITION_PLAYBOOKS: CareTransitionPlaybook[] = [
  // ─── Hospital → Home ───────────────────────────────────────────────
  {
    id: "hospital_to_home",
    label: "Hospital → Home",
    icon: "🏠",
    overview:
      "This playbook activates when a hospitalization is logged and the discharge destination is home. Hospital-to-home transitions are the most common and most time-pressured care transition — discharge decisions often happen faster than families expect, and gaps in the transition are a leading cause of hospital readmission.",
    trigger: {
      lifeEventType: "hospitalization",
      milestoneIds: ["hospital_3day_rule_snf"],
      description: "Hospitalization logged with discharge destination home",
    },
    steps: [
      {
        stepNumber: 1,
        title: "Confirm Admission Status",
        description:
          "Verify whether {parent_name} has been admitted as an inpatient or is under observation status. This distinction affects Medicare coverage for post-acute care.",
        whyItMatters:
          "Observation status does NOT count toward the 3-day inpatient requirement for Medicare SNF coverage. If {parent_name} is under observation and may need skilled nursing after discharge, request a formal admission from the hospital.",
        questionsToAsk: [
          "Is {parent_name} admitted as an inpatient or under observation?",
          "Can the status be changed to inpatient if clinically appropriate?",
          "Has a Medicare notice of observation been provided?",
        ],
      },
      {
        stepNumber: 2,
        title: "Attend the Discharge Planning Meeting",
        description:
          "Meet with the hospital discharge planner or case manager. This typically happens 24–48 hours before discharge. If no meeting is scheduled, request one.",
        whyItMatters:
          "The discharge plan determines what follow-up care, equipment, and services {parent_name} will need at home. Families who participate in discharge planning have significantly lower readmission rates.",
        questionsToAsk: [
          "What is the expected discharge date?",
          "What level of care will {parent_name} need at home?",
          "Will {parent_name} need home health services? If so, has a referral been made?",
          "Are there any restrictions on activity, diet, or mobility?",
          "What are the warning signs that should trigger a return to the ER?",
        ],
      },
      {
        stepNumber: 3,
        title: "Medication Reconciliation",
        description:
          "Before discharge, review all medications with the hospital pharmacist or nurse. Compare the discharge medication list against {parent_name}'s pre-admission medications. Identify new medications, discontinued medications, and dosage changes.",
        whyItMatters:
          "Medication errors during transitions are one of the top causes of readmission. Up to 50% of patients experience at least one medication discrepancy at discharge.",
        questionsToAsk: [
          "Which medications are new? What are they for?",
          "Were any existing medications stopped or changed? Why?",
          "Are there any drug interactions between new and existing medications?",
          "Do we need new prescriptions filled before leaving the hospital?",
          "When should we schedule a medication review with {parent_name}'s primary care doctor?",
        ],
      },
      {
        stepNumber: 4,
        title: "Arrange Home Health Services",
        description:
          "If the discharge plan includes home health, confirm the referral has been placed and that a home health agency has accepted {parent_name} as a patient. Get the agency name, first visit date, and contact information.",
        whyItMatters:
          "There is often a gap between discharge and the first home health visit. Knowing exactly when services start prevents dangerous unsupervised periods.",
        questionsToAsk: [
          "Which home health agency has been assigned?",
          "When will the first visit occur?",
          "What services are included (skilled nursing, PT, OT, speech therapy, aide services)?",
          "How do we contact the agency if there's a problem?",
          "How long is the home health authorization for?",
        ],
      },
      {
        stepNumber: 5,
        title: "Obtain Durable Medical Equipment",
        description:
          "If {parent_name} needs equipment at home (hospital bed, wheelchair, walker, oxygen, commode), ensure orders are placed and delivery is scheduled before discharge.",
        whyItMatters:
          "Equipment delays are common and can make a home unsafe. Do not accept discharge until essential equipment is confirmed for delivery.",
        questionsToAsk: [
          "What equipment does {parent_name} need at home?",
          "Has the DME order been placed? With which supplier?",
          "When will equipment be delivered — before or after discharge?",
          "Does insurance cover this equipment? Is prior authorization needed?",
          "Who do we call for equipment problems or adjustments?",
        ],
      },
      {
        stepNumber: 6,
        title: "Prepare the Home Environment",
        description:
          "Before {parent_name} comes home, assess and modify the home for safety: clear pathways, install grab bars in the bathroom, ensure adequate lighting, remove tripping hazards, and set up a recovery area on the main floor if stairs are a concern.",
        whyItMatters:
          "Falls within the first week home are a leading cause of readmission. Simple modifications dramatically reduce fall risk.",
        questionsToAsk: [],
      },
      {
        stepNumber: 7,
        title: "Schedule Follow-Up Appointments",
        description:
          "Schedule a follow-up visit with {parent_name}'s primary care doctor within 7 days of discharge. If specialists were involved during the hospitalization, schedule follow-ups with them as well.",
        whyItMatters:
          "The 7-day post-discharge window is critical. Patients who see their doctor within 7 days of discharge have 20% fewer readmissions.",
        questionsToAsk: [
          "Which doctors should {parent_name} see after discharge, and how soon?",
          "Can the hospital schedule these appointments before discharge?",
          "What information should we bring to the follow-up appointment?",
          "What test results are still pending, and how will we receive them?",
        ],
      },
      {
        stepNumber: 8,
        title: "Understand Warning Signs",
        description:
          "Get a clear list of symptoms or changes that should trigger a call to the doctor or a return to the ER. Write these down. Post them somewhere visible at home.",
        whyItMatters:
          "Families who know what to watch for catch complications early and avoid unnecessary ER visits for non-urgent issues.",
        questionsToAsk: [
          "What specific symptoms mean we should call the doctor?",
          "What symptoms mean we should go directly to the ER?",
          "Who should we call after hours or on weekends?",
          "Is there a nurse line we can call with questions in the first week?",
        ],
      },
    ],
    insuranceConsiderations: [
      {
        item: "Home health services",
        coverage: "Covered under Part A if homebound and need skilled care",
        keyDetails:
          "Must be ordered by a doctor. No copay for Medicare-covered home health.",
      },
      {
        item: "Durable medical equipment",
        coverage: "Covered under Part B at 80%",
        keyDetails:
          "20% coinsurance applies. Must be ordered by a doctor and supplied by a Medicare-approved supplier.",
      },
      {
        item: "Prescription medications",
        coverage: "Covered under Part D",
        keyDetails:
          "New medications from the hospital may have different Part D tier placement. Check formulary before filling.",
      },
      {
        item: "Follow-up doctor visits",
        coverage: "Covered under Part B",
        keyDetails:
          "Standard copay/coinsurance applies. Transitional Care Management (TCM) billing may apply — ask the doctor's office.",
      },
      {
        item: "Physical/occupational therapy",
        coverage: "Covered under Part B (outpatient) or Part A (home health)",
        keyDetails:
          "If receiving home health, therapy is included. If outpatient, Part B coinsurance applies.",
      },
      {
        item: "Readmission within 30 days",
        coverage: "Hospital may face financial penalty under HRRP",
        keyDetails:
          "This is the hospital's concern, not the patient's, but it means hospitals have incentive to support good transitions.",
      },
    ],
    timelineBenchmarks: [
      { timeframe: "Day of discharge", milestone: "Medications reconciled, DME delivered, home safety check complete" },
      { timeframe: "24 hours post-discharge", milestone: "Prescriptions filled, first medication doses administered correctly" },
      { timeframe: "48 hours", milestone: "Home health agency has made first visit (or contact to schedule)" },
      { timeframe: "72 hours", milestone: "Family is comfortable with care routine, warning sign list posted" },
      { timeframe: "7 days", milestone: "Primary care follow-up appointment completed" },
      { timeframe: "14 days", milestone: "Specialist follow-up appointments completed, medication side effects assessed" },
      { timeframe: "30 days", milestone: "Home health authorization reviewed, care plan adjusted as needed" },
      { timeframe: "90 days", milestone: "Reassess whether home health services are still needed, transition to maintenance" },
    ],
    taskTemplates: [
      { title: "Confirm inpatient vs. observation status", description: "Verify with hospital whether {parent_name} is admitted as inpatient or under observation. Request inpatient admission if clinically appropriate.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Attend discharge planning meeting", description: "Meet with discharge planner to review care needs, equipment, and follow-up plan. Request meeting if not scheduled.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Complete medication reconciliation", description: "Review discharge medication list against pre-admission medications. Identify changes, new drugs, and potential interactions. Update Harbor medication list.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Confirm home health agency and first visit", description: "Get home health agency name, contact info, and first visit date. Confirm services: skilled nursing, PT, OT, aide.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Confirm DME delivery before discharge", description: "Verify all ordered equipment (walker, hospital bed, oxygen, etc.) will be delivered before or on discharge day.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Prepare home for safe return", description: "Clear pathways, install grab bars, set up recovery area, remove tripping hazards, ensure nightlights.", dueDaysAfterEvent: -1, priority: "high", domain: "housing" },
      { title: "Fill new prescriptions", description: "Fill all new prescriptions from the hospital. Check Part D formulary for tier placement and copay.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Schedule PCP follow-up within 7 days", description: "Schedule follow-up with {parent_name}'s primary care doctor within 7 days of discharge.", dueDaysAfterEvent: 1, priority: "high", domain: "medical" },
      { title: "Schedule specialist follow-ups", description: "Schedule follow-up appointments with any specialists involved during hospitalization.", dueDaysAfterEvent: 3, priority: "medium", domain: "medical" },
      { title: "Post warning signs list at home", description: "Write down and post the list of symptoms that require a doctor call or ER visit. Include after-hours contact numbers.", dueDaysAfterEvent: 0, priority: "medium", domain: "medical" },
      { title: "Verify home health first visit occurred", description: "Confirm that the home health agency has completed the first visit. If not, call the agency.", dueDaysAfterEvent: 3, priority: "high", domain: "medical" },
      { title: "Complete PCP follow-up appointment", description: "Attend the 7-day follow-up. Bring discharge summary, medication list, and any questions.", dueDaysAfterEvent: 7, priority: "high", domain: "medical" },
      { title: "30-day transition review", description: "Assess whether home health is still needed, medications are stable, and {parent_name} is recovering as expected. Update Harbor care plan.", dueDaysAfterEvent: 30, priority: "medium", domain: "medical" },
    ],
  },

  // ─── Hospital → SNF ────────────────────────────────────────────────
  {
    id: "hospital_to_snf",
    label: "Hospital → Skilled Nursing Facility",
    icon: "🏥",
    overview:
      "This playbook activates when a hospitalization is logged and the discharge destination is a skilled nursing facility (SNF). Hospital-to-SNF transitions are Medicare's most rules-intensive care transition — coverage depends on meeting the 3-day inpatient rule, the care must be skilled (not custodial), and the benefit has a hard 100-day limit with escalating costs after day 20.",
    trigger: {
      lifeEventType: "hospitalization",
      milestoneIds: ["hospital_3day_rule_snf"],
      description: "Hospitalization logged with discharge destination SNF",
    },
    steps: [
      {
        stepNumber: 1,
        title: "Verify the 3-Day Inpatient Requirement",
        description:
          "Medicare only covers SNF care if {parent_name} was admitted as a hospital inpatient for at least 3 consecutive days (not counting the discharge day). Observation status does NOT count.",
        whyItMatters:
          "Hospitals increasingly place patients under observation rather than inpatient admission. A patient can spend 4 days in a hospital bed and still not qualify for Medicare SNF coverage because they were never formally admitted. The financial exposure is enormous — SNF private-pay rates range from $8,000 to $12,000+/month.",
        questionsToAsk: [
          "Is {parent_name} admitted as an inpatient or under observation status?",
          "On what date did inpatient admission begin?",
          "Will the 3-day requirement be met before the planned discharge date?",
          "If currently under observation, can the status be changed to inpatient retroactively?",
          "Has a Medicare Outpatient Observation Notice (MOON) been provided?",
        ],
      },
      {
        stepNumber: 2,
        title: "Understand What Medicare Covers (and When It Stops)",
        description:
          "Medicare SNF coverage is structured in three phases. Days 1–20: Medicare covers 100%. Days 21–100: $204/day coinsurance. Days 101+: no coverage.",
        whyItMatters:
          "Many families assume Medicare covers nursing home care indefinitely. It does not. The benefit is limited to 100 days per benefit period, and only while {parent_name} continues to need skilled care.",
        questionsToAsk: [
          "What is the estimated length of stay?",
          "What is the daily private-pay rate if Medicare coverage ends?",
          "Does {parent_name}'s Medigap policy cover the day 21–100 coinsurance?",
          "What is the SNF's policy when Medicare coverage exhausts — can {parent_name} stay as private-pay or Medicaid?",
        ],
      },
      {
        stepNumber: 3,
        title: "Evaluate and Select the SNF",
        description:
          "The hospital discharge planner will typically recommend or assign a SNF. You have the right to choose a different facility. Research quality ratings and match the facility to {parent_name}'s rehabilitation needs.",
        whyItMatters:
          "SNF quality varies dramatically. Medicare's Care Compare tool rates facilities on a 5-star scale. Facilities with low staffing ratios and high deficiency counts have worse rehabilitation outcomes.",
        questionsToAsk: [
          "What is your readmission rate back to the hospital?",
          "Do you have PT, OT, and speech therapists on staff or contracted?",
          "How many hours of therapy per day does a typical rehab patient receive?",
          "What is your staffing ratio on day, evening, and night shifts?",
          "Do you accept Medicaid if the patient needs to transition to long-term care?",
          "What is the private-pay daily rate?",
          "Can family visit at any time, or are there restricted hours?",
        ],
      },
      {
        stepNumber: 4,
        title: "Review the Rehabilitation Plan",
        description:
          "Within the first few days of admission, the SNF will develop a care plan including rehabilitation goals. Review this plan with the therapy team.",
        whyItMatters:
          "The rehabilitation plan determines when Medicare considers {parent_name} to have plateaued — which is when coverage can stop. Understanding the goals helps the family advocate for continued therapy.",
        questionsToAsk: [
          "What are the specific rehabilitation goals (mobility, strength, ADL independence)?",
          "How many hours of therapy per day is {parent_name} receiving?",
          "What milestones indicate {parent_name} is making progress?",
          "What would trigger a recommendation to end therapy?",
          "How will we be notified if the team believes {parent_name} has plateaued?",
          "Can therapy intensity be adjusted if {parent_name} is struggling?",
        ],
      },
      {
        stepNumber: 5,
        title: "Know Your Rights When Medicare Coverage Ends",
        description:
          "If the SNF or Medicare decides to stop covering {parent_name}'s stay, the family has appeal rights. The SNF must provide written notice before ending Medicare coverage.",
        whyItMatters:
          "Premature discharge from a SNF can lead to falls, hospital readmission, and unsafe home situations. Families who understand the appeals process can sometimes extend coverage long enough to complete rehabilitation.",
        questionsToAsk: [
          "When will the NOMNC be issued?",
          "What is the QIO for our state, and how do we contact them?",
          "If we appeal, what happens during the review period?",
          "If coverage ends, what are our options for staying (private-pay, Medicaid)?",
        ],
      },
      {
        stepNumber: 6,
        title: "Plan for What Comes After the SNF",
        description:
          "Start planning {parent_name}'s post-SNF destination early — ideally within the first week of admission. The three most common paths are: home with home health, home with family/private caregiving, or transition to assisted living or long-term care.",
        whyItMatters:
          "Discharge from SNF can happen quickly once therapy goals are met or Medicare coverage ends. Families who haven't planned the next step face rushed, poor decisions.",
        questionsToAsk: [],
      },
      {
        stepNumber: 7,
        title: "Coordinate the Transition",
        description:
          "Whether {parent_name} is going home, to assisted living, or staying in the SNF long-term, the transition requires careful coordination to prevent gaps in care.",
        whyItMatters:
          "Gaps in care during transitions increase the risk of complications, medication errors, and readmission.",
        questionsToAsk: [],
      },
    ],
    insuranceConsiderations: [
      { item: "SNF days 1–20", coverage: "Medicare Part A covers 100%", keyDetails: "No copay if 3-day inpatient rule is met and skilled care is needed." },
      { item: "SNF days 21–100", coverage: "Medicare Part A with daily coinsurance", keyDetails: "$204.00/day coinsurance (2025). Most Medigap Plans C, D, F, G cover this coinsurance." },
      { item: "SNF days 101+", coverage: "NOT covered by Medicare", keyDetails: "Full private-pay rate applies. Medicaid may cover if eligible." },
      { item: "Medigap coinsurance", coverage: "Plans C, D, F, G cover SNF coinsurance", keyDetails: "Covers the day 21–100 copay. Plans K and L cover 50% and 75% respectively." },
      { item: "Medicare Advantage", coverage: "Varies by plan", keyDetails: "MA plans may require in-network SNFs. Cost-sharing structure may differ from Original Medicare." },
      { item: "Medicaid", coverage: "Covers SNF long-term care if eligible", keyDetails: "Medicaid pays the SNF directly after Medicare exhausts. 60-month lookback period for asset transfers." },
      { item: "VA benefits", coverage: "VA covers SNF for service-connected conditions", keyDetails: "Non-service-connected coverage depends on VA priority group and bed availability." },
      { item: "Long-term care insurance", coverage: "Varies by policy", keyDetails: "Most policies cover SNF stays. Check elimination period — hospital days may count toward it." },
      { item: "Prescription drugs", coverage: "Part D continues to apply", keyDetails: "The SNF may bundle medications during a covered Part A stay. After Part A ends, Part D resumes." },
      { item: "Therapy services", coverage: "Included in Medicare SNF benefit", keyDetails: "PT, OT, and speech therapy covered under Part A SNF benefit. After discharge, outpatient therapy covered under Part B." },
    ],
    timelineBenchmarks: [
      { timeframe: "Day of hospital discharge", milestone: "3-day inpatient rule verified, SNF selected, admission completed" },
      { timeframe: "Day 1–3 at SNF", milestone: "Initial care plan and rehabilitation goals established" },
      { timeframe: "Day 7", milestone: "Family has reviewed rehab plan with therapy team, post-SNF planning begins" },
      { timeframe: "Day 14", milestone: "First progress assessment — is {parent_name} meeting therapy milestones?" },
      { timeframe: "Day 20", milestone: "Medicare coinsurance begins next day. Confirm Medigap or supplemental coverage." },
      { timeframe: "Day 21", milestone: "Daily coinsurance of $204/day begins (if no Medigap). Family aware of cost exposure." },
      { timeframe: "Day 30", milestone: "Reassess rehabilitation progress and estimated remaining length of stay" },
      { timeframe: "Day 60", milestone: "If still in SNF, evaluate long-term plan: home, assisted living, or long-term stay" },
      { timeframe: "Day 80", milestone: "If approaching day 100, begin Medicaid application if assets are limited" },
      { timeframe: "Day 100", milestone: "Medicare coverage ends. Private-pay or Medicaid must be in place." },
      { timeframe: "SNF discharge day", milestone: "Medication reconciliation complete, follow-up appointments scheduled, home/facility ready" },
      { timeframe: "7 days post-discharge", milestone: "PCP follow-up completed, outpatient therapy started" },
    ],
    taskTemplates: [
      { title: "Verify 3-day inpatient requirement is met", description: "Confirm {parent_name} has been admitted as an inpatient (not observation) for at least 3 consecutive days. If under observation, request conversion to inpatient status.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Understand Medicare SNF benefit structure", description: "Review the 3-phase cost structure: days 1-20 (fully covered), days 21-100 ($204/day coinsurance), days 101+ (no coverage). Check Medigap policy for coinsurance coverage.", dueDaysAfterEvent: 0, priority: "high", domain: "financial" },
      { title: "Evaluate and select SNF", description: "Research Medicare Care Compare ratings for recommended and alternative SNFs. Check star ratings, staffing, inspection history, and whether the facility accepts Medicaid for long-term stays.", dueDaysAfterEvent: 0, priority: "high", domain: "housing" },
      { title: "Review rehabilitation plan with therapy team", description: "Meet with PT, OT, and speech therapy team to understand rehab goals, therapy hours, progress milestones, and criteria for discharge.", dueDaysAfterEvent: 3, priority: "high", domain: "medical" },
      { title: "Confirm Medigap or supplemental coverage for day 21+", description: "Verify whether {parent_name}'s Medigap or supplemental insurance covers the SNF daily coinsurance starting day 21. If not covered, calculate daily out-of-pocket cost.", dueDaysAfterEvent: 7, priority: "high", domain: "financial" },
      { title: "Begin post-SNF discharge planning", description: "Determine likely discharge destination: home, assisted living, or long-term care. If going home, request OT home safety evaluation. If assisted living, begin facility research.", dueDaysAfterEvent: 7, priority: "high", domain: "housing" },
      { title: "First rehabilitation progress check", description: "Assess whether {parent_name} is meeting therapy milestones at the 2-week mark. Discuss progress and estimated remaining length of stay with the therapy team.", dueDaysAfterEvent: 14, priority: "high", domain: "medical" },
      { title: "Day 20 cost transition alert", description: "Medicare coinsurance begins tomorrow. Confirm supplemental coverage is active or prepare for $204/day out-of-pocket cost. Review total projected cost for remaining stay.", dueDaysAfterEvent: 20, priority: "high", domain: "financial" },
      { title: "30-day rehabilitation reassessment", description: "Meet with care team for a comprehensive progress review. Discuss updated discharge timeline, continuing therapy needs, and post-discharge care plan.", dueDaysAfterEvent: 30, priority: "high", domain: "medical" },
      { title: "Evaluate long-term plan if stay exceeds 60 days", description: "If {parent_name} is still in the SNF at day 60, assess whether this will become a long-term stay. Begin Medicaid planning if assets may be exhausted.", dueDaysAfterEvent: 60, priority: "high", domain: "financial" },
      { title: "Begin Medicaid application if approaching day 100", description: "If {parent_name} will remain in the SNF beyond day 100 and assets are limited, begin the Medicaid application. Consult elder law attorney about spend-down and asset protection.", dueDaysAfterEvent: 80, priority: "high", domain: "legal" },
      { title: "Prepare for Medicare coverage end at day 100", description: "Medicare SNF benefit exhausts at day 100. Ensure private-pay arrangement or Medicaid approval is in place. Get the SNF's private-pay rate in writing.", dueDaysAfterEvent: 95, priority: "high", domain: "financial" },
      { title: "Coordinate SNF discharge", description: "Obtain discharge summary, perform medication reconciliation, transfer records, arrange home health or next facility. Schedule PCP follow-up within 7 days.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Post-SNF follow-up with PCP", description: "Complete follow-up visit with {parent_name}'s primary care doctor within 7 days of SNF discharge. Bring discharge summary, updated medication list, and therapy notes.", dueDaysAfterEvent: 7, priority: "high", domain: "medical" },
    ],
  },

  // ─── Home → Assisted Living ────────────────────────────────────────
  {
    id: "home_to_assisted_living",
    label: "Home → Assisted Living",
    icon: "🏡",
    overview:
      "This playbook activates when Harbor's Lifecycle Milestone Agent detects declining ADL scores, caregiver burnout signals, or when the family manually initiates a care setting evaluation. Moving a parent from home to assisted living is one of the most emotionally complex transitions in elder care — it typically unfolds over weeks or months, not days.",
    trigger: {
      lifeEventType: "caregiver_burnout",
      milestoneIds: ["care_transition_home_to_al"],
      description: "ADL decline detected, caregiver burnout flagged, or manual transition initiated",
    },
    steps: [
      {
        stepNumber: 1,
        title: "Assess the Current Situation",
        description:
          "Before exploring facilities, document {parent_name}'s current care needs honestly. Track which ADLs (bathing, dressing, eating, toileting, transferring, continence) require assistance, how many hours per day of supervision are needed, and what safety incidents have occurred.",
        whyItMatters:
          "A clear assessment of needs guides facility selection and helps the family make the decision with data rather than guilt. It also determines what level of care to look for.",
        questionsToAsk: [
          "What tasks can {parent_name} no longer do safely alone?",
          "How many hours per day does {parent_name} need supervision?",
          "Have there been falls, medication errors, or wandering incidents?",
          "Is the primary caregiver's health or work being affected?",
          "What does {parent_name} say about their own comfort and safety at home?",
        ],
      },
      {
        stepNumber: 2,
        title: "Understand the Financial Picture",
        description:
          "Assisted living costs vary dramatically by state and facility. Research the average cost in {parent_state}, project how long {parent_name}'s resources can cover it, and identify any benefit programs that may help.",
        whyItMatters:
          "The national average for assisted living is approximately $5,350/month (2026), but ranges from $3,500 to $8,000+ depending on location and level of care. Financial planning prevents crises.",
        questionsToAsk: [
          "What is the base monthly rate, and what services are included?",
          "What triggers additional charges (medication management, incontinence care, mobility assistance)?",
          "How often do rates increase, and by how much typically?",
          "Do you accept Medicaid waiver payments?",
          "Is there an entrance fee or community fee?",
        ],
      },
      {
        stepNumber: 3,
        title: "Research and Visit Facilities",
        description:
          "Identify 3–5 facilities that match {parent_name}'s care needs, budget, and location preferences. Visit each facility, ideally at different times of day.",
        whyItMatters:
          "Facility quality varies enormously. Visiting in person — and visiting unannounced — reveals what daily life is actually like.",
        questionsToAsk: [
          "What is your staff-to-resident ratio during day, evening, and night shifts?",
          "What training do your caregivers receive?",
          "How do you handle medical emergencies?",
          "What is your policy on aging in place vs. requiring a move to a higher level of care?",
          "Can we speak with families of current residents?",
          "What is the process for filing a complaint or concern?",
          "What activities and social programs are offered?",
          "Can {parent_name} bring personal furniture and belongings?",
          "What is the move-out policy and required notice period?",
        ],
      },
      {
        stepNumber: 4,
        title: "Involve {parent_name} in the Decision",
        description:
          "To the extent possible, include {parent_name} in facility visits and the decision-making process. Their sense of agency and dignity during this transition directly affects their adjustment and wellbeing.",
        whyItMatters:
          "Seniors who feel forced into assisted living have significantly worse outcomes — higher rates of depression, faster cognitive decline, and more behavioral issues.",
        questionsToAsk: [],
      },
      {
        stepNumber: 5,
        title: "Handle Legal and Financial Paperwork",
        description:
          "Before the move, ensure all legal documents are current and that the facility has what it needs: POA, advance directive, HIPAA authorization, LTC insurance claim.",
        whyItMatters:
          "Missing or outdated legal documents can cause delays and complications during the transition.",
        questionsToAsk: [],
      },
      {
        stepNumber: 6,
        title: "Plan the Physical Move",
        description:
          "Coordinate the logistics of moving {parent_name}'s belongings, setting up the new living space, and transitioning services.",
        whyItMatters:
          "A well-organized move reduces stress for both {parent_name} and the family.",
        questionsToAsk: [],
      },
      {
        stepNumber: 7,
        title: "Support the Adjustment Period",
        description:
          "The first 30–90 days are the hardest. {parent_name} may experience grief, anger, confusion, or withdrawal. This is normal.",
        whyItMatters:
          "The family's presence and support during the adjustment period directly affects long-term outcomes.",
        questionsToAsk: [],
      },
    ],
    insuranceConsiderations: [
      { item: "Assisted living room and board", coverage: "Generally NOT covered by Medicare", keyDetails: "Medicare does not cover assisted living. This is the biggest out-of-pocket cost." },
      { item: "Medicaid HCBS waiver", coverage: "Varies by state", keyDetails: "Some states cover assisted living through Medicaid waivers. Waitlists are common. Check {parent_state} availability." },
      { item: "VA Aid and Attendance", coverage: "Up to $22,800/year for eligible veterans", keyDetails: "Can be applied toward assisted living costs. Processing takes 3–6 months." },
      { item: "Long-term care insurance", coverage: "Varies by policy", keyDetails: "Most policies cover assisted living. Check elimination period, daily benefit amount, and benefit period. File claim early." },
      { item: "Medicare Part B services", coverage: "Covered for eligible services", keyDetails: "Doctor visits, outpatient therapy, and some medical services are still covered under Part B even in assisted living." },
      { item: "Prescription drugs", coverage: "Covered under Part D", keyDetails: "Part D coverage continues. Facility may use a specific pharmacy — confirm it's in-network." },
    ],
    timelineBenchmarks: [
      { timeframe: "Week 1–2", milestone: "Assess care needs, document ADLs, have family conversation" },
      { timeframe: "Week 3–4", milestone: "Research financial picture, check benefit program eligibility" },
      { timeframe: "Month 2", milestone: "Research and visit 3–5 facilities" },
      { timeframe: "Month 2–3", milestone: "Involve {parent_name} in visits, narrow to top 1–2 choices" },
      { timeframe: "Month 3", milestone: "Handle legal paperwork, sign admission agreement" },
      { timeframe: "Month 3–4", milestone: "Plan and execute the physical move" },
      { timeframe: "Month 4–6", milestone: "Support the adjustment period, monitor for warning signs" },
      { timeframe: "Month 7", milestone: "90-day care conference with facility — assess fit and care plan" },
    ],
    taskTemplates: [
      { title: "Document current ADL needs", description: "Assess which activities of daily living {parent_name} needs help with. Record bathing, dressing, eating, toileting, transferring, and continence status.", dueDaysAfterEvent: 7, priority: "high", domain: "medical" },
      { title: "Calculate financial runway for assisted living", description: "Project monthly income vs. average assisted living cost in {parent_state}. Determine how many months savings can cover the gap.", dueDaysAfterEvent: 14, priority: "high", domain: "financial" },
      { title: "Check benefit program eligibility", description: "Review Medicaid HCBS waiver, VA Aid & Attendance, and long-term care insurance coverage for assisted living.", dueDaysAfterEvent: 14, priority: "high", domain: "financial" },
      { title: "Research assisted living facilities", description: "Identify 3-5 facilities near {parent_name}. Check Harbor Provider Monitor for quality ratings and inspection histories.", dueDaysAfterEvent: 21, priority: "high", domain: "housing" },
      { title: "Visit first facility", description: "Tour the facility. Observe staff interactions, cleanliness, resident engagement. Ask about staff ratios, costs, and aging-in-place policy.", dueDaysAfterEvent: 28, priority: "high", domain: "housing" },
      { title: "Visit second facility", description: "Tour second facility for comparison. Visit at a different time of day than the first visit.", dueDaysAfterEvent: 35, priority: "high", domain: "housing" },
      { title: "Visit third facility", description: "Tour third facility. Consider an unannounced visit.", dueDaysAfterEvent: 42, priority: "medium", domain: "housing" },
      { title: "Include {parent_name} in facility visit", description: "Bring {parent_name} to the top 1-2 facilities. Let them see the environment, meet staff, and ask questions.", dueDaysAfterEvent: 49, priority: "high", domain: "housing" },
      { title: "Review and update legal documents", description: "Review POA, advance directive, and HIPAA authorization. Update as needed before the move.", dueDaysAfterEvent: 60, priority: "high", domain: "legal" },
      { title: "Review admission agreement carefully", description: "Read the facility admission agreement. Note rate increase policies, discharge conditions, and arbitration clauses.", dueDaysAfterEvent: 70, priority: "high", domain: "legal" },
      { title: "Plan the physical move", description: "Determine what to bring, arrange movers, set up the new space with familiar personal items.", dueDaysAfterEvent: 80, priority: "medium", domain: "housing" },
      { title: "Transfer prescriptions and notify doctors", description: "Transfer prescriptions to facility pharmacy, notify all doctors of the care setting change, update address.", dueDaysAfterEvent: 85, priority: "high", domain: "medical" },
      { title: "30-day adjustment check-in", description: "Assess how {parent_name} is adjusting. Watch for depression, weight loss, withdrawal. Talk to facility staff about participation.", dueDaysAfterEvent: 120, priority: "high", domain: "medical" },
      { title: "90-day care conference", description: "Request a care conference with facility staff to review {parent_name}'s care plan, adjustment, and any concerns.", dueDaysAfterEvent: 180, priority: "medium", domain: "medical" },
    ],
  },

  // ─── AL → Memory Care ──────────────────────────────────────────────
  {
    id: "al_to_memory_care",
    label: "Assisted Living → Memory Care",
    icon: "🧠",
    overview:
      "This playbook activates when cognitive decline is detected or when {parent_name}'s current assisted living community recommends a transition to memory care. This is often the most emotionally difficult transition because it involves confronting the progression of dementia or Alzheimer's disease. Memory care typically costs 20–30% more than standard assisted living.",
    trigger: {
      lifeEventType: "cognitive_decline",
      milestoneIds: ["care_transition_al_to_memory"],
      description: "Cognitive decline detected or memory care recommended by current facility",
    },
    steps: [
      {
        stepNumber: 1,
        title: "Get a Formal Cognitive Assessment",
        description:
          "Before committing to a memory care transition, get a comprehensive cognitive assessment from a neurologist or geriatric psychiatrist. This establishes a baseline, confirms the diagnosis, and helps determine the appropriate level of care.",
        whyItMatters:
          "A formal diagnosis guides care decisions, is often required for memory care admission, and may be needed for insurance claims and legal documentation.",
        questionsToAsk: [
          "What is the specific diagnosis (Alzheimer's, vascular dementia, Lewy body, frontotemporal, mixed)?",
          "What stage is the disease — early, moderate, or advanced?",
          "What is the expected rate of progression?",
          "Are there medications that could slow progression or manage symptoms?",
          "At what point do you recommend a secured memory care environment?",
        ],
      },
      {
        stepNumber: 2,
        title: "Understand Why the Current Setting Is No Longer Safe",
        description:
          "Document the specific safety concerns that are driving the transition: wandering, aggressive behavior, inability to follow emergency procedures, repeated falls, medication non-compliance.",
        whyItMatters:
          "Understanding the specific triggers helps match {parent_name} to the right memory care environment. Not all memory care is the same — some specialize in early-stage, others in late-stage care.",
        questionsToAsk: [
          "What specific behaviors or incidents are driving this recommendation?",
          "Have you tried any interventions before recommending this transition?",
          "What is your timeline for requiring the move?",
          "Can you provide a written care summary for the next facility?",
        ],
      },
      {
        stepNumber: 3,
        title: "Research Memory Care Communities",
        description:
          "Identify 3–5 memory care communities that match {parent_name}'s diagnosis, stage, budget, and location. Visit each community and observe the memory care unit specifically.",
        whyItMatters:
          "Memory care quality varies significantly. Staff training in dementia care, staff-to-resident ratios, and the physical environment all affect outcomes.",
        questionsToAsk: [
          "What dementia-specific training does your staff receive, and how often?",
          "What is the staff-to-resident ratio during day, evening, and overnight?",
          "How do you handle behavioral changes like agitation, aggression, or sundowning?",
          "What activities and therapies are included (music, art, pet therapy, exercise)?",
          "How do you communicate with families about changes in condition?",
          "What is your approach to medication management for dementia symptoms?",
          "At what point would a resident need to transfer to a skilled nursing facility?",
          "Do you have a hospice partnership for end-of-life care within the community?",
        ],
      },
      {
        stepNumber: 4,
        title: "Address Legal Matters Urgently",
        description:
          "If {parent_name} has not yet completed Power of Attorney, advance directives, and financial planning, this must happen as soon as possible. Cognitive decline may soon affect legal capacity.",
        whyItMatters:
          "Once {parent_name} lacks the cognitive capacity to make legal decisions, establishing POA requires guardianship proceedings — which are expensive, time-consuming, and distressing.",
        questionsToAsk: [],
      },
      {
        stepNumber: 5,
        title: "Plan the Financial Transition",
        description:
          "Memory care costs $6,500–$10,000+/month in most states. Recalculate the financial trajectory with the higher cost, and identify all available funding sources.",
        whyItMatters:
          "The significant cost increase requires updated financial planning to avoid running out of funds unexpectedly.",
        questionsToAsk: [],
      },
      {
        stepNumber: 6,
        title: "Coordinate the Move with Care",
        description:
          "The physical transition should be handled gently. People with dementia are particularly sensitive to environmental changes and disruption of routine.",
        whyItMatters:
          "A poorly managed move can cause significant distress, confusion, and behavioral deterioration in someone with dementia.",
        questionsToAsk: [],
      },
      {
        stepNumber: 7,
        title: "Support the Adjustment Period",
        description:
          "Adjustment in memory care is different from assisted living. {parent_name} may not fully understand or remember the move. The family's role is to maintain connection, monitor care quality, and work with staff.",
        whyItMatters:
          "Ongoing monitoring and family involvement are essential to ensuring quality care and catching problems early.",
        questionsToAsk: [],
      },
    ],
    insuranceConsiderations: [
      { item: "Memory care room and board", coverage: "NOT covered by Medicare", keyDetails: "Memory care is considered custodial care, which Medicare does not cover." },
      { item: "Medicaid", coverage: "Varies by state", keyDetails: "Some states cover memory care through Medicaid HCBS waivers or nursing facility Medicaid. Check {parent_state} rules." },
      { item: "VA Aid and Attendance", coverage: "Up to $22,800/year", keyDetails: "Can be applied toward memory care costs for eligible veterans/surviving spouses." },
      { item: "Long-term care insurance", coverage: "Varies by policy", keyDetails: "Most policies cover memory care. Check if the policy distinguishes between assisted living and memory care benefit amounts." },
      { item: "Medicare Part B", coverage: "Covers eligible medical services", keyDetails: "Doctor visits, some therapies still covered. Cognitive/behavioral therapy may be billable under Part B." },
      { item: "Prescription drugs", coverage: "Part D coverage continues", keyDetails: "Dementia medications (donepezil, memantine, etc.) are covered under Part D. Check formulary tier." },
    ],
    timelineBenchmarks: [
      { timeframe: "Week 1", milestone: "Formal cognitive assessment scheduled or completed" },
      { timeframe: "Week 2", milestone: "Current facility has provided written care summary and transition timeline" },
      { timeframe: "Week 2–4", milestone: "Legal documents reviewed and updated (POA, advance directive, HIPAA)" },
      { timeframe: "Week 3–6", milestone: "Research and visit 3–5 memory care communities" },
      { timeframe: "Week 6–8", milestone: "Financial plan updated with memory care costs, benefit programs reviewed" },
      { timeframe: "Week 8–10", milestone: "Facility selected, admission agreement signed" },
      { timeframe: "Week 10–12", milestone: "Physical move coordinated and executed" },
      { timeframe: "Month 4", milestone: "30-day care plan review with memory care staff" },
      { timeframe: "Month 6", milestone: "90-day comprehensive assessment of adjustment and care quality" },
    ],
    taskTemplates: [
      { title: "Schedule formal cognitive assessment", description: "Schedule a comprehensive evaluation with a neurologist or geriatric psychiatrist. This establishes diagnosis, stage, and care recommendations.", dueDaysAfterEvent: 7, priority: "high", domain: "medical" },
      { title: "Document safety concerns driving the transition", description: "Record specific incidents and behaviors: wandering, falls, aggression, medication errors. Request written care summary from current facility.", dueDaysAfterEvent: 7, priority: "high", domain: "medical" },
      { title: "Review and update legal documents immediately", description: "Confirm POA, healthcare proxy, advance directive are current. Consult elder law attorney if not in place — cognitive decline may affect legal capacity soon.", dueDaysAfterEvent: 14, priority: "high", domain: "legal" },
      { title: "Research memory care communities", description: "Identify 3-5 memory care communities. Use Harbor Provider Search for quality ratings. Focus on dementia-specific training, staff ratios, and secured environments.", dueDaysAfterEvent: 21, priority: "high", domain: "housing" },
      { title: "Visit first memory care community", description: "Tour the memory care unit specifically. Observe staff interactions, security, activities, and resident engagement.", dueDaysAfterEvent: 28, priority: "high", domain: "housing" },
      { title: "Visit second memory care community", description: "Visit at a different time of day. Ask about behavioral management approach and family communication.", dueDaysAfterEvent: 35, priority: "high", domain: "housing" },
      { title: "Recalculate financial plan for memory care costs", description: "Update financial projections with memory care pricing ($6,500-$10,000+/month). Review LTC insurance, VA benefits, and Medicaid planning timeline.", dueDaysAfterEvent: 35, priority: "high", domain: "financial" },
      { title: "Select facility and sign admission agreement", description: "Choose the best-fit community. Review admission agreement carefully — note discharge policies, rate increases, and arbitration clauses.", dueDaysAfterEvent: 56, priority: "high", domain: "housing" },
      { title: "Prepare personal history document for staff", description: "Write a detailed personal history for memory care staff: daily routines, preferences, triggers, calming strategies, family photos, life story.", dueDaysAfterEvent: 63, priority: "medium", domain: "medical" },
      { title: "Coordinate the physical move", description: "Move familiar items first. Maintain routine as much as possible. Have a familiar person present during the transition.", dueDaysAfterEvent: 70, priority: "medium", domain: "housing" },
      { title: "30-day care plan review", description: "Meet with memory care staff to review {parent_name}'s adjustment, care plan, medication management, and any behavioral concerns.", dueDaysAfterEvent: 100, priority: "high", domain: "medical" },
      { title: "90-day comprehensive assessment", description: "Full assessment of adjustment, care quality, weight/hydration, behavioral changes. Decide if the placement is the right long-term fit.", dueDaysAfterEvent: 160, priority: "high", domain: "medical" },
    ],
  },

  // ─── Discharge Navigator ──────────────────────────────────────────
  {
    id: "discharge_navigator",
    label: "Discharge Navigator",
    icon: "🏥",
    overview:
      "This playbook activates when discharge is happening in 24-48 hours. It provides a focused, time-pressured checklist for ensuring nothing falls through the cracks during the transition from hospital to home. Unlike the broader Hospital → Home playbook, this is a rapid-action guide for the final discharge window.",
    trigger: {
      lifeEventType: "hospitalization",
      description: "Discharge is happening within 24-48 hours",
    },
    steps: [
      {
        stepNumber: 1,
        title: "Understand Discharge Instructions",
        description:
          "Get a written discharge summary from the care team. Review the diagnosis, treatment provided, and any activity restrictions. Ask questions about anything unclear before leaving the hospital.",
        whyItMatters:
          "Studies show that patients who don't understand their discharge instructions are 30% more likely to be readmitted within 30 days. Getting clarity now prevents confusion and dangerous mistakes at home.",
        questionsToAsk: [
          "Can I get a printed copy of the discharge summary?",
          "What activity restrictions does {parent_name} have?",
          "What symptoms should trigger a return to the ER?",
          "When can {parent_name} resume normal activities (bathing, driving, stairs)?",
        ],
      },
      {
        stepNumber: 2,
        title: "Medication Reconciliation",
        description:
          "Compare the discharge medication list with {parent_name}'s pre-admission medications. Identify any new medications, stopped medications, or dosage changes. Confirm which old medications to resume and which to stop.",
        whyItMatters:
          "Medication errors during transitions cause 66% of adverse drug events after hospitalization. Even a single missed change — like continuing a blood thinner that was stopped — can be dangerous.",
        questionsToAsk: [
          "Which medications are new?",
          "Which pre-admission medications should be stopped?",
          "Were any dosages changed?",
          "Are any of these medications temporary? When should they stop?",
          "Can these prescriptions be sent to our regular pharmacy?",
        ],
      },
      {
        stepNumber: 3,
        title: "Schedule Follow-Up Appointments",
        description:
          "Schedule a follow-up with {parent_name}'s primary care physician within 7 days. Schedule any specialist follow-ups as ordered. Get the appointment dates in writing before leaving the hospital.",
        whyItMatters:
          "A PCP follow-up within 7 days of discharge reduces 30-day readmission by 20%. Scheduling before leaving the hospital prevents the appointment from falling through the cracks.",
        questionsToAsk: [
          "Who should {parent_name} follow up with?",
          "How soon should the PCP visit happen?",
          "Are any specialist appointments needed?",
          "What tests or labs are needed before the follow-up?",
        ],
      },
      {
        stepNumber: 4,
        title: "Arrange Home Support",
        description:
          "Determine if {parent_name} needs home health services (skilled nursing, physical therapy, occupational therapy). Get the referral from the hospital and confirm the first visit date and agency contact information.",
        whyItMatters:
          "Patients discharged without adequate home support are at high risk for falls, medication errors, and deterioration. Home health is often covered by Medicare for a limited period after hospitalization.",
        questionsToAsk: [
          "Does {parent_name} qualify for home health services?",
          "Has a referral been submitted?",
          "Which agency will provide services?",
          "When will the first home visit occur?",
          "What is the agency's after-hours phone number?",
        ],
      },
      {
        stepNumber: 5,
        title: "Prepare the Home",
        description:
          "Do a safety check of the home before {parent_name} arrives. Ensure any ordered durable medical equipment (walker, hospital bed, commode) has been delivered. Stock necessary supplies (medications, wound care, nutritional items).",
        whyItMatters:
          "The first 48 hours at home are the highest-risk period. A prepared home environment prevents falls, ensures medications are available, and reduces caregiver stress.",
        questionsToAsk: [
          "What equipment does {parent_name} need at home?",
          "Has the DME order been placed? When will it be delivered?",
          "Are there any home modifications needed (grab bars, ramp)?",
          "What supplies should we have on hand?",
        ],
      },
      {
        stepNumber: 6,
        title: "Know the Warning Signs",
        description:
          "Get a clear list of red flags that should trigger a call to the doctor or a return to the emergency department. Post this list in a visible location at home.",
        whyItMatters:
          "Knowing when to seek help vs. when to wait prevents both unnecessary ER visits and dangerous delays. Caregivers who have a clear action plan feel more confident and catch problems earlier.",
        questionsToAsk: [
          "What specific symptoms mean we should call the doctor?",
          "What symptoms mean we should call 911 or go to the ER?",
          "Is there a nurse line we can call with questions?",
          "What is normal recovery vs. a sign of a problem?",
        ],
      },
    ],
    insuranceConsiderations: [
      {
        item: "Home Health Services",
        coverage: "Medicare covers skilled home health if homebound and ordered by a physician.",
        keyDetails: "Must be from a Medicare-certified agency. No copay for covered services.",
      },
      {
        item: "Durable Medical Equipment (DME)",
        coverage: "Medicare Part B covers 80% of DME (walker, hospital bed, oxygen).",
        keyDetails: "Must be from a Medicare-approved supplier. 20% coinsurance applies.",
      },
      {
        item: "Follow-Up Appointments",
        coverage: "Standard office visit copays apply.",
        keyDetails: "Some Medicare Advantage plans waive copays for post-discharge visits.",
      },
      {
        item: "Prescription Medications",
        coverage: "Covered under Part D or Medicare Advantage plan formulary.",
        keyDetails: "New discharge medications may need prior authorization. Ask the hospital to check formulary coverage before discharge.",
      },
    ],
    timelineBenchmarks: [
      { timeframe: "24 hours before discharge", milestone: "Discharge instructions reviewed, medications reconciled, home support arranged" },
      { timeframe: "Day of discharge", milestone: "Equipment delivered, prescriptions filled, home safety checked" },
      { timeframe: "First 48 hours home", milestone: "First home health visit, medication regimen established, caregiver comfortable" },
      { timeframe: "Day 3-5", milestone: "Settling into routine, monitoring for complications" },
      { timeframe: "Day 7", milestone: "PCP follow-up visit completed" },
      { timeframe: "Day 14", milestone: "Specialist follow-ups as ordered, initial recovery assessment" },
      { timeframe: "Day 30", milestone: "Full recovery assessment, readmission risk window closing" },
    ],
    taskTemplates: [
      { title: "Get written discharge summary", description: "Obtain printed discharge instructions including diagnosis, medications, activity restrictions, and warning signs.", dueDaysAfterEvent: -1, priority: "high", domain: "medical" },
      { title: "Reconcile discharge medications with current list", description: "Compare discharge med list to pre-admission medications. Note new, stopped, and changed medications.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Fill new prescriptions", description: "Get all new or changed prescriptions filled before leaving the hospital or immediately after arriving home.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Schedule PCP follow-up within 7 days", description: "Call PCP to schedule a post-discharge visit. Bring discharge summary and updated medication list.", dueDaysAfterEvent: 0, priority: "high", domain: "medical" },
      { title: "Schedule specialist follow-ups", description: "Schedule any specialist appointments ordered at discharge.", dueDaysAfterEvent: 1, priority: "high", domain: "medical" },
      { title: "Confirm home health first visit", description: "Call the home health agency to confirm the date and time of the first visit.", dueDaysAfterEvent: 1, priority: "high", domain: "medical" },
      { title: "Home safety check", description: "Walk through the home and remove tripping hazards, install grab bars if needed, ensure adequate lighting, and set up a recovery area.", dueDaysAfterEvent: 0, priority: "high", domain: "housing" },
      { title: "Confirm DME delivery", description: "Verify that all ordered durable medical equipment has been delivered and set up correctly.", dueDaysAfterEvent: 0, priority: "high", domain: "housing" },
      { title: "Post warning signs list", description: "Print and post the list of red flag symptoms in a visible location. Include doctor and ER phone numbers.", dueDaysAfterEvent: 0, priority: "medium", domain: "medical" },
      { title: "30-day post-discharge check-in", description: "Review recovery progress, medication adherence, and any ongoing concerns with PCP.", dueDaysAfterEvent: 14, priority: "medium", domain: "medical" },
    ],
  },
];
