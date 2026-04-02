# StudyTrackly Clone — Study Tracker (Full Stack)

A local-first study tracker inspired by modern study dashboards: dashboards, sessions, courses, terms, calendar views, data room links, trophies/medals, and settings. **All data is stored in a SQLite database** on your machine via a small **Node.js + Express + Prisma** API. The **React + Vite + Tailwind** frontend talks to that API.

## Project layout

```
athenify-clone/
├── backend/          # Express API + Prisma + SQLite
├── frontend/         # React + Vite + Tailwind + Recharts
├── README.md
└── athenify-clone-fullstack.zip   # optional archive (no node_modules/dist); run npm install in each folder
```

A ready-made archive **`athenify-clone-fullstack.zip`** in this folder contains the same `frontend` and `backend` trees (without `node_modules` or `dist` to keep the file small). Unzip, then follow **Quick start** in each subfolder.

## Prerequisites

- **Node.js** 20+ (includes `npm`)
- **npm** 10+

## Setup in VS Code (recommended)
1. Open this folder in VS Code (File → Open Folder…).
2. In the VS Code terminal, run the backend in the `backend/` folder:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```
   The API runs at `http://localhost:4000`.
3. Open a second terminal in VS Code (Terminal → New Terminal), then run the frontend in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.
4. If the frontend can’t reach the API, verify the backend is still running and that ports `4000` and `5173` are free.

## Quick start

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

The API listens on **http://localhost:4000**. Health check: `curl http://localhost:4000/api/health`

- Database file: `backend/prisma/dev.db` (SQLite). Delete it and run `npx prisma db push` and `npx prisma db seed` again to reset demo data.
- Optional: edit `backend/.env` (`DATABASE_URL`).

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server **proxies** `/api` to `http://localhost:4000`, so you do not need CORS configuration for local development.

### 3. Optional profile screen

Visit **http://localhost:5173/login** to set display name and email (stored via `/api/settings`). The app defaults to the dashboard at `/dashboard`.

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

- `GET/POST/PATCH/DELETE /api/terms` — terms; `GET /api/terms/active`; `POST /api/terms/:id/activate`
- `GET/POST/PATCH/DELETE /api/courses?termId=`
- `GET/POST/PATCH/DELETE /api/sessions?termId=`
- `GET/POST/PATCH/DELETE /api/exams?termId=`
- `GET/POST/DELETE /api/data-room?termId=`
- `GET /api/study-days?termId=` (calendar table rows with duration, goal, gap, share price, progress)
- `POST /api/study-days/adjust-goal` (adjust goal by +/- minutes)
- `GET/PATCH /api/settings`
- `GET/POST/DELETE /api/activities`
- `GET /api/stats/dashboard`
- `GET /api/stats/weekday-radar` (radar: weekdays)
- `GET /api/stats/time-buckets` (radar: time of day)
- `GET /api/stats/daily-stacked` (stacked bars: total study hours per day, by course)

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, Recharts, Lucide React, date-fns |
| Backend | Express, Prisma ORM, SQLite, Zod (ready for validation extensions) |

## Legal

This is an **educational clone** for learning full-stack patterns. It is **not** affiliated with or endorsed by any third-party app.
