# Praktikum Valencia

Internship project for **Casa Fenicia** (Lebanese bistro & café) — two Next.js applications improved during the Valencia internship.

## Repository structure

```
Praktikum_Valencia/
├── Pos/        # Point-of-sale / staff operations app (Casa POS) + Admin
├── Website/    # Public restaurant website (Casa Fenicia)
└── README.md
```

| Folder | App | Purpose |
|--------|-----|---------|
| `Pos/` | Casa POS | In-house POS: orders, tables, employees, time tracking, cash register, reports, menu & admin |
| `Website/` | Casa Fenicia | Public multilingual site (ES/EN/AR), online ordering, reservations |

Both apps use **Next.js**, **PostgreSQL**, and **Prisma**.

---

## Pos (Casa POS)

Staff-facing app for day-to-day restaurant operations.

### Features
- Employee & admin roles
- POS ordering and table management
- Cash register open/close
- Time tracking
- Products, discounts, menu cards
- Reports

## Website (Casa Fenicia)

Public website and admin panel for the restaurant.

### Features
- Multilingual public pages (Spanish / English / Arabic)
- Menu, online pickup orders (Stripe), reservations
- Contact & about pages

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth (Auth.js) |
| Payments | Stripe (Website pickup orders) |
| Email | Resend (Website) |

---
