# StudyTrackly
### 🚀 Deployed Application: https://study-trackly.vercel.app

StudyTrackly is a full-stack study tracker for students. You sign in with Google, log study sessions against courses and academic terms, and see progress on a dashboard, calendar, and trophies page.

Your data lives in **MongoDB** (via Mongoose) and is private to your account. A **React** web app talks to a **Node.js + Express** API using a **JWT** after Google sign-in.

## Purpose

The goal is to make daily study visible and motivating:

- Record when you studied, for which course, and for how long
- Set a term (semester) with a daily time goal
- See totals, streaks, and charts instead of guessing how much work you have done
- Keep useful links (notes, Drive folders) in a Data Room
- Use a built-in SmartTimer for focus, then save the session

## Major features

| Area | What you can do |
| --- | --- |
| **Sign in** | Continue with Google. The first visit creates your account. |
| **Term Config** | Create terms, set start/end dates and a daily goal, activate one term, edit medal counts. |
| **Courses** | Add, edit, and remove subjects (with a color tag) for the active term. |
| **Sessions** | Log date, start/end time, break minutes, course, activity, and note. List and delete sessions. |
| **Dashboard** | Totals, streak, course breakdown, weekday and time-of-day charts. |
| **Calendar** | Recent-day bars, study-day table (duration, goal, gap, running “share price”), day detail, adjust a day’s goal. |
| **Data Room** | Save resource links (name, URL, note) for the active term. |
| **Trophies** | Medals and streak based on days you hit the daily goal. |
| **Settings** | Display name, email, timer volume, ringtone, academic level. |
| **SmartTimer** | Stopwatch or countdown from the header; optional fullscreen; ringtones are generated in the browser (no MP3 files). |

## Technologies

| Layer | What we use | Why |
| --- | --- | --- |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4 | Fast UI, dark dashboard layout |
| **Routing** | React Router 7 | Pages like `/dashboard`, `/sessions`, `/signin` |
| **Charts** | Recharts | Bars, stacked hours, radar-style summaries |
| **HTTP** | Axios | Calls `/api/...` with the JWT |
| **Backend** | Node.js (JavaScript ESM), Express | REST API |
| **Database** | MongoDB Atlas + Mongoose | Users, terms, courses, sessions, goals, links |
| **Auth** | Google OAuth 2.0 + JWT | Sign in with Google; later requests send `Authorization: Bearer <token>` |
| **Validation** | Zod | Checks env vars and request bodies |
| **Cache (optional)** | Redis via ioredis | Speeds up stats; app still works if Redis is off |

There is **no Prisma** and **no SQLite**. MongoDB + Mongoose is the only database.

## How the pieces fit together (simple architecture)

```
Browser (React app, port 5173)
    │  1. Click “Continue with Google”
    ▼
Express API (port 4000)
    │  2. Redirects to Google, then Google comes back to /api/auth/google/callback
    │  3. API finds or creates a User in MongoDB and issues a JWT
    ▼
Browser stores the JWT and user in localStorage
    │  4. Every later request: Authorization: Bearer <token>
    ▼
API middleware checks the JWT → attaches your user id
    │  5. Routes read/write MongoDB (and optionally Redis for stats)
    ▼
JSON back to the React pages (dashboard, sessions, calendar, …)
```

In local development, Vite **proxies** `/api` to `http://localhost:4000`, so the app can call `/api/...` without a separate frontend URL. Google’s callback still hits the backend URL in `GOOGLE_CALLBACK_URL` (usually `http://localhost:4000/api/auth/google/callback`).

## Project layout

```
StudyTrakcly/
├── backend/                 # Express API
│   ├── src/
│   │   ├── index.js         # Starts the server, mounts routes
│   │   ├── lib/             # DB, Redis, dates, cache, env
│   │   ├── middleware/      # JWT auth, errors
│   │   ├── models/          # Mongoose schemas
│   │   └── routes/          # REST endpoints
│   ├── .env.example
│   └── package.json
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── pages/           # Dashboard, Sessions, Calendar, …
│   │   ├── components/      # Sidebar, Header, SmartTimer, charts
│   │   ├── layouts/         # Shell around logged-in pages
│   │   └── lib/             # api, auth, chime, formatting
│   └── package.json
├── README.md                # This file
└── PROJECT_DETAILS.md       # Architecture in more depth
```

## Prerequisites

- **Node.js** 20+ (includes npm)
- A **MongoDB** connection string (Atlas or local)
- **Google Cloud** OAuth client (Web application) for sign-in
- **Redis** is optional (`REDIS_URL`); leave empty to skip caching

## Setup and run

### 1. Backend environment

Copy `backend/.env.example` to `backend/.env` and fill in at least:

```bash
MONGO_URI="your-mongodb-uri"
JWT_SECRET="a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000

GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"

# Optional
# CORS_ORIGIN="http://localhost:5173"
# REDIS_URL="redis://127.0.0.1:6379"
```

**Google Cloud (once):** Credentials → OAuth client ID → **Web application**. Add **Authorized redirect URIs** exactly matching `GOOGLE_CALLBACK_URL` (localhost and 127.0.0.1 are different). If the app is in Testing, add your Google account as a test user.

On startup the API prints the redirect URI it will send to Google. Copy that string into Google Cloud if you see `redirect_uri_mismatch`.

### 2. Start the API (terminal 1)

```bash
cd backend
npm install
npm run dev
```

- API: [http://localhost:4000](http://localhost:4000)
- Health: `curl http://localhost:4000/api/health`

### 3. Start the web app (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to **Sign in**, and choose **Continue with Google**.

## Production

**API** (JavaScript source, no compile step):

```bash
cd backend
npm start
```

**Web app:**

```bash
cd frontend
npm run build
```

Serve `frontend/dist`. If the UI and API are on different hosts, build with `VITE_API_URL` set to the API origin. If one domain proxies `/api` to the backend, you can leave `VITE_API_URL` unset.

Also set production `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, and `CORS_ORIGIN` as needed.

## API overview

Except `/api/health` and `/api/auth/*`, send:

`Authorization: Bearer <token>`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness; shows if Redis is on |
| GET | `/api/auth/google` | Start Google sign-in |
| GET | `/api/auth/google/callback` | Finish sign-in, redirect to the app with a token |
| GET/POST/PATCH/DELETE | `/api/terms` | Terms; also `/active` and `/:id/activate` |
| GET/POST/PATCH/DELETE | `/api/courses` | Courses (`?termId=`) |
| GET/POST/PATCH/DELETE | `/api/sessions` | Study sessions |
| GET | `/api/study-days` | Calendar rows (duration, goal, gap, share price) |
| POST | `/api/study-days/adjust-goal` | Change one day’s goal by minutes |
| GET/PATCH | `/api/settings` | Profile and timer preferences |
| GET | `/api/stats/dashboard` | Dashboard totals and streak |
| GET | `/api/stats/weekday-radar` | Hours by weekday |
| GET | `/api/stats/time-buckets` | Hours by time of day |
| GET | `/api/stats/daily-stacked` | Hours per day by course |
| GET/POST/DELETE | `/api/data-room` | Resource links |

## More detail

See [PROJECT_DETAILS.md](PROJECT_DETAILS.md) for a beginner-friendly walkthrough of architecture, data models, auth, caching, and charts.
