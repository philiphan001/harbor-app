# Harbor Value Roadmap — Execution, Retention & Clinical Navigation

## Core Value Proposition
a) Initiate discussions with parent about care planning
b) Triangulate on what's important to have
c) Assist in executing (guided forms, workflows)
d) Monitor external changes (laws, circumstances)
e) Monitor internal changes (deadlines, expirations, updates)
f) Senior housing opportunity identification
g) Easy data export for situational needs
h) Prompt to keep things fresh
i) Navigate clinical transitions (discharge, diagnosis, decline)
j) Encode what matters most to the parent — goal-driven care decisions

---

## Current State (Built)

### Core Loop
- Readiness assessment (questionnaire + AI chat) → score + gap report → task list
- Crisis intake (AI chat) → auto-extract tasks → dashboard
- Parent profile with data capture (demographics, medical, legal, financial, housing)
- Task management (auto-generated, priority-ranked, deduplicated, domain-categorized)
- Document upload + AI extraction (8 doc types via Claude Vision)

### Execution Support
- Guided legal forms: POA, Advance Directives, HIPAA (state-specific, with forms + checklists)
- Guided planning: Housing, Home Safety, Transportation, Social & Pet Care
- Appointment prep (meds, conditions, doctors, manual questions)
- Facility search (CMS data, zip-based, quality ratings)

### Ongoing Value
- AI monitoring agents → judgment scoring → weekly briefings
- Calendar nudges (Medicare enrollment, flu shot, wellness visit, tax, med refills)
- Life event reporting → auto-task generation (fall, hospitalization, diagnosis, etc.)
- Crisis playbooks (fall/fracture, stroke/cardiac, cognitive decline, general hospitalization)

### Export & Emergency
- Care summary export (ER, family, attorney, insurance scenarios)
- Wallet card (printable emergency info)
- ER triage sheet + checklist

---

## Phase 1 — MVP Polish & Readiness Depth (Current Focus)

Priority: Strengthen the readiness path. Make the core loop feel complete and valuable.

### 1.1 "What Matters Most" — Parent Goals
**Status: Not started**
Add a structured field to the parent profile capturing the parent's core goals and values. Examples: "Stay at home as long as possible", "Avoid nursing homes", "Attend granddaughter's wedding in June", "Maintain independence."
- Simple UI: free-text + suggested common goals
- Thread into AI prompts for briefings, task prioritization, and care recommendations
- Small build, large impact on perceived intelligence of the system
- Aligns with geriatric best practice (the 5th M: "What Matters")

### 1.2 AI-Powered Doctor Questions
**Status: Partially built (static defaults + manual entry)**
Upgrade appointment prep to generate contextual questions based on parent's conditions, medications, and recent events.
- "Your parent takes 3 blood pressure medications — ask about simplifying"
- "Last fall was 6 weeks ago — ask about bone density screening"
- "New statin started last month — ask about side effects"
- Uses existing profile data, no new data capture needed

### 1.3 Readiness Score Refinements
**Status: Built, room to improve**
- Add mobility as a more prominent signal within the housing/transportation domains (fall history, assistive devices, sedating meds, stairs in home, vision loss)
- Surface critical gaps more aggressively on dashboard (not just in results page)
- Consider domain-specific "next best action" — the single most impactful thing to do in each domain

### 1.4 Additional Crisis Playbooks
**Status: 4 built (fall, stroke/cardiac, cognitive decline, general hospitalization)**
Add:
- **Discharge Navigator playbook** — step-by-step guide for "my parent is being discharged tomorrow" (medication reconciliation, follow-up scheduling, home safety, equipment, warning signs). This is the highest-impact addition per the geriatrician assessment.
- **New diagnosis playbook** — what to do when parent gets a significant new diagnosis (specialist referral, second opinion, research, insurance pre-auth, family communication)

---

## Phase 2 — Clinical Navigation & Transition Support

Priority: Own the moments that matter — hospitalizations, discharges, new diagnoses, sudden decline. This is where Harbor becomes indispensable.

