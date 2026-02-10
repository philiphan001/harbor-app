# Harbor Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed (for PostgreSQL)
- Anthropic API key

## Quick Start

### 1. Install Dependencies

```bash
cd harbor-app
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
# Add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database URL (choose one option)
DATABASE_URL="postgresql://harbor:harbor_dev_password@localhost:5432/harbor"
```

### 3. Start Database

**Option A: Use Docker (Recommended)**

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- User: `harbor`
- Password: `harbor_dev_password`
- Database: `harbor`

**Option B: Use Prisma Dev (No Docker)**

```bash
npx prisma dev
```

This runs a local Postgres instance directly in your terminal.

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables defined in `prisma/schema.prisma`.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript client for database access.

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000** (or 3001 if 3000 is in use).

## What's Working

### ✅ Completed Features

1. **Home Screen** (`/`)
   - Crisis CTA
   - Preparedness CTA
   - Demo screen links

2. **AI Chat Interface**
   - Crisis intake flow (`/crisis`)
   - Readiness assessment flow (`/readiness`)
   - Real-time messaging with Claude API
   - Message history
   - Loading states

3. **Demo Screens**
   - Situation Brief (`/demo/brief`)
   - Care Scenarios (`/demo/scenarios`)
   - Family Circle (`/demo/family`)

4. **Database**
   - Full Prisma schema (16 models)
   - PostgreSQL setup
   - Migration ready

5. **Design System**
   - Harbor color palette
   - Source Serif 4 + DM Sans fonts
   - Mobile-first responsive layout
   - Tailwind configured

## Project Structure

```
harbor-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home screen
│   ├── layout.tsx                # Root layout with fonts
│   ├── globals.css               # Global styles
│   ├── crisis/                   # Crisis intake
│   │   └── page.tsx
│   ├── readiness/                # Readiness assessment
│   │   └── page.tsx
│   ├── demo/                     # Demo screens
│   │   ├── brief/
│   │   ├── scenarios/
│   │   └── family/
│   └── api/                      # API routes
│       └── chat/
│           └── route.ts          # Chat endpoint
├── components/                   # React components
│   └── ChatInterface.tsx         # Main chat UI
├── lib/                          # Utilities
│   ├── ai/
│   │   └── claude.ts             # Claude API integration
│   ├── types/
│   │   └── situation.ts          # TypeScript types
│   └── generated/
│       └── prisma/               # Generated Prisma client
├── prisma/
│   └── schema.prisma             # Database schema
├── docker-compose.yml            # PostgreSQL setup
├── .env                          # Environment variables
└── README.md                     # Project overview
```

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Run migrations
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate client

# Docker commands
docker-compose up -d           # Start database
docker-compose down            # Stop database
docker-compose logs -f         # View logs
```

## Testing the App

### 1. Test Crisis Intake

1. Go to http://localhost:3000
2. Click "My parent just had a health crisis"
3. Chat with the AI - it will guide you through intake
4. **Note:** You need a valid `ANTHROPIC_API_KEY` in `.env`

### 2. Test Readiness Assessment

1. Go to http://localhost:3000
2. Click "Check your Care Readiness Score"
3. Answer questions about your parent's situation
4. The AI will build a readiness profile

### 3. Explore Demos

1. From home, click any demo link:
   - "See a Sample Situation Brief"
   - "Explore Care Scenarios"
   - "Your Family Circle"
2. These show what the final output looks like

## Common Issues

### Port 3000 already in use

If you see "Port 3000 is in use", Next.js will automatically use 3001. Check the terminal output for the actual URL.

### Database connection failed

Make sure Docker is running:
```bash
docker ps
```

You should see `harbor-db` in the list. If not:
```bash
docker-compose up -d
```

### Prisma client not found

Run:
```bash
npx prisma generate
```

### API key not working

Make sure your `.env` file has:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

No quotes, no spaces around the `=`.

## Next Steps (Not Yet Implemented)

- [ ] Readiness Score calculation logic
- [ ] Scenario generation engine with financial models
- [ ] Document upload (S3 integration)
- [ ] Conversation persistence to database
- [ ] User authentication (NextAuth)
- [ ] Family Circle multi-user features
- [ ] Background monitoring agents
- [ ] Email notifications
- [ ] Readiness Score sharing
- [ ] Mobile app (React Native)

## Support

For issues or questions:
- Check the [main README](./README.md)
- Review the [harbor-spec.md](/Users/philiphan/Downloads/files 2/harbor-spec.md)
- See the [prototype reference](/Users/philiphan/Downloads/files 2/harbor-app.jsx)
