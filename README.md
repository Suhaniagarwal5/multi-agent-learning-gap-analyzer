# Sutra AI — AI-Powered Intelligent Programming Learning System

Sutra AI is an adaptive AI-powered platform designed to help users master programming logic in **C**, **Python**, and **Data Structures & Algorithms (DSA)**.  

It uses **Gemini AI** for personalized hints, real-time code analysis, and a unique mobile **"Lens"** feature for scanning handwritten notes or screens. The platform includes an interactive IDE, progress tracking, achievements, and intelligent fuzzy search for problems.

## About Sutra AI

Sutra AI addresses common challenges in coding education by providing:

- **Adaptive Learning** — Detects logic gaps and offers leveled hints (conceptual, diagrammatic, or optimization-based) without spoiling solutions.
- **Real-Time Collaboration** — Integrates mobile camera input (**Sutra Lens**) for OCR and visual analysis, synced via WebSockets to the desktop IDE.
- **Gamification** — Tracks user progress with dashboards, heatmaps, streaks, and badges to encourage consistent practice.
- **Search & Discovery** — Fuzzy search for problems using TheFuzz library, filtered by topics like DSA, C, or Python.
- **Authentication** — Secure login via Firebase with Google OAuth and email/password options.

This project was developed by **Rupali Goyal** and **Suhani Agarwal** as a collaborative effort to create an engaging, AI-driven coding trainer.

## Features

- **Course Selection & Topic Lists** — Browse courses (Python, DSA, C) with categorized problems (e.g., Linked Lists, Pointers)
- **Interactive IDE** — Monaco Editor with AI hint generation, code execution simulation, and real-time output
- **Sutra Lens** — Mobile camera integration for scanning code/notes, analyzed by Gemini Vision
- **Dashboard** — Visual analytics including radar charts (skill gaps), pie charts (difficulty distribution), activity heatmaps, and weekly trends
- **Achievements** — Unlock badges and track streaks, points, and global ranks
- **Real-Time Hints** — Socket.IO-powered instant feedback from mobile to desktop
- **Fuzzy Search** — AI-powered problem search using WRatio scoring
- **Authentication** — Firebase-based secure user sessions

## Tech Stack

### Frontend (React)

- React.js + React Router
- Tailwind CSS
- Framer Motion (animations)
- Monaco Editor (code editing)
- Recharts (radar, pie, area charts)
- Lucide React (icons)
- Socket.IO Client (real-time)
- Firebase Authentication (Google OAuth + email/password)

### Backend (Hybrid)

- **Node.js** (Express + Mongoose) → Problem storage & retrieval (MongoDB)
- **Python** (FastAPI + Socket.IO) → AI hints (Gemini), real-time sockets (Lens), fuzzy search (TheFuzz)
- **Google Gemini AI** → Text & vision-based hint generation
- Pillow, base64 → Image/frame handling

### Database

- **MongoDB** — Stores problems (seeded from `problems.json`)
- **Firebase** — User authentication

### Other Tools

- Vite (frontend build tool)
- Nodemon (Node.js dev server)
- Uvicorn (FastAPI server)
- QR code generation (Lens activation)

## Architecture Overview

- **Frontend** → React app handles UI/UX, connects to Node.js API (problems), Python API (AI/search), and Firebase (auth)
- **Node.js Backend** → Serves problem data from MongoDB (`/api/problems/course/:name`)
- **Python Backend** → FastAPI + Socket.IO for real-time events (`join_problem`, `lens_frame`), uses Gemini for hints
- **Mobile Lens** → Separate React route `/lens/:problemId` captures camera → sends base64 frames via sockets → Python backend → Gemini Vision
- **Data Flow** → Problems from JSON → MongoDB → Frontend → User code/hints → Gemini → Real-time sync (desktop IDE ↔ mobile Lens)

## Installation & Setup

### Prerequisites

- Node.js v18 or higher
- Python 3.10 or higher
- MongoDB (local or cloud)
- Firebase project (update `firebase.js`)
- Google Gemini API key (update `hints.py`)

### Backend Setup – Node.js

<pre>
# Go to Node.js server folder
cd server

# Install dependencies
npm install

# Create .env file
echo "PORT=5000" > .env
echo "MONGO_URI=mongodb://localhost:27017/sutra-ai" >> .env

</pre>

### Backend Setup – Python (AI + Sockets)
<pre>
# Navigate to the folder containing main.py, hints.py, requirements.txt
cd ai-backend    # ← change this if your folder has a different name

# Install dependencies
pip install -r requirements.txt

# IMPORTANT: Replace the placeholder API key
# Open hints.py and update this line:
# genai.configure(api_key="YOUR_ACTUAL_GEMINI_API_KEY_HERE")

# Start FastAPI + Socket.IO server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# → Runs on http://localhost:8000

# Start server
npm run dev
# Runs on http://localhost:5000
</pre>

### Full Local Setup Summary (Order Matters)
- Start MongoDB (make sure it's running)
- Start Node.js backendcd server && npm run dev
- Start Python backendcd ai-backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
- Start React frontendcd client && npm run dev
- Open browser → http://localhost:5173

### Important for Sutra Lens (mobile camera feature):

- In file client/src/pages/IDE.jsx, update:const laptopIP = "10.160.108.166" → replace with your laptop's current local IP
- Laptop and mobile phone must be on the same Wi-Fi network
- In the IDE, click the camera icon → scan the QR code with your phone
const laptopIP = "10.160.108.166" → replace with your laptop's current local IP
Laptop and mobile phone must be on the same Wi-Fi network
In the IDE, click the camera icon → scan the QR code with your phone

### Usage

- Login → /login (Google or email/password)
- Choose Course → /courses (Python, DSA, or C)
- Browse Problems → /course/:courseId
- Solve a Problem → /ide/:problemId
  - Write code in the editor
  - Request hints (level 1–3)
  - Use Lens (camera icon)

- Lens Mode → In IDE click camera icon → scan QR → allow camera on phone
- View Progress & Achievements → /dashboard and /achievements

### License
- MIT License
- See the LICENSE file for details.
  
### Acknowledgments

- Built with passion by Rupali Goyal and Suhani Agarwal
- Powered by Google Gemini, Firebase, and many great open-source tools
- Inspired by LeetCode, but with strong focus on AI-guided learning

### Happy coding! 🚀
