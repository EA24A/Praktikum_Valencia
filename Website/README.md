# Casa Fenicia – Website

Lebanese Bistro & Café website built with Next.js 15, PostgreSQL, Stripe, Resend.

## 🚀 Quick Start

### 1. Clone & install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in your values (database URL, Stripe keys, Resend API key, etc.)
```

### 3. Set up database
```bash
# Push schema to your PostgreSQL
npx prisma db push

# Seed with initial data (admin user, tables, time slots, sample menu)
npx prisma db seed
```

### 4. Run development server
```bash
npm run dev
```

### 5. Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Admin Panel

URL: `/admin`  
Default credentials (change after first login!):
- Email: `admin@casafenicia.com`
- Password: `casafenicia2024!`

---

## 🌍 Public Site

| Route | ES | EN |
|---|---|---|
| Home | `/es` | `/en` |
| Menu | `/es/menu` | `/en/menu` |
| Order | `/es/pedir` | `/en/pedir` |
| Reserve | `/es/reservar` | `/en/reservar` |
| About | `/es/nosotros` | `/en/nosotros` |
| Contact | `/es/contacto` | `/en/contacto` |

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender email (must be verified in Resend) |
| `ADMIN_EMAIL` | Admin email for notifications |
| `NEXT_PUBLIC_APP_URL` | Full app URL (e.g. https://casafenicia.com) |

---

## 🏗️ Architecture

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v5 (credentials provider)
- **Payments**: Stripe (pickup orders only)
- **Email**: Resend
- **i18n**: next-intl (ES/EN)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## 💳 Stripe Webhooks

1. Install Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`
3. In production, add the webhook endpoint in Stripe Dashboard: `https://casafenicia.com/api/webhooks/stripe`
   - Event: `checkout.session.completed`

---

## 🚀 Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all env variables in Vercel dashboard
4. Set custom domain: `casafenicia.com`
5. Run database migrations: `npx prisma db push`

---

## 🔥 Last-Hour Sale

Admin panel → **Última Hora**:
- Creates a daily sale
- Add items with discounted price + stock limit
- Sale activates automatically 1h before closing
- Orders cut off 10 min before closing
- Stock decrements per order in real-time
