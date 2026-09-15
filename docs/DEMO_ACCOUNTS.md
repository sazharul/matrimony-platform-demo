# Demo Accounts

Use these credentials after running `docker compose up` or local `php artisan migrate --seed`.

## Admin

| Field | Value |
|-------|-------|
| Email | `admin@matriconnect.demo` |
| Password | `DemoAdmin123!` |
| Panel | Next.js admin at `/admin` or Laravel super-admin at `/super-admin/login` |

## Seeded Members

30 demo users are created with Faker-generated names and emails. All use password:

```
DemoUser123!
```

> All 30 seeded member accounts use the same password: `DemoUser123!`

## Demo Mode Features

When `DEMO_MODE=true` (default in `.env.example`):

- **Subscriptions** — Gold/Platinum plans activate instantly without SSLCommerz
- **Payments** — Redirects to `/subscription/success` instead of payment gateway
- **Photos** — SVG placeholder avatars served from `/avatars/`
- **Email** — Uses `log` mail driver (no real emails sent)

## Quick Test Flow

1. Register a new account at `http://localhost:3000/register`
2. Complete your profile at `/profile/edit`
3. Browse matches at `/matches` or search at `/member/search`
4. Send an interest to another profile
5. Try upgrading to Gold at `/subscription` (demo mode — no real payment)
