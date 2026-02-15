# Harbor Development Handoff Note

**Date**: February 14, 2026
**Session**: Continuation - Readiness & Internal Agents Implementation
**Model**: Transitioning from Sonnet 4.5 → Opus 4.6

---

## What Was Completed This Session

### 1. Fixed Tailwind Dynamic Class Issues
**Problem**: Tailwind JIT compiler doesn't support template literal class names like `bg-${color}`

**Solution**: Changed to explicit ternary conditionals with full class strings

**Files Modified**:
- `/app/dashboard/page.tsx` - Readiness score widget, detection alerts, domain indicators
- `/app/readiness/results/page.tsx` - Domain progress bars, recommendation cards

**Example Fix**:
```typescript
// ❌ Before (doesn't work)
className={`bg-${color} h-2 rounded-full`}

// ✅ After (works)
className={
  color === "coral"
    ? "bg-coral h-2 rounded-full transition-all"
    : color === "sage"
    ? "bg-sage h-2 rounded-full transition-all"
    : "bg-ocean h-2 rounded-full transition-all"
}
```

### 2. Built Internal Utility Agents
**Location**: `/lib/ai/internalAgents.ts`

Three client-side agents that analyze user's captured data:

1. **Gap Detector** - Identifies missing critical information
   - Primary care doctor contact
   - Current medications list
   - Power of Attorney status
   - Primary bank account
   - Emergency contacts

2. **Freshness Monitor** - Detects outdated information
   - Medication lists older than 6 months
   - Profile updates older than 3 months
   - Triggers suggested update tasks

3. **Conflict Resolver** - Finds contradictory data
   - Duplicate tasks in action items
   - Multiple primary care doctors saved
   - Inconsistent data entries

**API Endpoint**: `/app/api/run-internal-agents/route.ts`
Returns detections with severity summary (critical, high, medium, low)

**UI Page**: `/app/insights/page.tsx`
Displays all detections organized by severity level

### 3. Enhanced Readiness Results Page
**File**: `/app/readiness/results/page.tsx`

**Changes**:
- Now loads real calculated readiness scores via `calculateReadinessScore()`
- Displays actual domain breakdown (medical, legal, financial, housing)
- Shows top 3 priority recommendations from internal agents
- Parent name personalization throughout
- Critical gap count in header
- Fixed Tailwind dynamic classes in domain cards

**Data Flow**:
```
useEffect on mount
  ↓
getParentProfile() → parent info
calculateReadinessScore() → scores & gaps
runAllInternalAgents() → recommendations
  ↓
Filter for critical/high severity only
  ↓
Display top 3 in UI
```

---

## Current Architecture

### Data Storage (localStorage MVP)
- **Parent Profiles**: `/lib/utils/parentProfile.ts`
- **Task Data**: `/lib/utils/taskData.ts`
- **Tasks**: `/lib/utils/taskStorage.ts`
- **Briefings**: `/lib/utils/briefingStorage.ts`

### AI Intelligence Layer
- **Judgment Agent**: `/lib/ai/judgmentAgent.ts` - Routes conversations, generates tasks
- **Briefing Agent**: `/lib/ai/briefingAgent.ts` - Creates weekly briefings
- **Internal Agents**: `/lib/ai/internalAgents.ts` - Analyzes data for gaps/issues
- **Claude Client**: `/lib/ai/claude.ts` - Anthropic API wrapper

### Readiness Scoring
**File**: `/lib/utils/readinessScore.ts`

**Algorithm**:
- Medical: 30% weight (4 critical fields × 25 points each)
- Legal: 30% weight (4 critical fields × 25 points each)
- Financial: 25% weight (4 fields × 25 points each)
- Housing: 15% weight (3 fields × 33 points each)

**Output**:
```typescript
{
  overall: 0-100,
  domains: { medical, legal, financial, housing },
  criticalGaps: string[],
  status: "critical" | "needs-attention" | "prepared" | "well-prepared"
}
```

### Key Pages & Routes
- `/` - Landing (needs building)
- `/readiness` - Readiness assessment intake (chat + questionnaire)
- `/readiness/results` - Readiness score & recommendations ✅ Enhanced
- `/crisis` - Crisis situation intake
- `/dashboard` - Main hub (readiness, detections, briefing, tasks) ✅ Fixed
- `/tasks` - Action items list
- `/briefing` - Weekly briefing view
- `/insights` - Internal agent detections ✅ New
- `/profile` - Information hub (needs enhancement)

