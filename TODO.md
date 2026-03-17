# Harbor — Feature TODO Log

## Completed

- [x] **Task completion flow** — completedAt tracking, smart structured forms per task type, collapsible priority categories, document upload inline with extraction review
- [x] **Steady-state dashboard** — Care Summary Card, Domain Status Tiles, freshness indicators, reorganized layout as care command center
- [x] **Export / Share from Dashboard** — Scenario presets (ER visit, specialist, family), copy/email/print/download, section picker with live preview
- [x] **Document OCR / extraction** — Scanned PDF rendering via pdf-to-img + Claude Vision, extraction-to-task-data bridge, inline review in task completion
- [x] **Readiness score recalculation** — Factors in completed tasks, manual notes, caps domain scores at 100
- [x] **Internal utility agents** — Gap detector, freshness monitor, conflict resolver (client-side analysis of captured data)

## High Priority — Intelligence Layer (MVP-Critical)

The infrastructure (data capture, storage, extraction, display) is built. What's missing is the **intelligence layer** — the part that makes Harbor feel like a care coordinator, not a checklist app. Without this, user trust breaks quickly.

### Promise Gap Analysis

Users expect Harbor to act as:
- **Readiness mode**: A long-range care strategist
- **Crisis mode**: A real-time care coordinator
- **Both**: A mistake-prevention system

The bar is **relief and confidence**, not productivity or organization.

Items below are ordered by recommended build sequence — #1 is the most differentiated feature and directly addresses the "someone is guiding me" litmus test. #2–#3 build on the data foundation. #4–#5 are cross-cutting quality improvements. #6 requires auth infrastructure.

### 1. Crisis Mode Quick-Triage _(build first — highest differentiation)_
- [ ] **"I'm in the ER" instant triage** — One-tap button that immediately surfaces:
  - What decisions must be made in the next 2 hours
  - Who to call first
  - What documents are needed immediately (meds, insurance, POA)
  - What can wait
  - Pre-formatted handoff sheet for the admitting team
- [ ] **Crisis-type-specific playbooks** — Different crises need different responses:
  - Fall/fracture: discharge planning, home safety, rehab options
  - Stroke/cardiac: time-sensitive decisions, transfer protocols
  - Cognitive decline episode: safety assessment, driving, wandering
  - Hospitalization: insurance coverage, discharge rights, care transitions
- [ ] **System navigation guidance** — Not definitions, recommendations:
  - Discharge planning guidance ("don't agree to discharge until X")
  - Coverage implications explained in plain language
  - Care level tradeoffs (home care vs. SNF vs. assisted living)
  - Protection from costly mistakes (wrong forms, missed deadlines, unsafe discharge)

### 2. Adaptive Task Regeneration
- [ ] **Recommendations evolve with new data** — When user uploads a discharge summary, adds new diagnosis info, or completes tasks, the system should:
  - Re-assess priorities based on current state
  - Generate new tasks that reflect the changed situation
  - Retire tasks that are no longer relevant
  - Surface things the user hasn't thought of yet
- [ ] **Continuous situational awareness** — Extend the existing internal agents (gap detector, freshness monitor) to proactively surface insights:
  - "You added a new medication — have you checked for interactions?"
  - "Your parent's POA was completed 3 years ago — consider reviewing it"
  - "Based on the discharge summary, here are 3 things to do this week"

### 3. Predictive Timeline / Roadmap
- [ ] **Future trajectory, not just current tasks** — Users don't want a to-do list, they want:
  - "Here is what typically happens in 1 year, 3 years, 5 years"
  - Milestone alerts before problems occur
  - Preparation windows ("do this before hospitalization risk rises")
  - Staged planning ("not urgent yet" vs. "do now" vs. "window closing")
- [ ] **Condition-aware trajectories** — A parent with early dementia has a different roadmap than one recovering from a hip fracture. Tailor based on:
  - Known diagnoses / health conditions
  - Age and state
  - Current living arrangement
  - Existing support structure

### 4. Emotional Intelligence
- [ ] **Tone that matches the moment** — The app should:
  - Reduce panic in crisis mode (calm, directive, "you're doing the right thing")
  - Build confidence in readiness mode ("you're more prepared than most")
  - Acknowledge the emotional weight ("this is hard — here's one thing you can do today")
  - Never feel clinical or bureaucratic
- [ ] **Cognitive load management** — In crisis especially:
  - Triage: "what matters right now vs. what feels urgent but isn't"
  - Never show everything at once
  - Progressive disclosure: most critical first, details on demand

### 5. Knowledge Layer
- [ ] **Domain expertise baked into guidance** — Harbor should behave like an experienced elder-care advisor who has seen this hundreds of times:
  - State-specific legal requirements (POA forms, Medicaid rules)
  - Insurance system navigation (Medicare parts, prior auth, appeals)
  - Care transition best practices
  - Common mistakes families make (and how to avoid them)
- [ ] **Proactive surfacing** — Don't wait for the user to ask:
  - "Most families in your situation forget about X"
  - "In [state], Medicaid has a 5-year lookback — here's what that means for you"
  - "Your parent's insurance may not cover SNF beyond 20 days — plan now"

