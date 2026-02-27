# Harbor Freemium Tier System & Monthly Briefing Agent

## Context

Harbor currently has all features available to all users. To build a sustainable subscription business, we need a 3-tier freemium model where the **one-time intake is free** (the hook) and **ongoing monitoring/briefings are paid** (the retention). The existing infrastructure is mature: external monitoring agents run daily via cron, a briefing agent generates weekly summaries, email is wired via Resend, and `User.subscriptionTier` already exists in the Prisma schema (defaulting to `"free"`).

**Goal:** Implement gating, Stripe billing, and tier-aware briefing frequency so we can launch Free / Core ($12/mo) / Premium ($25/mo).

---

## Tier Definition

| Feature | Free | Core ($12/mo) | Premium ($25/mo) |
|---------|------|---------------|-------------------|
| Readiness assessment | Yes | Yes | Yes |
| POA / advance directive forms | Yes | Yes | Yes |
| Task list from intake | Yes | Yes | Yes |
| Parent profile | 1 parent | Multi-parent | Multi-parent |
| AI conversations | 5/month | Unlimited | Unlimited |
| Briefings | None | Monthly | Weekly |
| Proactive alert emails | No | Yes | Yes |
| Document renewal reminders | No | Yes | Yes |
| Benefits scanner | No | Yes | Yes |
| Family sharing | No | No | Yes |
| Priority signal scoring | No | No | Yes |

---

## Phase 1: Core Paywall (this implementation)

### Step 1: Tier Configuration Module

**New file:** `lib/config/tiers.ts`

- Define `SubscriptionTier` type: `"free" | "core" | "premium"`
- Define `TierConfig` interface with feature flags (briefingFrequency, proactiveAlerts, maxParents, unlimitedAiChat, familySharing, etc.)
- Export `TIER_CONFIG` record mapping each tier to its config
- Export `tierMeetsMinimum(userTier, requiredTier)` helper (ordinal comparison)
- Export `getTierFeatures(tier)` shorthand
- `stripePriceId` values come from env vars: `STRIPE_CORE_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

### Step 2: Prisma Schema — Add Stripe Fields

**File:** `prisma/schema.prisma`

Add to `User` model:
```
stripeCustomerId       String?  @unique
stripeSubscriptionId   String?
stripePriceId          String?
stripeCurrentPeriodEnd DateTime?
```

Run `npx prisma migrate dev --name add-stripe-fields`.

### Step 3: Server-Side Tier Guard

**File:** `lib/supabase/auth.ts`

Add `requireTier(minimumTier)` function alongside existing `requireAuth()`:
- Calls `requireAuth()` first
- Queries `prisma.user.findUnique` for `subscriptionTier`
- Returns 403 `{ error: "Upgrade required", requiredTier, currentTier }` if insufficient
- Returns `{ user: AuthUser & { subscriptionTier } }` on success

**Apply `requireTier()` to these routes:**
- `app/api/generate-briefing/route.ts` → `requireTier("core")`
- Alert email sending in `lib/agents/runner.ts` → check tier before sending
- AI chat routes keep `requireAuth()` but add free-tier rate limit (5/month)

### Step 4: Stripe Integration

**Install:** `npm install stripe`

**New files:**

| File | Purpose |
|------|---------|
| `lib/stripe/client.ts` | Stripe SDK singleton |
| `app/api/stripe/checkout/route.ts` | Create Checkout Session for tier upgrade |
| `app/api/stripe/portal/route.ts` | Create Customer Portal session for managing subscription |
| `app/api/stripe/webhook/route.ts` | Handle Stripe events (subscription created/updated/deleted, payment failed) |

**Webhook events to handle:**
- `checkout.session.completed` → set `subscriptionTier`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd`
- `customer.subscription.updated` → update tier if price changed, update period end
- `customer.subscription.deleted` → reset to `"free"`, clear Stripe fields
- `invoice.payment_failed` → send warning email via Resend

**Env vars needed:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CORE_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

### Step 5: Tier-Aware Briefing Cron

**File:** `app/api/cron/agents/route.ts`

Modify briefing generation loop:
- Read `frequency` query param (`weekly` or `monthly`)
- `weekly` → filter situations where creator has `premium` tier
- `monthly` → filter situations where creator has `core` OR `premium` tier
- Add `subscriptionTier` to the creator select

**File:** `vercel.json`

Add monthly cron:
```json
{
  "crons": [
    { "path": "/api/cron/agents", "schedule": "0 10 * * *" },
    { "path": "/api/cron/agents?briefing=true&frequency=weekly", "schedule": "0 14 * * 1" },
    { "path": "/api/cron/agents?briefing=true&frequency=monthly", "schedule": "0 14 1 * *" }
  ]
}
```

**File:** `lib/agents/runner.ts`

