# Patholy: a marketplace for diagnostic labs

Patholy works like Swiggy or Zomato, but labs take the place of restaurants and tests take the place of dishes. Labs register and list their tests with prices. Patients compare prices across labs and book a home sample collection or a lab visit. An admin approves labs and watches the platform.

The product spec is in [docs/PRD.md](docs/PRD.md). The step-by-step guide for deploying on free services is in [docs/GO-LIVE.md](docs/GO-LIVE.md).

```
backend/    Node.js + Express 5 + MongoDB (Mongoose) REST API
frontend/   React 18 + Vite + Tailwind. One app with three areas:
            /            patient site (search, compare, cart, bookings, profile)
            /partner     lab partner dashboard (stats, bookings pipeline, tests & prices, patients, lab profile)
            /admin       admin console (platform stats, lab approvals, users, all bookings)
docs/       PRD
```

## Run locally

Requires Node 20 or later.

```bash
# 1. API: no MongoDB install needed. This starts an embedded DB and seeds demo data on first run.
cd backend
npm install
npm run dev:local          # http://localhost:5001

# 2. Web app (in a second terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173  (/api is proxied to :5001)
```

To use your own MongoDB (Atlas or local), set `MONGO_URI` in `backend/.env` (see `.env.example`), then run:

```bash
cd backend
npm run seed               # load demo data (add `-- --reset` to wipe first)
npm run dev
```

> macOS: port 5000 is used by AirPlay Receiver, so the API defaults to **5001**.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Patient | patient@patholy.in | Patient@123 |
| Lab partner | lab1@patholy.in (to lab6) | Lab@1234 |
| Admin | admin@patholy.in | Admin@123 |
| Collector (field staff) | collector1@patholy.in (to collector3) | Collector@123 |

`lab6` (Wellness Path Lab) starts as **pending**, so you can try the admin approval flow.

## Tests

```bash
cd backend  && npm test          # 51 API tests: auth, roles, bookings, coupons, payments, reports, collectors
cd frontend && npm run test:e2e  # 27 Playwright end-to-end tests
```

The Playwright suite starts its own API (fresh, seeded in-memory DB on port 5055) and Vite (port 5174), then drives the real UI. It covers:
- the patient journey: search, compare, cart, booking, cancel, profile;
- the lab and admin dashboards;
- a full cross-role flow: a new lab registers, the admin approves it, a patient books, the lab completes the booking, and the patient reviews.

The suite uses your installed Google Chrome. To use Playwright's own Chromium instead, run `npx playwright install chromium` and `PW_CHANNEL= npm run test:e2e`.

## Images

The photos in `frontend/src/assets/photos/` were AI-generated for this project. To swap a home-page banner image, edit `frontend/src/lib/banners.js`.