### 6. Family Coordination _(requires auth infrastructure)_
- [ ] **Family sharing** — Invite family members to view/edit the care dashboard
- [ ] **Automatic role suggestions** — Based on who's local, who has flexibility, who has expertise
- [ ] **Conversation prompts** — Help start difficult family conversations
- [ ] **Shareable summaries** — Not long reports, concise "here's where we stand" updates
- [ ] **Single shared truth** — Eliminate repeated explanations and duplicated work

## Exploration — Expert Marketplace

Harbor currently guides families through *what* to do but doesn't connect them to *who* can do it. The opportunity is embedding vetted professionals at the point of need — not an expert network (research/knowledge), but orchestrated expertise at the moment of action.

- [ ] **Identify first integration point** — Care transition playbook steps that naturally require a professional (e.g., "Confirm admission status" → hospital advocate, "Draft POA" → elder law attorney)
- [ ] **Define professional categories** — Elder law attorneys, geriatric care managers, medical advocates, fiduciaries, benefits specialists
- [ ] **Design "pre-briefed" handoff** — The key unlock is that a professional surfaced inside Harbor already has context (meds, legal status, housing). Spec out what that handoff looks like.
- [ ] **Marketplace vs. referral model** — Decide whether Harbor facilitates transactions (marketplace) or curates trusted referrals. Different business models, different regulatory requirements.

## Marketing — Landing Page Video

4-scene AI-generated video (~45-60 sec) for landing page hero. Captures the emotional arc: panic → helplessness → realization → Harbor.

- [ ] **Generate scenes via Veo 2** — Prompts drafted (ER arrival, doctor questions, phone call, Harbor resolution). Expect 3-5 iterations per scene for right feel.
- [ ] **VO recording** — Use ElevenLabs, warm conversational female voice. Script: "You can't predict the emergency. But you can be ready for it."
- [ ] **Scene 4 UI recording** — Actual Harbor app screen recording needed for the resolution scene (profile, readiness score, guides)
- [ ] **Edit + music** — Stitch in CapCut/DaVinci, subtle piano underscore for scenes 1-3, warmer tone for scene 4

## Medium Priority

- [ ] **Push notifications / reminders** — Nudge users to complete urgent tasks or update stale information

## Lower Priority

- [ ] **Conversation export** — Download or share conversation transcripts
- [ ] **Task templates** — Pre-built task lists for common scenarios (post-hospital discharge, new diagnosis, moving to assisted living)
- [ ] **Provider directory integration** — Suggest local elder law attorneys, geriatric care managers based on state
- [ ] **Offline mode** — localStorage-first means basic access works offline, but formalize this
- [ ] **Multi-language support** — Many caregivers coordinate across language barriers
- [ ] **Calendar integration** — Sync task deadlines and appointments to Google/Apple calendar

## Architecture — Signal Unification

The nudge system (client-side, localStorage) and briefing system (server-side, DB + Claude) grew independently but operate on overlapping data. Currently bridged with a filter that excludes dismissed/acknowledged alerts from briefing generation. Target architecture:

- [ ] **Move nudge state to DB** — Consolidate localStorage nudge state (`harbor_nudge_instances`, `harbor_nudge_states`) into Postgres, aligned with `SituationAlertStatus`
- [ ] **Single scoring pipeline** — Replace dual scoring (P0-P4 tiers + relevance 0-100) with one pass that feeds both nudge cards and briefing markdown
- [ ] **Two renderers, one source** — Keep the real-time nudge banner and weekly digest as separate UX, but driven from unified signal state. Solve offline-first before fully consolidating.

## Technical Debt

- [ ] **Persistence strategy decision** — Currently dual localStorage + Supabase write-through with no conflict resolution. Pick one source of truth: either commit to DB-first with auth, or stay localStorage-only until auth is solid.
- [ ] **API route auth enforcement** — Supabase auth scaffolding exists but no API routes check authentication. Any endpoint can be called unauthenticated.
- [ ] **Rate limiting on Claude endpoints** — `rateLimit.ts` exists but needs to be wired into all Claude-calling API routes to prevent abuse.
- [ ] **Migrate demo route off deprecated agents** — `/api/briefing/demo` still uses class-based agents in `/lib/agents/`. Migrate to functional versions in `/lib/ai/`.
- [ ] **Tailwind CSS caching on Vercel** — Some classes don't render; workaround is inline styles. Investigate root cause.
- [ ] **Task deduplication** — Parallel extraction can create near-duplicate tasks across conversation turns
- [ ] **Profile data consolidation** — Data captured in questionnaire follow-ups should sync to Information Hub / parent profile
- [ ] **Conversation resumption** — Improve UX for returning to an in-progress readiness assessment
- [ ] **Remove `proxy.ts`** — Root-level file with no imports; appears unused.

## Litmus Test

After using Harbor, users should feel:
- **Readiness**: "I know what's coming and I'm prepared."
- **Crisis**: "I can breathe. Someone is guiding me."

If they instead feel "informed" or "organized" — that's useful but falls short of the promise. The bar is **relief and confidence**.
