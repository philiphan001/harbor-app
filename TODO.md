# Harbor — Feature TODO Log

## High Priority

- [ ] **Export / Share from Dashboard** — Quick way to email, print, or share information with providers. Use cases:
  - ER visit: email medication list + conditions + insurance info to admitting doctor
  - New specialist: print or share a care summary
  - Family member: share task list or readiness status
  - Potential formats: PDF, email body, shareable link (time-limited)

## Medium Priority

- [ ] **Task completion flow** — When marking a task as done, capture what was accomplished (e.g., "Added Dr. Chen's info" should update the Information Hub)
- [ ] **Readiness score recalculation** — After completing tasks, readiness score should update automatically
- [ ] **Push notifications / reminders** — Nudge users to complete urgent tasks or update stale information
- [ ] **Document OCR / extraction** — When user uploads insurance card or medication list photo, auto-extract structured data
- [ ] **Family sharing** — Invite family members to view/edit the care dashboard (shared Supabase access)
- [ ] **Crisis mode quick-access card** — One-tap "I'm in the ER" that surfaces everything a provider needs (meds, conditions, insurance, proxy)

## Future Segment: "Prepare for Your Future" (Self-Preparation)

- [ ] **Third pathway: "Prepare My Own Harbor"** — Same 4 domains, but user IS the subject. Pronouns flip: "your doctor" not "your parent's doctor." No crisis mode — pure readiness + information vault.
  - **Acquisition funnel**: Users who complete parent care naturally realize "my kids would have no idea where my stuff is either." The aha moment is organic — don't need to sell it.
  - **Trigger points**:
    - Crisis mode users: after stabilizing parent, surface "Don't put your kids through this — prepare your own Harbor"
    - Readiness mode users: after completing parent assessment, the shift to self-preparation is obvious
  - **Revenue model**: This is the premium/subscription tier. Free = assess your parent's crisis. Paid = maintain your own care vault long-term. Parent crisis is acquisition; self-prep is retention/monetization.
  - **Architecture**: Third onramp on `/get-started`. Same dashboard, task system, information hub. Difference is framing + no crisis mode + user=subject.
  - **Key advantage**: Decades-long retention vs. episodic parent care engagement
  - **Upsell opportunity**: This is a natural upsell point — user is already engaged, emotionally primed by their parent's experience, and the value prop is immediately obvious. Could be the conversion trigger for a paid tier.
  - **Timing**: Nail parent-care PMF first. Seed with a CTA on dashboard after parent setup is complete. Build as v2.

## Lower Priority

- [ ] **Conversation export** — Download or share conversation transcripts
- [ ] **Task templates** — Pre-built task lists for common scenarios (post-hospital discharge, new diagnosis, moving to assisted living)
- [ ] **Provider directory integration** — Suggest local elder law attorneys, geriatric care managers based on state
- [ ] **Offline mode** — localStorage-first means basic access works offline, but formalize this
- [ ] **Multi-language support** — Many caregivers coordinate across language barriers
- [ ] **Calendar integration** — Sync task deadlines and appointments to Google/Apple calendar

## Technical Debt

- [ ] **Tailwind CSS caching on Vercel** — Some classes don't render; workaround is inline styles. Investigate root cause.
- [ ] **Task deduplication** — Parallel extraction can create near-duplicate tasks across conversation turns
- [ ] **Profile data consolidation** — Data captured in questionnaire follow-ups should sync to Information Hub / parent profile
- [ ] **Conversation resumption** — Improve UX for returning to an in-progress readiness assessment
