# Sutra AI — Intelligent Programming Learning System

> **AI-powered coding education that diagnoses *why* you're stuck, not just *what* the answer is.**

Built by **Rupali Goyal** and **Suhani Agarwal** · Minor Project, Semester 6

---

## The Problem

Most coding platforms — LeetCode, HackerRank, GeeksforGeeks — follow the same model: here's a problem, submit a solution, pass or fail. They tell you *what* went wrong but never *why* your thinking went wrong.

Students hit three recurring walls:

1. **The hint wall** — "I'm stuck but I don't want the answer." Most platforms give either nothing, or the full solution. There's no middle ground.
2. **The feedback gap** — You can stare at a wrong solution for hours. Nobody is telling you which part of your *logic* is broken, not just your syntax.
3. **The handwritten note problem** — Students think on paper. Diagrams, pseudocode, rough logic flows — none of that translates into existing tools. It gets ignored.

The result: students either give up, or learn to copy-paste without understanding. Neither builds an engineer.

---

## What Sutra AI Does Differently

Sutra AI is built around one principle: **teach the process, not just the answer.**

### 1. Leveled AI Hints — Guided Thinking, Not Spoilers
Instead of one generic hint, Sutra AI has a 4-level progressive hint engine powered by Gemini:

| Level | What You Get |
|-------|-------------|
| 1 | Conceptual nudge — "Think about which data structure gives O(1) access" |
| 2 | Mermaid diagram — visual representation of the optimal approach |
| 3 | Code analysis — AI reviews your current code and identifies the logical gap |
| 4 | Near-solution guidance — step-by-step breakdown without writing it for you |

You request hints. You control how much help you want. The system tracks how many hints you used per problem.

### 2. Sutra Lens — Your Handwritten Notes, Analyzed
Students think on paper. Sutra Lens bridges the physical and digital:

- Open the IDE on your laptop → click the camera icon → scan the QR code with your phone
- Your phone becomes a live camera feed
- Capture your handwritten diagram or pseudocode
- Gemini Vision analyzes it in real time and sends feedback directly to your IDE
- The hint appears in the output console and is read aloud via text-to-speech

This is a genuine problem no existing platform solves.

### 3. Voice Input — Think Out Loud
Click the microphone in the IDE and speak your thought process. The speech is transcribed and sent to Gemini as context for the hint. "I'm trying to use a min-heap but I don't know how to track the index" becomes the input — not just your code.

### 4. Progress Intelligence — Dashboard That Actually Means Something
Not just a "problems solved" counter. The dashboard computes:

