# Harbor — AI-Native Elder Care Navigation Platform

An AI-powered elder care coordination platform that helps adult children navigate the complexity of managing an aging parent's care.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude API
- **Database**: PostgreSQL with pgvector (local development via Docker)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start local database (optional for Phase 1)
docker-compose up -d

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
harbor-app/
├── app/                    # Next.js App Router pages
│   ├── crisis/            # Crisis intake flow
│   ├── readiness/         # Care Readiness Assessment
│   ├── demo/              # Demo screens (situation brief, scenarios, family)
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utilities and services
│   ├── ai/               # Claude API integration
│   ├── db/               # Database client and queries
│   └── types/            # TypeScript types
└── public/               # Static assets
```

## Phase 1 Features

- [x] Home screen with crisis/preparedness paths
- [ ] AI conversational intake (crisis path)
- [ ] Care Readiness Assessment (preparedness path)
- [ ] Situation model database
- [ ] Scenario generation engine
- [ ] Basic document upload
- [ ] Shareable Readiness Score

## Design System

See [harbor-spec.md](/Users/philiphan/Downloads/files 2/harbor-spec.md) and [harbor-app.jsx](/Users/philiphan/Downloads/files 2/harbor-app.jsx) for complete design reference.

### Color Palette

- Ocean (#1B6B7D) - Primary, trust
- Coral (#D4725C) - Urgency, medical
- Sage (#6B8F71) - Positive, legal
- Amber (#C4943A) - Warning, housing
- Sand (#F5F0E8) - Backgrounds

### Typography

- Source Serif 4 - Warmth, trust, emotional content
- DM Sans - Competence, clarity, UI elements

## License

Private - Flight Plan LLC