---

## Known Issues & Technical Debt

### 1. Tailwind Dynamic Classes Throughout Codebase
Other pages may still have dynamic class issues. Search for:
```bash
grep -r "className={\`.*\${" app/
grep -r "bg-\${" app/
```

### 2. Missing Pages
- Home/landing page for new users
- Enhanced profile/information hub page
- Settings page

### 3. External Intelligence Agents Not Built
Planned but not implemented:
- FDA drug interaction checker
- Medicare coverage lookup
- Hospital quality ratings
- News/alert monitoring

### 4. No Backend Database
Currently using localStorage. Need migration path to:
- PostgreSQL/Supabase for production
- User authentication
- Multi-device sync

### 5. Build Warnings
Multiple background dev servers running (see system reminders). Should clean up:
```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```

---

## Product Strategy Decisions

### Current Focus: Emergency Management
Harbor is **primarily** a crisis readiness and emergency management platform, NOT comprehensive estate planning.

**In Scope**:
- Readiness assessment
- Crisis situation handling
- Critical information capture
- Action item management
- Intelligent briefings

**Out of Scope (For Now)**:
- Comprehensive data vault
- 100+ question estate planning checklist
- Full financial/legal document management
- Advanced elder care coordination

**Key Quote**: "harbor while a crisis platform - the bigger upfront value proposition may be in the readiness aspect"

### User Expectations
- Self-selecting planners who care about preparedness
- Don't force 100 questions upfront
- Progressive data capture over time
- Focus on critical gaps first
- Build information base through conversations and task completion

---

## What's Next

### Immediate Priorities
1. Test readiness results page with real data
2. Verify internal agents are detecting gaps correctly
3. Check for remaining Tailwind dynamic class issues
4. Clean up background dev servers

### Near-Term Features
1. Enhance `/profile` (information hub page)
2. Build home/landing page
3. Improve task management UI
4. Add task completion flow that updates readiness score

### Medium-Term
1. External intelligence agents (FDA, Medicare, etc.)
2. Smarter briefing generation with real signals
3. Database migration planning
4. User authentication

### Long-Term Evolution
- Transition from emergency management → estate planning/transitional care
- Optional comprehensive information vault
- Multi-parent support
- Caregiver collaboration features

---

## Development Notes

### Running the App
```bash
cd /Users/philiphan/harbor-app
npm run dev
# Runs on http://localhost:3000
```

### Testing Internal Agents
```bash
# Via API
curl http://localhost:3000/api/run-internal-agents

# Via UI
# Navigate to http://localhost:3000/insights
```

### Common Commands
```bash
# Clean build
rm -rf .next && npm run dev

# Kill all Next.js processes
pkill -f "next dev"

# Check for dynamic Tailwind classes
grep -r "bg-\${" app/ lib/
```

---

## Files Changed This Session

1. `/app/dashboard/page.tsx` - Fixed Tailwind dynamic classes
2. `/lib/ai/internalAgents.ts` - Created internal utility agents
3. `/app/api/run-internal-agents/route.ts` - Created API endpoint
4. `/app/insights/page.tsx` - Created insights UI page
5. `/app/readiness/results/page.tsx` - Enhanced with real data & recommendations
6. `/Users/philiphan/.claude/settings.json` - Switched to Opus 4.6

---

## Context for Next Developer

Harbor is a **mobile-first web app** helping adult children prepare for parent emergencies. Think "oh shit, my mom fell and I don't know her medications" scenario.

**Core Value Props**:
1. **Readiness Assessment** - Figure out what critical info you're missing
2. **Crisis Support** - Get guided help when emergency happens
3. **Progressive Capture** - Build information base over time, not all upfront
4. **Intelligence Layer** - AI agents detect gaps, monitor freshness, suggest actions

**Design Philosophy**:
- Mobile-first (max-width: 420px)
- Calm, supportive aesthetic (ocean/coral/sage color palette)
- No overwhelming questionnaires
- Smart task generation
- Conversational interfaces

**Tech Stack**:
- Next.js 16.1.6 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- localStorage (MVP) → PostgreSQL (production)

---

## Questions for Product Direction

1. Should we build the home/landing page next, or focus on enhancing existing flows?
2. How should task completion update readiness scores in real-time?
3. What's the migration path from localStorage to production database?
4. Should internal agents run on every page load, or on-demand only?
5. How do we handle the transition from emergency management to estate planning features?

---

**End of Handoff Note**
