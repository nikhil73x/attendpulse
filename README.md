# AttendPulse ⚡
> Production-Ready Smart Attendance Management & Academic Analytics System

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue?logo=postgresql)](https://www.postgresql.org/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com/)

---

## ✨ System Architecture

AttendPulse is a full-stack, enterprise-grade academic attendance engine with strict role-based authorization, tamper-prevention audit logging, and dual-mode database support (Atomic Persistent File Storage or Managed PostgreSQL).

- **🎓 Dual Portals:** Role-segregated Student and Faculty dashboards.
- **🛡️ Tamper-Prevention Security:** Course instructor validation enforcing **403 Security Audit Violation** on unauthorized attendance alteration attempts.
- **💾 Dual Database Engine:**
  - **Default Zero-Config:** Atomic, transaction-safe JSON file store with automatic recovery.
  - **Production Relational:** Full PostgreSQL schema (`database/schema.sql` + `database/seed.sql`) ready for Render, Railway, Supabase, or Neon.
- **📄 Bulk Operations:** CSV import and export for student rosters, weekly schedules, and roll-call session audit logs.
- **🌐 Cloud-Ready:** Built-in CORS whitelist, `/health` probes, and process binding (`0.0.0.0:$PORT`).

---

## 🛠️ Tech Stack

- **Backend:** Express.js v5 + TypeScript + tsx
- **Database:** PostgreSQL (with `pg` driver) / Atomic File Persistence (`server/data/store.ts`)
- **Frontend:** React 18 + Vite 6 + Tailwind CSS + Framer Motion
- **Deployment Targets:** Render, Railway, Vercel, Docker

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev:all
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health`

### 3. Demo Credentials
| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `nikhil.yadav@student.edu` | `student123` | View attendance, goals, timetable, bunk calculator |
| **Faculty (HOD)** | `prof.yadav@school.edu` | `faculty123` | Mark roll-call, edit assigned courses, export CSV |
| **Faculty** | `prof.sharma@school.edu` | `teacher123` | Instructs CS301 (Computer Networks) |

---

## 📦 Production Deployment

### Option A: Deploy Backend to Render (Recommended)
1. Fork or push this repository to your GitHub account.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository:
   - Render reads `render.yaml` automatically.
   - It automatically provisions the web service and a free PostgreSQL database.
4. Set your environment variables:
   - `FRONTEND_URL`: Your deployed frontend URL (e.g. `https://attendpulse.vercel.app`).
5. Run the database migration script once:
   ```bash
   npm run db:migrate
   ```

### Option B: Deploy Backend to Railway
1. In [Railway Dashboard](https://railway.app/), click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Add a **PostgreSQL** service to the project. Railway will automatically inject `DATABASE_URL`.
3. Set service settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set Environment Variables:
   - `PORT`: (Auto-provided by Railway)
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`
5. Test the health check at: `https://<railway-domain>/health`.

---

## 🔧 Environment Variables Reference

See `.env.example` for details.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `5000` | Port for the HTTP server to listen on. |
| `NODE_ENV` | No | `development` | Environment mode (`production` or `development`). |
| `FRONTEND_URL` | Recommended | `*` | Allowed CORS origins (comma-separated for multiple domains). |
| `DATABASE_URL` | Optional | `none` | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`). |
| `DATABASE_PATH` | Optional | `./server/data/database.json` | Custom storage location for the file-based database store. |
| `DATA_DIR` | Optional | `none` | Directory for persistent database storage mounts. |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` & `/api/health` | Service health status and database engine probe |
| `POST` | `/api/auth/login` | User authentication & role token generation |
| `GET` | `/api/auth/me` | Fetch active user profile |
| `GET` | `/api/subjects` | List subjects (supports `?teacher=` filter) |
| `POST` | `/api/attendance/check-permission` | Tamper Prevention course authorization gatekeeper |
| `POST` | `/api/attendance/session` | Record attendance roll-call session (strictly authorized) |
| `GET` | `/api/attendance/history` | Historical roll-call records |
| `GET` | `/api/students` | Class roster records |
| `POST` | `/api/students/bulk-import` | CSV/JSON batch student roster import |
| `GET` | `/api/timetable` | Weekly schedule slots |
| `POST` | `/api/timetable/bulk-import` | CSV/JSON batch schedule import |
