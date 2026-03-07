# Harbor — Investor Deck Outline
## Pre-seed / Seed stage — deck structure for when the time comes

---

### Slide 1: Title
- Harbor: The caregiving readiness platform
- Tagline: "Organize. Execute. Navigate. Before the crisis hits."

### Slide 2: The Problem
- 53M Americans are caregivers for aging family members — growing to 75M+ by 2030
- The average caregiver spends 24 hours/week on caregiving tasks, 60% report significant stress
- Most families are unprepared: no legal documents, scattered medical records, no plan
- When a crisis hits, the cost is enormous: wrong care decisions, preventable readmissions, caregiver burnout and health decline
- Existing solutions are either static information (AARP articles), clinical tools families can't access (EHR portals), or lightweight organizers with no decision support

### Slide 3: The Insight
- Caregiving has two modes: **proactive** (getting organized) and **reactive** (crisis response)
- Every app in this space picks one. Harbor does both — and connects them.
- The data captured proactively becomes critical in a crisis. The crisis proves the value of being organized. The ongoing monitoring keeps families engaged between events.
- This creates a self-reinforcing loop: readiness → crisis value → deeper engagement → better readiness

### Slide 4: What Harbor Does
- AI-powered caregiving readiness and navigation platform
- Helps adult children organize a parent's medical, legal, financial, and housing information
- Provides execution support — not just "you need a POA" but the actual state-specific forms, requirements, and step-by-step completion guides
- When a crisis hits: real-time AI triage, auto-generated tasks, crisis playbooks, ER tools
- Stays with families over time: AI monitoring, weekly briefings, adaptive task management

### Slide 5: Product — The Readiness Path
- Guided assessment across 6 domains (medical, legal, financial, housing, transportation, social)
- Two intake modes: structured questionnaire or AI conversation
- Readiness score (0-100) with critical gap identification and prioritized action plan
- State-specific legal form execution: POA, Advance Directives, HIPAA — with the forms, checklists, and pitfall guides
- Planning guides: housing, home safety, transportation, social care, facility search

### Slide 6: Product — The Crisis Path
- Real-time AI triage conversation — user describes situation, AI extracts tasks in background
- Crisis playbooks for common emergencies (falls, stroke, cognitive decline, hospitalization)
- ER triage sheet, printable wallet card, exportable care summaries for ER/attorney/family
- Document intelligence: upload photo of insurance card or med list → auto-extracted data

### Slide 7: Product — The Ongoing Loop
- This is not a one-time organization tool
- Background monitoring agents detect care-relevant signals (medication risks, policy changes, deadlines)
- Judgment agent scores signals against the parent's specific profile (age, conditions, meds, living situation)
- Weekly AI briefings surface what matters, ranked by urgency, with recommended actions
- Life events trigger task cascades — a fall generates home safety, doctor follow-up, and housing reassessment tasks
- The platform adapts as the parent's situation evolves

### Slide 8: Why Now
- **AI inflection**: Claude-class models make conversational triage, document extraction, and contextual monitoring possible for the first time at consumer-grade cost
- **Demographic wave**: 10,000 Americans turn 65 every day. The caregiver population is growing faster than any support infrastructure
- **Regulatory tailwinds**: CMS pushing value-based care, care transition quality measures, caregiver support programs
- **Consumer behavior shift**: post-COVID awareness of elder care fragility; families actively seeking digital tools

### Slide 9: Market
- **TAM**: 53M caregivers x willingness to pay for peace of mind = large consumer market
- **Adjacent markets**: Medicare Advantage plans (50M+ enrollees, $400B+ market), employer benefits ($34B/year lost to caregiving), health system discharge programs
- **Wedge**: direct-to-consumer acquisition via readiness path → expand to B2B distribution partnerships
- **Expansion**: "Prepare Your Own Harbor" — users who finish parent care realize their own kids would have the same problem. Self-preparation segment = decades-long retention vs. episodic parent care

### Slide 10: Business Model
- **Freemium consumer subscription**:
  - Free: readiness assessment, legal forms, task list, parent profile (the hook)
  - Core ($12/mo): monthly AI briefings, proactive alerts, document reminders, unlimited AI chat
  - Premium ($25/mo): weekly briefings, family sharing, priority signal scoring
- **B2B** (future): partner licensing for AARP-style organizations, Medicare Advantage plans, health systems, employers
- **Unit economics**: AI costs per user decline with caching and prompt optimization; high-value users convert to paid when they experience a crisis and realize the monitoring loop's value

### Slide 11: Traction
- [To be filled in — MVP status, user count, engagement metrics, qualitative feedback]
- Key product milestones: readiness assessment, crisis intake, AI monitoring/briefings, document extraction, guided legal forms, facility search, ER tools — all live

### Slide 12: Competitive Landscape
| | Harbor | CareZone/Lotsa | AARP Resources | EHR Patient Portals |
|---|---|---|---|---|
| Proactive readiness assessment | Yes | No | No | No |
| AI crisis triage | Yes | No | No | No |
| Legal form execution | Yes | No | Info only | No |
| Ongoing AI monitoring | Yes | No | No | No |
| Document extraction | Yes | No | No | Limited |
| Caregiver-centric UX | Yes | Partial | Yes | No |

- Competitors are either information-only (AARP), logistics-only (CareZone), or clinician-facing (EHR portals)
- Harbor combines readiness, execution, crisis support, and ongoing AI navigation in one platform

### Slide 13: Roadmap
- **Now (MVP)**: Readiness assessment, crisis intake, guided legal forms, AI monitoring/briefings, document intelligence, facility search, ER tools
- **Next**: Hospital companion mode, medication safety layer, cognitive decline tracking, caregiver wellness, discharge navigator
- **Later**: Medicare/Medicaid enrollment guides, family sharing, B2B partnerships, self-preparation segment

### Slide 14: Team
- [To be filled in]

### Slide 15: The Ask
- [To be filled in when raising — amount, use of funds, milestones to hit]

---

## Appendix Slides (have ready, don't present unless asked)

### A: Product Screenshots
- Dashboard, readiness score, crisis chat, legal form guide, weekly briefing, facility search

### A: Technical Architecture
- Next.js + Anthropic Claude + Supabase + PostgreSQL
- Continuous extraction pattern (parallel chat + background task extraction)
- Agent monitoring loop (detection → scoring → briefing)

### B: Detailed Financial Model
- [To be built — unit economics, CAC assumptions, LTV by tier]

### C: User Journey Detail
- Flow diagram (landing → pathway → assessment/crisis → dashboard → ongoing loop)

### D: Clinical Validation
- Alignment with 5Ms of Geriatrics framework (Medications, Mobility, Mind, Multicomplexity, What Matters)
- Crisis playbook clinical review notes
