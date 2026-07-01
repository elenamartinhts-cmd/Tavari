# Tavari

Property management platform for room-rental landlords.

## Tech stack

- **Next.js 14** (App Router)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Tailwind CSS** + custom olive/cream palette
- **Lucide React** icons
- **date-fns**

## Setup

### 1. Install Node.js

Download the LTS version from https://nodejs.org and install it.
Verify: open a terminal and run `node -v` — you should see `v20.x.x` or higher.

### 2. Create a Supabase project

1. Go to https://supabase.com and sign up / log in
2. Click **New project**
3. Choose a name (e.g. `tavari`) and a strong database password
4. Select the region closest to you (e.g. West Europe)
5. Wait ~2 minutes for the project to provision

### 3. Run the database migrations

In your Supabase project, go to **SQL Editor** and run each file in order:

1. Paste and run `supabase/migrations/001_initial.sql`
2. Paste and run `supabase/migrations/002_contracts.sql`
3. Paste and run `supabase/migrations/004_security.sql` ← **required, hardens RLS + adds indexes**
4. Paste and run `supabase/migrations/005_sign_contract_rpc.sql`
5. Paste and run `supabase/migrations/006_tenant_signing.sql` ← **required, tenant signing + landlord-only flow**

### 4. Get your API keys

In Supabase, go to **Settings → API**:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Create `.env.local`

In the project root, copy `.env.local.example` to `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Install dependencies and run

```bash
cd C:\Users\marti\Documents\tavari
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to the login page.

### 7. Create your account

Click **Crear cuenta**, enter your email and password. Check your email for a confirmation link, click it, then log back in.

### 8. Load demo data (optional)

After logging in, copy your User ID from **Supabase → Authentication → Users**, then run in the SQL Editor:

```sql
select seed_demo_data('your-user-uuid-here');
```

This creates 3 properties, 14 rooms, 3 tenants, payments, and maintenance issues so you can explore the app immediately.

---

## Project structure

```
tavari/
├── app/
│   ├── (auth)/login/          Login & signup
│   ├── (dashboard)/
│   │   ├── dashboard/         Home panel
│   │   ├── properties/        Property list + detail + rooms
│   │   ├── tenants/           Tenant list + detail
│   │   ├── payments/          Monthly payment tracker
│   │   ├── maintenance/       Issue tracker
│   │   ├── contracts/         Contract generation + signing
│   │   └── analytics/         Portfolio analytics
│   ├── portal/[tenantId]/     Public tenant portal (no login)
│   └── api/
├── components/
│   ├── layout/                Sidebar navigation
│   ├── rooms/                 Room cards + dialogs
│   ├── properties/            Property dialogs
│   ├── tenants/               Tenant forms + portal link
│   ├── payments/              Payment management
│   ├── maintenance/           Issue management
│   ├── contracts/             Template editor + contract flow
│   ├── analytics/             Charts (pure SVG)
│   └── tenant-portal/         Public portal components
├── lib/
│   ├── supabase/              client.ts, server.ts, admin.ts
│   ├── types.ts               All TypeScript types
│   ├── utils.ts               cn, formatCurrency, formatDate
│   └── contract-variables.ts  Template variable substitution
└── supabase/migrations/       SQL migrations
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Stats, open issues, active tenants |
| Properties | `/properties` | Property grid; `/properties/[id]` room grid |
| Tenants | `/tenants` | Tenant table; `/tenants/[id]` full profile |
| Payments | `/payments` | Monthly view with nav, bulk generation, mark paid |
| Maintenance | `/maintenance` | Issue list; `/maintenance/[id]` detail + timeline |
| Contracts | `/contracts` | Template manager; contract generation + signing |
| Analytics | `/analytics` | Revenue chart, occupancy bars, payment health |
| Tenant portal | `/portal/[tenantId]` | Public — tenant submits issues, sees history |

## Tenant portal

Each tenant has a unique portal URL: `https://yourapp.com/portal/[tenantId]`

Share it from **Tenants → [tenant name] → Portal inquilino → Copiar enlace**.

Tenants can:
- See their room and property info
- Submit maintenance requests (creates issues in your dashboard)
- Track their open and resolved issues

No account needed for tenants.