- **Skill Radar** — maps your solved problems to 6 skill dimensions (Logic, Syntax, Optimization, Debug, Patterns, Analysis)
- **Consistency Heatmap** — GitHub-style activity grid
- **Difficulty Split** — where your comfort zone ends
- **Weekly Trends** — solved vs hints used over time (hints trending down = you're improving)
- **Global Leaderboard** — ranked by weighted points (Easy ×10, Medium ×20, Hard ×40)

### 5. Fuzzy Search — Find Problems by Intent
Type "reverse list" and get Linked List reversal problems. Type "sort without extra space" and get in-place sorting problems. Powered by TheFuzz (Levenshtein distance) on the Python backend.

---

## Architecture

Sutra AI runs three servers simultaneously, each with a clear responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│         Vite · Tailwind · Framer Motion · Monaco Editor     │
│         Recharts · Socket.IO Client · Firebase Auth         │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│   NODE.JS BACKEND    │    │        PYTHON BACKEND           │
│   Express · Mongoose │    │   FastAPI · Socket.IO · Gemini  │
│   Port 5000          │    │   Port 8000                     │
│                      │    │                                 │
│  /api/problems       │    │  POST /ai/hint  (text hints)    │
│  /api/progress       │    │  GET  /search   (fuzzy search)  │
│  /api/dashboard/:uid │    │  WS   /ws       (Lens frames)   │
└──────────┬───────────┘    └──────────────┬──────────────────┘
           │                               │
           ▼                               ▼
    ┌────────────┐                 ┌───────────────┐
    │  MongoDB   │                 │  Gemini API   │
    │  Problems  │                 │  Text + Vision│
    │  Progress  │                 └───────────────┘
    └────────────┘
           
           ▲
           │  Real-time Socket.IO
    ┌──────────────┐
    │ MOBILE LENS  │
    │ /lens/:id    │
    │ Camera →     │
    │ base64 frame │
    │ → Python →   │
    │ Gemini Vision│
    │ → IDE hint   │
    └──────────────┘
```

**Why two backends?** Node.js handles fast CRUD (MongoDB reads, progress writes). Python handles everything AI — Gemini has a Python-first SDK, Socket.IO async is cleaner in Python, and the ML ecosystem (PIL, TheFuzz) lives in Python. Splitting them means neither blocks the other.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast HMR, component-based UI |
| Styling | Tailwind CSS | Utility-first, consistent design system |
| Animations | Framer Motion | Physics-based, production-quality motion |
| Code Editor | Monaco Editor | Same engine as VS Code |
| Charts | Recharts | Composable, SVG-based analytics |
| Real-time | Socket.IO | WebSocket with fallback, room-based events |
| Auth | Firebase | Google OAuth + email/password, zero server load |
| Node Backend | Express + Mongoose | REST API for problems and progress |
| Database | MongoDB | Document model fits problem schema naturally |
| AI Backend | FastAPI + Uvicorn | Async Python, fast startup, OpenAPI docs free |
| AI Engine | Google Gemini 1.5 Pro | Text + Vision in one API, generous free tier |
| Fuzzy Search | TheFuzz (Levenshtein) | Intent-based search without a search engine |
| Mobile Bridge | PIL + base64 | Frame capture → image → Gemini Vision |

---

## Data Flow — End to End

### Normal Problem Flow
```
User opens /ide/:problemId
    → React fetches problem from Node (MongoDB)
    → User writes code in Monaco Editor
    → Clicks RUN → progress saved as "attempted" (POST /api/progress)
    → Clicks SUBMIT → progress saved as "solved" + solve time recorded
    → Dashboard /api/dashboard/:uid recomputes all stats in real time
```

### Lens Flow
```
User clicks camera icon in IDE
    → QR code generated with phone URL (/lens/:problemId)
    → User scans QR on phone → phone opens /lens route
    → Phone joins Socket.IO room (problemId)
    → Every 3 seconds: phone captures frame → base64 JPEG → socket.emit("lens_frame")
    → Python backend receives frame → PIL decode → Gemini Vision → hint text
    → socket.emit("lens_hint") to room → IDE receives → output console + text-to-speech
```

### Hint Flow
```
User clicks HINT (level 1-4) or speaks via microphone
    → POST /ai/hint { level, code, problem, description }
    → Python: selects prompt template by level
    → Gemini: generates response (concept / diagram / code review / near-solution)
    → Response → IDE output console + SpeechSynthesis.speak()
    → hintLevel increments → next click goes deeper
    → PATCH /api/progress/hint records hint usage
```

---

## Database Schema

### Problem (MongoDB)
```js
{
  topic:        String,   // "DSA" | "Python" | "C"
  problemId:    String,   // unique slug, e.g. "kth-largest"
  title:        String,
  description:  String,
  language:     String,
  category:     String,   // "Arrays" | "Linked Lists" etc.
  difficulty:   String,   // "Easy" | "Medium" | "Hard"
  inputFormat:  String,
  outputFormat: String,
  constraints:  [String],
  explanation:  String,
  starterCode:  String,
}
```

### UserProgress (MongoDB)
```js
{
  userId:           String,   // Firebase UID
  displayName:      String,
  problemId:        String,
  problemTitle:     String,
  topic:            String,
  category:         String,
  difficulty:       String,
  status:           String,   // "solved" | "attempted"
  solveTimeSeconds: Number,
  hintsUsed:        Number,
  lensUsed:         Boolean,
  voiceUsed:        Boolean,
  solvedAt:         Date,
  firstAttemptAt:   Date,
}
// Compound unique index: { userId, problemId }
// One document per user per problem — upsert on every attempt
```

---

## API Reference

### Node.js (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems` | All problems |
| GET | `/api/problems/course/:name` | Problems filtered by topic |
| POST | `/api/progress` | Save/update attempt (upsert) |
| PATCH | `/api/progress/hint` | Increment hint counter |
| GET | `/api/dashboard/:userId` | Full dashboard data for user |

### Python FastAPI (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/hint` | Generate leveled hint via Gemini |
| GET | `/search?query=&topic=` | Fuzzy search problems |
| WS | `/ws/socket.io` | Socket.IO — Lens frames + hint relay |

---

## Local Setup

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB running locally
- Firebase project (update `client/src/firebase.js`)
- Google Gemini API key

### 1. Clone & install

```bash
git clone https://github.com/your-username/multi-agent-learning-gap-analyzer.git
cd multi-agent-learning-gap-analyzer
```

```bash
# Node backend
cd server && npm install

# React frontend
cd ../client && npm install
```

```bash
# Python backend
cd ../ai-server
pip install -r requirements.txt
```

### 2. Environment variables

**`client/.env`**
```
VITE_NODE_URL=http://localhost:5000
VITE_AI_URL=http://localhost:8000
VITE_LENS_URL=http://localhost:5173
```

**`server/.env`**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/sutra-ai
```

**`ai-server/.env`**
```
GEMINI_API_KEY=your_key_here
```

### 3. Seed the database

```bash
cd server
node seed.js
# Clears and re-inserts all problems from problems.json
```

### 4. Start all three servers

Open three terminal tabs:

```bash
# Tab 1 — Node backend
cd server && npm run dev
# → http://localhost:5000

# Tab 2 — Python AI backend  
cd ai-server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# → http://localhost:8000

# Tab 3 — React frontend
cd client && npm run dev
# → http://localhost:5173
```

### 5. Sutra Lens (mobile camera)

For Lens to work, your laptop and phone must be on the **same Wi-Fi network**.

```bash
# Find your laptop's local IP
ipconfig        # Windows
ifconfig        # Mac/Linux
# Look for IPv4 address, e.g. 192.168.1.5
```

Update `client/.env`:
```
VITE_AI_URL=http://192.168.1.5:8000
VITE_LENS_URL=http://192.168.1.5:5173
```

Then in IDE → click camera icon → scan QR with phone → allow camera access.

---

## Project Structure

```
multi-agent-learning-gap-analyzer/
│
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Firebase auth state, Google + email login
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Auth page (Google OAuth + email)
│   │   │   ├── CourseSelect.jsx    # Course picker (DSA / Python / C)
│   │   │   ├── TopicList.jsx       # Category cards + problem list + fuzzy search
│   │   │   ├── IDE.jsx             # Monaco editor + hints + voice + Lens QR
│   │   │   ├── Lens.jsx            # Mobile camera page (socket frame sender)
│   │   │   ├── Dashboard.jsx       # Analytics — heatmap, radar, leaderboard
│   │   │   └── Achievements.jsx    # XP, badges, streaks
│   │   ├── firebase.js
│   │   └── main.jsx
│   └── .env                        # VITE_NODE_URL, VITE_AI_URL, VITE_LENS_URL
│
├── server/                         # Node.js + Express backend
│   ├── models/
│   │   ├── Problem.js              # MongoDB problem schema
│   │   └── UserProgress.js         # MongoDB progress schema (userId+problemId unique)
│   ├── index.js                    # All routes: problems, progress, dashboard
│   ├── seed.js                     # One-time DB seeder from problems.json
│   ├── problems.json               # 173 problems across DSA / Python / C
│   └── .env                        # PORT, MONGO_URI
│
└── ai-server/                      # Python FastAPI + Socket.IO
    ├── core/
    │   ├── hints.py                # Gemini prompt templates by level (1-4)
    │   ├── search.py               # TheFuzz fuzzy search engine
    │   └── rag_engine.py           # Placeholder — future LangChain RAG
    ├── main.py                     # FastAPI app + Socket.IO + all routes
    ├── requirements.txt
    └── .env                        # GEMINI_API_KEY
```

---

## Known Limitations & Roadmap

| Current Limitation | Planned Fix |
|-------------------|-------------|
| Code execution is simulated (no real judge) | Integrate Judge0 API for real test case evaluation |
| Achievements page uses mock data | Connect to UserProgress collection same as Dashboard |
| Gemini API key in hints.py | Move to ai-server/.env (in progress) |
| TopicList fetches all problems, filters client-side | Add `/api/problems/course/:name` filter at DB level |
| No code execution feedback loop | Judge0 result → re-fed into Gemini for targeted hint |
| rag_engine.py is a stub | LangChain + PDF ingestion for syllabus-aware hints |

---

## License

MIT License — see `LICENSE` for details.

---

## Acknowledgments

- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/), [Firebase](https://firebase.google.com/), [MongoDB](https://www.mongodb.com/)
- Editor by [Monaco](https://microsoft.github.io/monaco-editor/) · Charts by [Recharts](https://recharts.org/) · Motion by [Framer](https://www.framer.com/motion/)
- Inspired by LeetCode — built to fix what LeetCode doesn't do

---

*Sutra AI — because debugging your thinking matters more than debugging your code.*
