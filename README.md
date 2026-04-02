# StudyTrackly — Study Tracker (Full Stack)

A study tracker inspired by modern study dashboards: dashboards, sessions, courses, terms, calendar views, and charts. **All data is stored in MongoDB Atlas** and scoped per user using **JWT authentication**. The **React + Vite + Tailwind** frontend talks to a **Node.js + Express + MongoDB** API.

## Project layout

```
athenify-clone/
├── backend/          # Express API + MongoDB Atlas + JWT
├── frontend/         # React + Vite + Tailwind + Recharts
├── README.md
└── athenify-clone-fullstack.zip   # optional archive (no node_modules/dist); run npm install in each folder
```

A ready-made archive **`athenify-clone-fullstack.zip`** in this folder contains the same `frontend` and `backend` trees (without `node_modules` or `dist` to keep the file small). Unzip, then follow **Quick start** in each subfolder.

## Prerequisites

- **Node.js** 20+ (includes `npm`)
- **npm** 10+
- A **MongoDB Atlas** connection string (or any MongoDB URI)

## Setup & run (VS Code)

### 1) Open project
- VS Code → **File → Open Folder…** → select `athenify-clone`

### 2) Backend env
Create `backend/.env`:

```bash
MONGO_URI="your-mongodb-atlas-uri"
JWT_SECRET="your-very-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
# Optional for deployment (comma-separated):
# CORS_ORIGIN="http://localhost:5173,https://your-frontend-domain.com"
```

### 3) Start backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:4000`  
Health check: `curl http://localhost:4000/api/health`

### 4) Start frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### 5) Create account / sign in
- Go to `http://localhost:5173/signup` to create an account (name, email, password)
- Then sign in at `http://localhost:5173/signin`

Your data is stored in MongoDB and will still be there after you close the app. Signing in with the same email shows the same profile/data.

## Quick start (CLI)

### 1. Backend (MongoDB + JWT)

```bash
cd backend
npm install
npm run dev
```

The API listens on **http://localhost:4000**. Health check: `curl http://localhost:4000/api/health`
Configure `backend/.env` before running (see above).

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server **proxies** `/api` to `http://localhost:4000`, so you do not need CORS configuration for local development.

### 3. Auth
- Sign up: `http://localhost:5173/signup`
- Sign in: `http://localhost:5173/signin`

## Production build

**Backend**

```bash
cd backend
npm run build
npm start
```

**Frontend**

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host. Set **`VITE_API_URL`** to your API origin if the frontend and API are on different hosts, for example:

```bash
VITE_API_URL=https://api.example.com npm run build
```

If the same origin serves both (e.g. reverse proxy), you can leave `VITE_API_URL` unset and proxy `/api` to the backend.

## Features (student workflow)

| Area | What you can do |
|------|------------------|
| **Term Config** | Create terms, set goals, activate a term, edit gold/silver/bronze counts, calendar feed placeholder |
| **Courses** | Add/remove courses (color tags for UI) for the active term |
| **Sessions** | Create sessions (date, time, break, course, activity, note); list and delete |
| **Dashboard** | Study totals, streak, course chart, weekday bars, pace summary |
| **Calendar** | Bar chart of recent days + table + day detail |
| **Data Room** | Add/remove resource links (name, URL, note) |
| **Trophies** | View medals and streak |
| **Settings** | Email, display name, trial date, academic level |

## API overview (REST)

- `POST /api/auth/signup` (name, email, password) → JWT token
- `POST /api/auth/signin` (email, password) → JWT token
- `GET/POST/PATCH/DELETE /api/terms` — terms; `GET /api/terms/active`; `POST /api/terms/:id/activate`
- `GET/POST/PATCH/DELETE /api/courses?termId=`
- `GET/POST/PATCH/DELETE /api/sessions?termId=`
- `GET /api/study-days?termId=` (calendar table rows with duration, goal, gap, share price, progress)
- `POST /api/study-days/adjust-goal` (adjust goal by +/- minutes)
- `GET/PATCH /api/settings` (profile + timer volume)
- `GET /api/stats/dashboard`
- `GET /api/stats/weekday-radar` (radar: weekdays)
- `GET /api/stats/time-buckets` (radar: time of day)
- `GET /api/stats/daily-stacked` (stacked bars: total study hours per day, by course)

All routes except `/api/health` and `/api/auth/*` require:
`Authorization: Bearer <token>`

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, Recharts, Lucide React, date-fns |
| Backend | Express, MongoDB Atlas (Mongoose), JWT, bcrypt, Zod |

## Legal

This is an **educational clone** for learning full-stack patterns. It is **not** affiliated with or endorsed by any third-party app.
