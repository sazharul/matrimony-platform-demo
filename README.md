# MatriConnect — Matrimony Platform Demo

A full-stack matrimonial platform demo built with **Laravel 12** and **Next.js 16**. Rebranded as **MatriConnect** for portfolio review.

> **Portfolio demonstration only.** This repository is an independent showcase for recruiters and engineers.
> It uses the same technologies and architectural patterns from my production work, but it is **not**
> the source code of any client, employer, or live product. Fictional branding and synthetic data only.
> See [DISCLAIMER.md](DISCLAIMER.md).
>
> Production experience reference: [mybouma.com](https://mybouma.com/) (code not published).

## Features

- Multi-step registration with email verification
- Rich matrimony profiles (religious, family, career, lifestyle, horoscope, preferences)
- Compatibility matching algorithm with daily match suggestions
- Profile search with advanced filters (public + authenticated)
- Interests, shortlist, block, report, and profile views
- Real-time chat with typing indicators (Laravel Reverb)
- WebRTC audio/video call UI (requires TURN server for production)
- Face scan verification (MediaPipe, browser-side)
- Subscription tiers (Free/Gold) with demo payment bypass
- In-app notifications
- Photo moderation and admin verification
- CMS-driven public pages (about, FAQ, terms, privacy)
- Admin panels (Next.js + Laravel Blade super-admin)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12, PHP 8.2+, MySQL 8 |
| Frontend | Next.js 16, React 19, TypeScript |
| Auth | Laravel Sanctum |
| Real-time | Laravel Reverb + Laravel Echo |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | Zustand, TanStack Query |
| Search | Laravel Scout (database driver) |

## Quick Start (Docker)

```bash
git clone https://github.com/sazharul/matrimony-platform-demo.git
cd matrimony-platform-demo
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Reverb (WebSocket) | ws://localhost:8080 |

### Demo Accounts

See [docs/DEMO_ACCOUNTS.md](docs/DEMO_ACCOUNTS.md) for login credentials.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@matriconnect.demo` | `DemoAdmin123!` |
| Member | (any seeded user) | `DemoUser123!` |

## Local Development (without Docker)

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

In separate terminals:

```bash
php artisan reverb:start
php artisan queue:work
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Demo Mode

Set `DEMO_MODE=true` in `backend/.env` to:

- Bypass SSLCommerz payment gateway
- Activate subscriptions instantly
- Use SVG placeholder avatars instead of Cloudflare Images
- Log emails instead of sending via SMTP

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design, data flow, and feature details.

## Project Structure

```
matrimony-platform-demo/
├── backend/          # Laravel 12 API + admin
├── frontend/         # Next.js 16 app
├── docs/             # Architecture + demo accounts
├── docker-compose.yml
└── README.md
```

## License

MIT — see [LICENSE](LICENSE).