### 2.1 Hospital Companion Mode
**Status: Minimal (playbooks only)**
A dedicated mode that activates when the user indicates they're at the hospital or ER. The UI shifts to:
- Real-time symptom/diagnosis translator ("Doctor says possible sepsis" → plain-English explanation, expected tests, warning signs, timeline)
- Context-aware doctor question generator (based on parent's meds, conditions, and the current situation)
- Note capture tool (record what doctors say, decisions made, names of providers)
- Medication reference (parent's full med list, formatted for handoff to nursing staff)
- Discharge readiness checklist (surfaces automatically as discharge approaches)
This could be the single most differentiated feature in elder care apps.

### 2.2 Medication Safety Layer
**Status: Not started**
Build incrementally:
- **Phase A**: Polypharmacy warning — "Your parent takes 11 medications. Patients on >8 have 2.5x fall risk." Simple count-based alert, no clinical database needed.
- **Phase B**: AI-powered medication review — flag potential concerns using Claude (not a substitute for pharmacist, but surfaces questions to ask). "Your parent takes a sedating antihistamine and a muscle relaxant — ask doctor about combined sedation risk."
- **Phase C** (later): Integration with drug interaction databases (requires clinical data partnerships, regulatory consideration)

### 2.3 Cognitive Decline Early Detection
**Status: Not started**
The geriatrician's point is strong: cognitive decline appears years before diagnosis. Harbor could periodically prompt the caregiver with observational questions:
- Missed medications more frequently?
- Repeating stories or questions?
- Trouble managing finances or bills?
- Getting lost on familiar routes?
- Personality or mood changes?
Track over time. Surface a signal when pattern suggests evaluation is warranted. Frame as "patterns to discuss with the doctor," not diagnosis.

### 2.4 Caregiver Wellness Check-In
**Status: Partial (life event + burnout risk field, no proactive UI)**
Periodic lightweight prompt: "How are you doing?" with structured questions:
- Sleep quality
- Stress level
- Missing work/social activities
- Feeling overwhelmed
Surface burnout risk in briefings. Suggest respite care, support groups, delegation. Frame as "Harbor watches out for you too."

---

## Phase 3 — Execution Expansion (Guided Workflows)

Priority: Extend the AD/POA/HIPAA pattern to other high-stakes paperwork families struggle with.

### 3.1 Medicare Enrollment/Switching Guide
**Status: Not started**
- Annual Enrollment Period (Oct 15–Dec 7), open enrollment (Jan–Mar)
- Medicare vs Medicare Advantage trade-offs
- Plan comparison guidance
- Calendar nudges already exist for enrollment windows — add the execution path

### 3.2 Medicaid Application Guide
**Status: Not started**
- Extremely complex, state-specific, asset/income rules
- Eligibility screening based on captured financial data
- Step-by-step application walkthrough
- Document checklist (financial records needed)

### 3.3 Veterans Benefits Guide
**Status: Not started (veteran status already captured in profile)**
- Aid & Attendance benefits (up to ~$2,200/month)
- VA healthcare enrollment
- Eligibility criteria and application process

### 3.4 POLST/MOLST Forms
**Status: Not started**
- For seriously ill patients, different from advance directives
- Requires physician signature
- State-specific forms and requirements

### 3.5 Beneficiary Designation Audit
**Status: Not started**
- 401k, IRA, life insurance, bank accounts
- Common pitfall: outdated beneficiaries (ex-spouse still listed)
- Checklist-based review workflow

### 3.6 Insurance Claim Dispute Templates
**Status: Not started**
- Appeal letter templates for denied claims
- Step-by-step dispute process
- Documentation checklist

---

## Phase 4 — Ongoing Monitoring Expansion

Priority: Deepen the AI monitoring loop. More signals, smarter scoring, more actionable briefings.

### 4.1 External Monitoring Expansion
- Drug formulary changes ("Mom's medication X removed from plan formulary")
- Property tax exemption deadlines (senior/homestead exemptions)
- Driver's license renewal reminders
- State-specific policy changes affecting elder care

### 4.2 Predictive Life-Stage Content
**Status: Not started**
Educational framing (not predictive analytics) of common care trajectories:
- Stage 1: Independent aging — what to prepare now
- Stage 2: Mobility limitations — home modifications, transportation alternatives
- Stage 3: Cognitive impairment — legal urgency, safety measures, care needs
- Stage 4: High medical complexity — care coordination, specialist management
- Stage 5: End-of-life planning — hospice, palliative care, family communication
Surface relevant content based on parent's current profile. "Based on your parent's situation, here's what families at this stage typically plan for."

### 4.3 Freshness Review Expansion
- More granular review intervals per data type
- Proactive nudges when data goes stale ("It's been 4 months since you updated the medication list")
- Annual comprehensive review prompt

---

## Phase 5 — Collaboration & Scaling

Priority: Multi-caregiver support and distribution beyond single-user.

### 5.1 Family Sharing / Multi-Caregiver
**Status: Not started**
- Invite family members to shared parent profile
- Permission tiers (admin/view-only/task-assignee)
- Shared task board with assignment
- Activity feed ("Sarah updated the medication list")
- Discussion threads on tasks or decisions
- This is a major retention lever — multiple people depending on the data dramatically reduces churn

### 5.2 Care Team Coordination
- Shareable care summary for new providers
- Handoff packet if primary caregiver changes
- Family meeting summary generator ("here's where we stand")

### 5.3 B2B Distribution (Longer Term)
- Medicare Advantage plan integration
- Hospital discharge program partnerships
- Employer elder care benefits
- Health system care navigator tooling

---

## Feature Priority Matrix

| Feature | Impact | Effort | Phase |
|---------|--------|--------|-------|
| "What Matters Most" profile field | High | Low | 1 |
| AI doctor questions | High | Low | 1 |
| Discharge navigator playbook | High | Low | 1 |
| New diagnosis playbook | Med | Low | 1 |
| Mobility risk signals | Med | Low | 1 |
| Hospital companion mode | Very High | Med | 2 |
| Polypharmacy warning | High | Low | 2 |
| AI medication review | High | Med | 2 |
| Cognitive decline tracking | High | Med | 2 |
| Caregiver wellness check-in | Med | Low | 2 |
| Medicare enrollment guide | High | Med | 3 |
| Medicaid application guide | High | High | 3 |
| Veterans benefits guide | Med | Med | 3 |
| POLST/MOLST forms | Med | Med | 3 |
| Beneficiary audit | Med | Low | 3 |
| Insurance dispute templates | Med | Low | 3 |
| Life-stage content | Med | Med | 4 |
| External monitoring expansion | Med | Med | 4 |
| Family sharing | Very High | High | 5 |
| B2B distribution | Very High | Very High | 5 |

---

## Strategic North Star

**Readiness gets families in. Execution builds trust. Monitoring keeps them engaged. Crisis moments prove the value. Collaboration makes it indispensable.**

Harbor's progression:
1. **MVP**: Organization + readiness + execution support (legal forms, planning guides)
2. **Growth**: Clinical navigation + transition support (hospital, discharge, diagnosis)
3. **Retention**: Deepened monitoring + caregiver wellness + life-stage guidance
4. **Scale**: Multi-caregiver + B2B distribution

The geriatrician's core insight is right: the moments that matter most are hospitalizations, new diagnoses, sudden decline, and care transitions. But families only benefit from navigation in those moments if they've already captured the data. The readiness path builds the foundation. The crisis and transition features prove its value.
