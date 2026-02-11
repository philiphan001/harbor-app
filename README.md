# Harbor

> A steady hand when your family needs it most.

**Harbor** is an AI-powered elder care navigator that helps families manage the unexpected complexity of caring for aging parents. From crisis intake to ongoing care coordination, Harbor provides intelligent guidance across medical, financial, legal, and housing domains.

## ✨ Features

### 🎯 24/7 AI Crisis Intake
- Immediate triage and organization during health emergencies
- User-directed conversation flow that adapts to your priorities
- Continuous task extraction without interrupting the conversation
- 3-5x faster response times compared to traditional approaches

### 📋 Intelligent Task Management
- Automatically consolidates related tasks to prevent overwhelm
- Priority-based organization (24-48 hours / This week / When things settle)
- Multi-parent support with easy context switching
- Tasks scoped to specific parents with isolated data

### 👥 Multi-Parent Support
- Manage care for multiple parents simultaneously
- Quick switcher dropdown to toggle between parent contexts
- Separate task lists and profiles per parent
- Clean, focused dashboard for each parent

### 🔔 Proactive Care Monitoring
- Calendar monitoring for upcoming deadlines
- AI judgment agent for relevance scoring
- Weekly briefing generation
- Signal detection across all care domains

### 📱 Mobile-First Design
- Optimized for 420px mobile viewport
- State-based navigation (landing vs dashboard)
- Progressive disclosure based on user state
- Accessible, readable typography

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **AI**: Anthropic Claude Sonnet 4
- **Styling**: Tailwind CSS
- **Storage**: LocalStorage (MVP), ready for database migration
- **Architecture**: Continuous extraction pattern (parallel API calls)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/philiphan001/harbor-app.git
cd harbor-app

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your Anthropic API key to .env.local
# ANTHROPIC_API_KEY=your_api_key_here
```

### Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Project Structure

```
harbor-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (marketing, auto-redirects returning users)
│   ├── dashboard/         # Main workspace for active users
│   ├── crisis/            # Crisis intake flow
│   ├── readiness/         # Care Readiness Assessment
│   ├── tasks/             # Task management page
│   ├── profile/           # Parent information hub
│   └── api/
│       ├── chat/          # Conversation API (no tools, fast response)
│       └── extract-tasks/ # Background task extraction API
├── components/            # Reusable React components
│   ├── ChatInterface.tsx  # Parallel extraction implementation
│   ├── TaskList.tsx       # Task display with consolidation
│   └── TaskDetail.tsx     # Individual task modal
├── lib/                   # Utilities and services
│   ├── ai/
│   │   └── claude.ts      # Claude API with tool-optional mode
│   └── utils/
│       ├── parentProfile.ts  # Multi-parent support
│       └── taskStorage.ts    # Task-parent association
└── public/               # Static assets
```

## Architecture

### Continuous Extraction Pattern

Harbor uses a **parallel API architecture** to optimize response time and avoid exponential token growth:

**Traditional Tool-Based Approach** (deprecated):
- Single API call with tools enabled
- Each tool use triggers a continuation loop
- Full conversation history reloaded each time
- Exponential token growth: 1500 → 1750 → 2200 → 2700+ tokens
- Total latency: 15-25 seconds for complex intakes

**Continuous Extraction** (current):
```typescript
// Two parallel API calls per user message
Promise.all([
  fetch('/api/chat'),          // Conversation only, no tools (~3s)
  fetch('/api/extract-tasks')  // Background extraction (~3-5s)
])
```

**Benefits**:
- **3-5x faster**: User sees response in ~3s (vs 15-25s)
- **Linear token growth**: No continuation loops
- **Non-blocking**: Task extraction happens in background
- **Resilient**: If user navigates away, conversation state is preserved

### Multi-Parent Data Model

- **Profile Storage**: Array of parent profiles in LocalStorage (`harbor_parent_profiles`)
- **Active Parent**: Single ID tracking current context (`harbor_active_parent_id`)
- **Task Association**: Each task linked to `parentId` for data isolation
- **Auto-switching**: Dashboard shows only active parent's tasks and profile

## Implementation Status

- [x] State-based navigation (landing vs dashboard)
- [x] Continuous extraction architecture
- [x] Multi-parent support with switcher
- [x] AI conversational intake (crisis path)
- [x] Task consolidation and prioritization
- [x] Mobile-first responsive design
- [ ] Care Readiness Assessment (preparedness path)
- [ ] Weekly briefing generation
- [ ] Scenario simulation engine
- [ ] Document upload and parsing
- [ ] Database migration (currently LocalStorage)
- [ ] User authentication

## Key Design Decisions

### Why Continuous Extraction?

During development, we discovered that Anthropic's tool use pattern creates continuation loops that reload the entire conversation history with each tool call. For a 5-turn conversation with 3 tool uses each, this resulted in:
- 15+ API calls (1 initial + 3 continuations per turn × 5 turns)
- Exponential token growth (1500 → 2700+ tokens)
- 15-25 second latency for complex intakes

Continuous extraction eliminates this by making two parallel API calls:
1. **Conversation API** (no tools): Fast response (~3s)
2. **Task Extraction API** (background): Structured output (~3-5s)

Result: **3-5x faster response time** with linear token growth.

### Why Separate Landing and Dashboard?

**Problem**: Showing the same UI to both new users and returning users creates confusion.

**Solution**: State-based navigation
- **Landing page**: Marketing-focused for new users (crisis CTA, readiness CTA, value props)
- **Dashboard**: Workspace for active users (action items, weekly briefing, profile)
- **Auto-redirect**: Returning users (with parent profile) skip landing and go straight to dashboard

### Why Multi-Parent Support?

Elder care rarely involves just one parent. Users often need to coordinate care for both parents or switch context between them. The multi-parent architecture:
- Isolates data per parent (tasks, profile, context)
- Uses a dropdown switcher for quick context switching
- Maintains separate task lists for each parent
- Auto-selects the first parent on initial creation

## Design System

### Color Palette

- **Ocean** (#1B6B7D) - Primary, trust, navigation
- **Coral** (#D4725C) - Urgency, medical tasks
- **Sage** (#6B8F71) - Positive actions, legal tasks
- **Amber** (#C4943A) - Warning, housing tasks
- **Sand** (#F5F0E8) - Backgrounds, warmth

### Typography

- **Source Serif 4** - Warmth, trust, emotional content
- **DM Sans** - Competence, clarity, UI elements

### Mobile-First Design

- Optimized for **420px viewport** (iPhone 14 Pro)
- Progressive disclosure based on user state
- State-based navigation (landing vs dashboard)
- Accessible, readable typography (15px body text)

## License

Private - Flight Plan LLC