In email notification section (~line 180), add tier check:
- Only send alert emails to users with `core` or `premium` tier
- Add `subscriptionTier` to the situation creator query

### Step 6: Client-Side Tier Hook

**New file:** `lib/hooks/useSubscription.ts`

- Hook that fetches user's `subscriptionTier` from `/api/profile` on mount
- Exposes `{ tier, loading, canAccess(minTier) }`
- Modify `app/api/profile/route.ts` to include `subscriptionTier` in response

### Step 7: UI Gating Components

**New file:** `components/UpgradeGate.tsx`

- Wrapper component: if tier sufficient → render children, else → render upgrade prompt
- Props: `requiredTier`, `featureName`, `children`
- Upgrade prompt links to `/pricing`

**New file:** `components/UpgradePrompt.tsx`

- Styled card with feature name, tier required, CTA button
- Matches existing Harbor design (ocean color, rounded-xl, font-sans)

**Where to gate in existing UI:**

| Location | Gate | Behavior for free users |
|----------|------|------------------------|
| Dashboard briefing card (`app/dashboard/page.tsx`) | `core` | Show blurred preview + "Upgrade for monthly briefings" |
| Briefing page (`app/briefing/page.tsx`) | `core` | Full upgrade prompt |
| Monitoring page (`app/monitoring/page.tsx`) | `core` | Show agent list but blur detection details |
| "Add Parent" button in ParentSwitcher | `core` | Upgrade prompt when at maxParents=1 |
| Chat interface (`components/ChatInterface.tsx`) | free w/ limit | Show remaining count, upgrade prompt when exhausted |

### Step 8: Pricing & Account Pages

**New file:** `app/pricing/page.tsx`

- 3-column comparison table (Free / Core / Premium)
- Current plan highlighted
- "Upgrade" buttons call `POST /api/stripe/checkout` → redirect to Stripe Checkout
- Matches Harbor visual style

**New file:** `app/account/page.tsx`

- Current plan name and price
- Next billing date (from `stripeCurrentPeriodEnd`)
- "Manage Subscription" button → Stripe Customer Portal
- Link from user nav dropdown

---

## Phase 2: Premium Features (future, not in this implementation)

- **Benefits scanner agent** — new agent in `lib/agents/` checking state program eligibility
- **Family sharing** — invite flow using existing `SituationMember` model
- **Priority signal scoring** — enhanced prompt/model for premium users in `judgmentAgent.ts`
- **Insurance optimization** — annual review report
- **Document renewal reminders** — auto-create tasks when freshness hits "aging"

---

## Files Changed (Phase 1)

| File | Change |
|------|--------|
| `lib/config/tiers.ts` | **New** — tier definitions, feature flags, helpers |
| `prisma/schema.prisma` | Add Stripe fields to User model |
| `lib/supabase/auth.ts` | Add `requireTier()` guard function |
| `lib/stripe/client.ts` | **New** — Stripe SDK client |
| `app/api/stripe/checkout/route.ts` | **New** — create checkout session |
| `app/api/stripe/portal/route.ts` | **New** — create portal session |
| `app/api/stripe/webhook/route.ts` | **New** — handle Stripe events |
| `app/api/cron/agents/route.ts` | Tier-aware briefing generation, frequency param |
| `vercel.json` | Add monthly briefing cron |
| `lib/agents/runner.ts` | Tier check before sending alert emails |
| `app/api/generate-briefing/route.ts` | Add `requireTier("core")` |
| `lib/hooks/useSubscription.ts` | **New** — client-side tier hook |
| `components/UpgradeGate.tsx` | **New** — tier gating wrapper |
| `components/UpgradePrompt.tsx` | **New** — upgrade CTA component |
| `app/pricing/page.tsx` | **New** — pricing comparison page |
| `app/account/page.tsx` | **New** — subscription management page |
| `app/dashboard/page.tsx` | Add upgrade gates on briefing card |
| `app/briefing/page.tsx` | Add upgrade gate |
| `app/monitoring/page.tsx` | Add upgrade gate |
| `components/ChatInterface.tsx` | Free-tier conversation limit + upgrade prompt |
| `app/api/profile/route.ts` | Include `subscriptionTier` in response |

---

## Verification

1. `npx tsc --noEmit` passes
2. `npx prisma migrate dev` succeeds
3. **Free user:** full intake works, tasks generated, briefing page shows upgrade prompt, chat limited to 5/month
4. **Stripe checkout:** clicking "Upgrade to Core" redirects to Stripe, completing payment updates `subscriptionTier` to `"core"`
5. **Core user:** can generate monthly briefing, receives alert emails, unlimited chat
6. **Premium user:** receives weekly briefings via Monday cron
7. **Cancellation:** Stripe webhook resets tier to `"free"`, gated features show upgrade prompts again
8. **Existing users unaffected:** all current features (intake, forms, tasks, profile) remain accessible on free tier
