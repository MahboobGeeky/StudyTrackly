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

A ready-made archive `**athenify-clone-fullstack.zip**` in this folder contains the same `frontend` and `backend` trees (without `node_modules` or `dist` to keep the file small). Unzip, then follow **Quick start** in each subfolder.

## Prerequisites

- **Node.js** 20+ (includes `npm`)
- **npm** 10+
- A **MongoDB Atlas** connection string (or any MongoDB URI)

## Setup & run (VS Code)

### 1) Open project

- VS Code → **File → Open Folder…** → select `athenify-clone`

### 2) Backend env

Create `backend/.env` (see `backend/.env.example`). You need **MongoDB**, **JWT**, and **Google OAuth** credentials.

**Google Cloud Console** (one-time):

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID** → Application type **Web application**.
2. **Authorized redirect URIs**: add exactly
  `http://localhost:4000/api/auth/google/callback`  
   For production, add your deployed API callback URL the same way (e.g. `https://api.yourdomain.com/api/auth/google/callback`).
3. Copy **Client ID** and **Client secret** into `backend/.env` (same pair from the **Web application** client — not Android/iOS/Desktop).
4. **OAuth consent screen**: configure it once (APIs & Services → OAuth consent screen). If the app is in **Testing**, add your Google account under **Test users**.

**If you see `invalid_client` or “OAuth client was not found”:** the Client ID or Client secret in `.env` does not match Google Cloud, or the credential type is not **Web application**. Remove stray spaces; restart the backend after editing `.env`. The **Authorized redirect URI** must match `GOOGLE_CALLBACK_URL` exactly (no trailing slash unless you registered it that way).

**If you see `redirect_uri_mismatch` (Error 400):** Google’s list of **Authorized redirect URIs** does not include the exact URL your API sends. On backend startup, the console prints: `Google OAuth redirect URI (must match Google Cloud exactly): …` — copy that string into Google Cloud → **Credentials** → your **Web client** → **Authorized redirect URIs** → Save. Use `http://localhost:4000/...` vs `http://127.0.0.1:4000/...` consistently (they count as different). Do not rely on “Authorized JavaScript origins” alone; you must add the **redirect URI** list entry.

```bash
MONGO_URI="your-mongodb-atlas-uri"
JWT_SECRET="your-very-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000

GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"

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

### 5) Sign in with Google

- Open `http://localhost:5173/signin` and choose **Continue with Google**.
- The first sign-in creates your account; later sign-ins use the same Google account and the same data in MongoDB.

## Quick start (CLI)

### 1. Backend (MongoDB + JWT)

```bash
cd backend
npm install
npm run dev
```

The API listens on **[http://localhost:4000](http://localhost:4000)**. Health check: `curl http://localhost:4000/api/health`
Configure `backend/.env` before running (see above).

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**. The Vite dev server **proxies** `/api` to `http://localhost:4000`, so the “Continue with Google” link can use a relative `/api/auth/google` URL in development. **Google’s redirect** always hits the backend directly on port **4000** (`GOOGLE_CALLBACK_URL`), so that URI must match what you configured in Google Cloud Console.

### 3. Auth

- Sign in: `http://localhost:5173/signin` (Google OAuth). `/signup` redirects to `/signin`.

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

Serve the `frontend/dist` folder with any static host. Set `**VITE_API_URL**` to your API origin if the frontend and API are on different hosts, for example:

```bash
VITE_API_URL=https://api.example.com npm run build
```

If the same origin serves both (e.g. reverse proxy), you can leave `VITE_API_URL` unset and proxy `/api` to the backend.

## Deployment Checklist
1. **Backend secrets**
   - Create `backend/.env` from `backend/.env.example`
   - Set `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, and `GOOGLE_CALLBACK_URL`
   - If you ever committed real secrets to git, rotate them immediately (Google OAuth + Mongo credentials)
2. **Google OAuth**
   - In Google Cloud Console, add your exact redirect URI(s):
     - production: `https://<your-api-domain>/api/auth/google/callback`
     - development: `http://localhost:4000/api/auth/google/callback`
   - Reload/restart the backend after updating `backend/.env`
3. **CORS**
   - If frontend and backend are on different domains, set `CORS_ORIGIN` (comma-separated) in `backend/.env`
4. **Frontend API URL**
   - If frontend and backend are on different hosts, set `VITE_API_URL=https://<your-api-domain>` while building the frontend
   - If you use a reverse proxy under the same domain, proxy `/api` to the backend and leave `VITE_API_URL` unset
5. **Build + start**
   - Backend: `npm run build` then `npm start`
   - Frontend: `npm run build` then serve `frontend/dist` with a static host

### Production Smoke Tests
- `GET /api/health` returns `{ "ok": true }` without auth
- Browser: open `/signin`, complete Google sign-in, verify the dashboard loads
- Browser: open SmartTimer, start a countdown, confirm the selected ringtone plays when time ends
- Browser: open Calendar and confirm the Study days table renders correctly

## Features (student workflow)


| Area            | What you can do                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **Term Config** | Create terms, set goals, activate a term, edit gold/silver/bronze counts, calendar feed placeholder |
| **Courses**     | Add/remove courses (color tags for UI) for the active term                                          |
| **Sessions**    | Create sessions (date, time, break, course, activity, note); list and delete                        |
| **Dashboard**   | Study totals, streak, course chart, weekday bars, pace summary                                      |
| **Calendar**    | Bar chart of recent days + table + day detail                                                       |
| **Data Room**   | Add/remove resource links (name, URL, note)                                                         |
| **Trophies**    | View medals and streak                                                                              |
| **Settings**    | Email, display name, trial date, academic level                                                     |


## API overview (REST)

- `GET /api/auth/google` — redirect to Google; then `GET /api/auth/google/callback` issues JWT and redirects the browser to `FRONTEND_URL/auth/callback#token=…&user=…`
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

All routes except `/api/health` and `/api/auth/`* require:
`Authorization: Bearer <token>`

## Tech stack


| Layer    | Stack                                                                              |
| -------- | ---------------------------------------------------------------------------------- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, Recharts, Lucide React, date-fns |
| Backend  | Express, MongoDB Atlas (Mongoose), JWT, bcrypt, Zod                                |


## Legal

This is an **educational clone** for learning full-stack patterns. It is **not** affiliated with or endorsed by any third-party app.