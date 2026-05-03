# 🏠 Aasra — Hostel Management System

Aasra is a full-stack hostel management platform for Pakistan that connects students and hostel owners. Students can browse hostels, manage payments, file complaints, receive notices, and rate their experience. Owners get a complete dashboard to manage rooms, students, payments, complaints, and announcements.

---

## 📋 Prerequisites

Make sure the following are installed on your machine before you start:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | https://nodejs.org |
| **npm** | v9 or higher (comes with Node.js) | — |
| **Git** | Any recent version | https://git-scm.com |

To check if you already have them:
```bash
node -v
npm -v
git -v
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SubhanA-0/Aasra_HostelManagement.git
cd Aasra_HostelManagement
```

Or if you already have the folder, just open a terminal inside it.

---

### 2. Install Frontend Dependencies

In the **root** of the project folder, run:

```bash
npm install
```

This installs all React/Vite frontend packages.

---

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

This installs Express, SQLite, and all backend packages.

---

## ▶️ Running the Application

Aasra has **two servers** that must both be running at the same time:

### Terminal 1 — Start the Backend (API Server)

```bash
node backend/server.js
```

The backend will start on **http://localhost:5000**

You should see:
```
Server running on port 5000
Connected to the SQLite database.
```

> The SQLite database file (`backend/database.sqlite`) is created automatically on first run. No manual database setup is needed.

---

### Terminal 2 — Start the Frontend (React App)

Open a **second terminal** in the same project folder and run:

```bash
npx vite --port 8000
```

The frontend will be available at **http://localhost:8000**

---

## 🌐 Access the App

Once both servers are running, open your browser and go to:

```
http://localhost:8000
```

---

## 👤 Creating Accounts

On first run the database is empty. You can register accounts directly from the app:

1. Go to **http://localhost:8000/signup**
2. Sign up as an **Owner** first — create a hostel owner account
3. Sign up as a **Student** — create a student account
4. Log in as Owner → go to **Room Management** → add rooms
5. Log in as Owner → go to **Student Index** → assign a student to a room
6. The student can now use all features: payments, complaints, notices, reviews

---

## 📁 Project Structure

```
aasra-home-hub-main/
├── backend/                  # Express.js API server
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Login / Register
│   │   ├── rooms.js          # Room management
│   │   ├── students.js       # Student records
│   │   ├── payments.js       # Payment tracking
│   │   ├── complaints.js     # Complaint handling
│   │   ├── notices.js        # Notice board
│   │   ├── reviews.js        # Hostel ratings
│   │   ├── messages.js       # In-app messaging
│   │   └── stats.js          # Owner dashboard analytics
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── db.js                 # SQLite schema initialization
│   ├── server.js             # Express app entry point
│   └── database.sqlite       # Auto-generated SQLite database
│
├── src/                      # React + TypeScript frontend
│   ├── pages/                # All page components
│   ├── components/           # Shared UI components
│   ├── lib/
│   │   └── api.ts            # Axios client (points to localhost:5000)
│   └── App.tsx               # Router and route definitions
│
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

---

## 🔧 Configuration

| Setting | Value |
|---------|-------|
| Frontend URL | `http://localhost:8000` |
| Backend URL | `http://localhost:5000` |
| Database | SQLite (auto-created at `backend/database.sqlite`) |
| Auth | JWT tokens (stored in browser `localStorage`) |

No `.env` file is required for local development — all defaults are pre-configured.

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in each terminal window to stop the frontend and backend servers.

---

## ❓ Common Issues

| Problem | Fix |
|---------|-----|
| `node: command not found` | Install Node.js from https://nodejs.org |
| `Cannot find module 'express'` | Run `npm install` inside the `backend/` folder |
| `EADDRINUSE: port 5000` | Another process is using port 5000. Stop it or restart your computer |
| `EADDRINUSE: port 8000` | Change the frontend port: `npx vite --port 3000` (then update `src/lib/api.ts` if needed) |
| Blank page / API errors | Make sure **both** the backend AND frontend are running simultaneously |
| "Failed to load" errors | Ensure you are logged in — most pages require authentication |

---

## 👨‍💻 Built By

| Name | Role |
|------|------|
| **Subhan Ahmed** | Backend Engineer |
| **Zain Ibn e Abbas** | Frontend Engineer |
| **Dua Zainab** | Implementation Engineer |

---

*Aasra — Making student accommodation simple, transparent, and connected.*
