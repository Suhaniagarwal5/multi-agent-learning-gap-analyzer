<div align="center">

<img src="https://img.shields.io/badge/Sutra%20AI-Intelligent%20Learning-6366f1?style=for-the-badge&logoColor=white" alt="Sutra AI"/>

# Sutra AI

### AI-powered coding education that diagnoses *why* you're stuck — not just *what* the answer is.

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

*Built by **Rupali Goyal** and **Suhani Agarwal** · Minor Project, Semester 6*

</div>

---

## The Problem

Most coding platforms — LeetCode, HackerRank, GeeksforGeeks — follow the same model: here's a problem, submit a solution, pass or fail. They tell you *what* went wrong but never *why* your thinking went wrong.

Students hit three recurring walls:

**The hint wall** — "I'm stuck but I don't want the answer." Most platforms offer either nothing, or the full solution. There is no middle ground.

**The feedback gap** — You can stare at a wrong solution for hours with no indication of *which part of your logic* is broken — not just your syntax.

**The handwritten note problem** — Students think on paper. Diagrams, pseudocode, rough logic flows — none of that translates into existing tools. It gets ignored.

The result: students either give up, or learn to copy-paste without understanding. Neither builds an engineer.

---

## What Sutra AI Does Differently

Sutra AI is built around one principle: **teach the process, not just the answer.**

### 1. Leveled AI Hints — Guided Thinking, Not Spoilers

Instead of a single generic hint, Sutra AI offers a **4-level progressive hint engine** powered by Gemini. Each level reveals slightly more information — you decide how much help you want.

| Level | What You Get | Example |
|-------|-------------|---------|
| **1** | Conceptual nudge — points you toward the right approach without revealing it | *"Think about which data structure gives O(1) lookup time"* |
| **2** | Visual diagram — a [Mermaid](https://mermaid.js.org/) flowchart of the optimal algorithm | Step-by-step flow rendered as a graph |
| **3** | Code analysis — AI reviews your current code and identifies the exact logical gap | *"Your loop exits before processing the last element"* |
| **4** | Near-solution guidance — a step-by-step breakdown of the approach, without writing the code for you | Full strategy walkthrough |

The system tracks how many hints you used per problem and reflects this on your dashboard — so you can see yourself improving over time as hint usage trends down.

---

### 2. Sutra Lens — Analyze Your Handwritten Notes in Real Time

> Students think on paper. Sutra Lens bridges the physical and digital.

Most coding tools ignore the whiteboard phase entirely. Sutra Lens doesn't.

**How it works:**
1. Open the IDE on your laptop → click the **camera icon** → a QR code appears
2. Scan the QR code with your phone
3. Your phone becomes a live camera pointed at your paper
4. Every 3 seconds, a frame is captured and sent to **Gemini Vision** (Google's multimodal AI model that understands both images and text)
5. Gemini analyzes your handwritten diagram or pseudocode and generates targeted feedback
6. The hint appears in your IDE's output console and is read aloud via text-to-speech

No other coding platform does this.

---

### 3. Voice Input — Think Out Loud

Click the microphone in the IDE and speak your reasoning. Your speech is transcribed and sent to Gemini as context alongside your code.

Instead of Gemini seeing only broken code, it hears: *"I'm trying to use a min-heap but I don't know how to track the index."* That context produces dramatically better, more targeted hints.

---

### 4. Progress Intelligence — A Dashboard That Actually Means Something

Not just a "problems solved" counter. The dashboard tracks how you're actually developing as a programmer.

| Metric | What It Shows |
|--------|--------------|
| **Skill Radar** | Your solved problems mapped across 6 dimensions: Logic, Syntax, Optimization, Debug, Patterns, Analysis |
| **Consistency Heatmap** | GitHub-style activity grid showing your daily coding streak |
| **Difficulty Split** | Breakdown of Easy / Medium / Hard problems — shows where your comfort zone ends |
| **Weekly Trends** | Problems solved vs. hints used over time. Hints trending down = you're improving |
| **Global Leaderboard** | Ranked by weighted score: Easy ×10 · Medium ×20 · Hard ×40 |

---

### 5. Fuzzy Search — Find Problems by Intent, Not Exact Title

Standard search requires you to know exactly what you're looking for. Fuzzy search doesn't.

Type `"reverse list"` → get Linked List reversal problems.  
Type `"sort without extra space"` → get in-place sorting problems.

**How it works:** The backend uses [TheFuzz](https://github.com/seatgeek/thefuzz), a Python library that computes **Levenshtein distance** — a measure of how many character edits separate two strings — between your query and every problem title/description. Results are ranked by similarity score, so even typos and partial phrases return relevant problems. There is no search index or external search engine involved; it runs entirely on the problem data already in MongoDB.

---

### 6. RAG-Powered AI Tutor — Answers Grounded in Your Syllabus

Sutra AI includes a **Retrieval-Augmented Generation (RAG)** tutor backed by real textbooks. Rather than generating answers purely from Gemini's general training data, it first retrieves relevant passages from your course's actual PDFs before composing a response.

**How it works:**
1. Textbooks for each course are stored in `ai-server/data/books/`
2. At startup, they are chunked and embedded into a **FAISS vector index** — a high-speed similarity search library from Meta. Each chunk becomes a numerical vector; similar chunks end up close together in vector space
3. When you ask the AI Tutor a question, the question is also embedded and the FAISS index finds the most relevant textbook passages
4. Those passages are injected into the Gemini prompt as grounding context
5. Gemini answers using both its general knowledge and the retrieved textbook content — keeping explanations aligned with your syllabus, not just generic internet answers

| Course | Books Indexed |
|--------|--------------|
| DSA | Algorithms (Jeff Erickson) · ODS Python |
| Python | Byte of Python · Think Python 2 |
| C | Essential C · Modern C |

---

### 7. Plagiarism Detection — Academic Integrity Built In

`plagiarism.py` in the AI backend analyzes submitted code for structural similarity against a reference corpus. The engine goes beyond simple string matching — it compares code at a syntactic level so that variable renaming and whitespace changes do not evade detection. Results are surfaced through the `PlagReport` page in the frontend, accessible to instructors reviewing submissions.

---

### 8. Smart Rating System — Scores That Reflect Real Understanding

A weighted rating engine (`server/utils/ratingEngine.js`) computes each user's score using multiple signals: problem difficulty, hints used, solve time, and whether AI assistance was involved. Ratings are stored in the `UserRating` collection and drive the global leaderboard — so the score reflects genuine problem-solving ability, not just how many problems were submitted.

---

## Architecture

Sutra AI runs three servers simultaneously, each with a distinct responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│         Vite · Tailwind · Framer Motion · Monaco Editor     │
│         Recharts · Socket.IO Client · Firebase Auth         │
└──────────────┬──────────────────────────┬───────────────────┘
               │ REST (problems/progress) │ REST (hints/search)
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│   NODE.JS BACKEND    │    │        PYTHON BACKEND           │
│   Express · Mongoose │    │   FastAPI · Socket.IO · Gemini  │
│   Port 5000          │    │   Port 8000                     │
│                      │    │                                 │
│  /api/problems       │    │  POST /ai/hint  (leveled hints) │
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
           │  Real-time Socket.IO (WebSocket)
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

**Why two backends?**

Node.js handles fast database operations (MongoDB reads and progress writes). Python handles everything AI-related — Google's Gemini SDK is Python-first, asynchronous Socket.IO is cleaner in Python, and the computer vision/ML ecosystem (`PIL`, `TheFuzz`) lives in Python. Keeping them separate means neither service blocks the other under load.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast hot-reload, component-based UI |
| Styling | Tailwind CSS | Utility-first, consistent design system |
| Animations | Framer Motion | Physics-based, production-quality transitions |
| Code Editor | Monaco Editor | Same engine as VS Code — full language support |
| Charts | Recharts | Composable, SVG-based analytics |
| Real-time | Socket.IO | WebSocket with automatic fallback, room-based events |
| Auth | Firebase | Google OAuth + email/password, zero server load |
| Node Backend | Express + Mongoose | REST API for problems and progress tracking |
| Database | MongoDB | Document model fits the problem schema naturally |
| AI Backend | FastAPI + Uvicorn | Async Python, fast startup, auto-generates API docs |
| AI Engine | Google Gemini 1.5 Pro | Handles both text and image input in one API |
| RAG Engine | LangChain + FAISS | Retrieves relevant textbook passages before prompting Gemini |
| Vector Store | FAISS (Facebook AI) | Millisecond nearest-neighbour search over embedded PDF chunks |
| Rating Engine | Custom (Node.js) | Weighted scoring across difficulty, hints, solve time, AI usage |
| Fuzzy Search | TheFuzz (Levenshtein) | Intent-based search without a dedicated search engine |
| Mobile Bridge | PIL + base64 | JPEG frame capture → Gemini Vision input |

---

## Data Flow — End to End

### Normal Problem Flow

```
User opens /ide/:problemId
  → React fetches problem from Node.js (MongoDB)
  → User writes code in Monaco Editor
  → Clicks RUN  → progress saved as "attempted"  (POST /api/progress)
  → Clicks SUBMIT → progress saved as "solved" + solve time recorded
  → Dashboard /api/dashboard/:uid recomputes all stats
```

### Sutra Lens Flow

```
User clicks camera icon in IDE
  → QR code generated linking to /lens/:problemId on the local network
  → User scans QR → phone opens /lens route
  → Phone joins Socket.IO room (keyed by problemId)
  → Every 3 seconds:
      phone captures frame
      → encodes as base64 JPEG
      → socket.emit("lens_frame")
      → Python backend decodes with PIL
      → sends image to Gemini Vision
      → receives hint text
      → socket.emit("lens_hint") to room
      → IDE receives → output console + text-to-speech
```

### Hint Flow

```
User clicks HINT (level 1–4) or speaks via microphone
  → POST /ai/hint { level, code, problem, description }
  → Python selects prompt template for the requested level
  → Gemini generates: concept nudge / diagram / code review / near-solution
  → Response → IDE output console + SpeechSynthesis.speak()
  → hintLevel increments (next click goes one level deeper)
  → PATCH /api/progress/hint records hint usage for the dashboard
```

---

## Database Schema

### Problem

```js
{
  topic:        String,   // "DSA" | "Python" | "C"
  problemId:    String,   // unique slug, e.g. "kth-largest"
  title:        String,
  description:  String,
  language:     String,
  category:     String,   // "Arrays" | "Linked Lists" | "Trees" etc.
  difficulty:   String,   // "Easy" | "Medium" | "Hard"
  inputFormat:  String,
  outputFormat: String,
  constraints:  [String],
  explanation:  String,
  starterCode:  String,
}
```

### UserProgress

```js
{
  userId:           String,   // Firebase UID — links to the authenticated user
  displayName:      String,
  problemId:        String,
  problemTitle:     String,
  topic:            String,
  category:         String,
  difficulty:       String,
  status:           String,   // "solved" | "attempted"
  solveTimeSeconds: Number,   // wall-clock time from first attempt to submission
  hintsUsed:        Number,   // total hint requests across all 4 levels
  lensUsed:         Boolean,  // whether the camera feature was used
  voiceUsed:        Boolean,  // whether voice input was used
  solvedAt:         Date,
  firstAttemptAt:   Date,
}

// Compound unique index: { userId, problemId }
// One document per user per problem — upserted on every attempt
// This prevents duplicate records if the user revisits a problem
```

---

## API Reference

### Node.js — Port 5000

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems` | Fetch all problems |
| `GET` | `/api/problems/course/:name` | Filter problems by topic (DSA / Python / C) |
| `POST` | `/api/progress` | Save or update a problem attempt (upsert) |
| `PATCH` | `/api/progress/hint` | Increment the hint counter for a problem |
| `GET` | `/api/dashboard/:userId` | Retrieve full dashboard stats for a user |

### Python FastAPI — Port 8000

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/hint` | Generate a leveled hint via Gemini |
| `GET` | `/search?query=&topic=` | Fuzzy search across problems by intent |
| `WS` | `/ws/socket.io` | WebSocket server — relays Lens frames and hint responses |

---

## Local Setup

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB running locally
- A [Firebase project](https://console.firebase.google.com/) (update `client/src/firebase.js` with your config)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone and install dependencies

```bash
git clone https://github.com/Suhaniagarwal5/multi-agent-learning-gap-analyzer.git
cd multi-agent-learning-gap-analyzer
```

```bash
# Node.js backend
cd server && npm install

# React frontend
cd ../client && npm install

# Python AI backend
cd ../ai-server
pip install -r requirements.txt
```

### 2. Configure environment variables

**`client/.env`**
```env
VITE_NODE_URL=http://localhost:5000
VITE_AI_URL=http://localhost:8000
VITE_LENS_URL=http://localhost:5173
```

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sutra-ai
```

**`ai-server/.env`**
```env
GEMINI_API_KEY=your_key_here
```

### 3. Seed the database

This clears the problems collection and re-inserts all 173 problems from `problems.json`:

```bash
cd server
node seed.js
```

### 4. Start all three servers

Open three terminal tabs and run each:

```bash
# Tab 1 — Node.js backend
cd server && npm run dev
# Listening at http://localhost:5000

# Tab 2 — Python AI backend
cd ai-server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Listening at http://localhost:8000

# Tab 3 — React frontend
cd client && npm run dev
# Listening at http://localhost:5173
```

### 5. Enable Sutra Lens (mobile camera)

Sutra Lens requires your laptop and phone to be on the **same Wi-Fi network**. This is so the phone can reach the backend WebSocket server via your laptop's local IP address.

```bash
# Find your laptop's local network IP
ipconfig      # Windows
ifconfig      # macOS / Linux
# Look for the IPv4 address, e.g. 192.168.1.5
```

Update `client/.env` with that IP:

```env
VITE_AI_URL=http://192.168.1.5:8000
VITE_LENS_URL=http://192.168.1.5:5173
```

Then in the IDE, click the camera icon → scan the QR code with your phone → allow camera access.

---

## Demo / Production Setup (HTTPS via Ngrok + Cloudflare)

> **Use this setup when demoing or presenting.** Sutra Lens and Voice Input both require camera and microphone access, which browsers block over plain `http://`. Serving the app over HTTPS — via free tunnels — fixes this without any SSL configuration.

The two tunnels serve different purposes:
- **Cloudflare** exposes the Python AI backend (port 8000) — handles Gemini hints and Socket.IO frames
- **Ngrok** exposes the React frontend (port 5173) — the URL you open on both laptop and phone

### Step 1 — Start the secure tunnels

Open two terminals:

```bash
# Terminal 1 — Cloudflare tunnel for Python AI backend
npx cloudflared tunnel --url http://localhost:8000
```
Copy the generated URL — it looks like `https://your-random-words.trycloudflare.com`

```bash
# Terminal 2 — Ngrok tunnel for React frontend
ngrok http 5173
```
Copy the **Forwarding** URL — it looks like `https://random-id.ngrok-free.app`

### Step 2 — Update environment variables

Open `client/.env` and replace the AI and Lens URLs with your tunnel links:

```env
VITE_NODE_URL=http://localhost:5000
VITE_AI_URL=https://your-random-words.trycloudflare.com
VITE_LENS_URL=https://random-id.ngrok-free.app

# Keep your Firebase config keys unchanged:
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

> No trailing slash on either URL. Also confirm `ai-server/.env` has a valid `GEMINI_API_KEY`.

### Step 3 — Start all three servers

```bash
# Terminal 3 — React frontend
cd client && npm run dev

# Terminal 4 — Node.js backend
cd server && npm run dev

# Terminal 5 — Python AI backend
cd ai-server && uvicorn main:app --reload
```

### Step 4 — Run the demo

With all five terminals running:

1. **Laptop** → open your browser → navigate to the Ngrok link → write code, test Voice (mic icon)
2. **Phone** → open browser → navigate to the same Ngrok link
3. **Sutra Lens** → click the camera icon on laptop → scan the QR code with your phone → capture handwritten notes

The phone and laptop do not need to be on the same Wi-Fi network in this setup — the tunnels handle routing over the internet.

---

## Project Structure

```
multi-agent-learning-gap-analyzer/
│
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Firebase auth state — Google + email login
│   │   ├── components/
│   │   │   ├── BottomNav.jsx        # Mobile bottom navigation bar
│   │   │   ├── Navbar.jsx
│   │   │   └── RatingCard.jsx       # Displays user rating and rank
│   │   ├── pages/
│   │   │   ├── Auth.jsx             # Unified auth page
│   │   │   ├── Home.jsx             # Landing / home screen
│   │   │   ├── Login.jsx            # Google OAuth + email/password login
│   │   │   ├── CourseSelect.jsx     # Course picker — DSA / Python / C
│   │   │   ├── TopicList.jsx        # Category cards + problem list + fuzzy search
│   │   │   ├── IDE.jsx              # Monaco editor + hints + voice + Lens QR
│   │   │   ├── Lens.jsx             # Mobile camera page — captures and emits frames
│   │   │   ├── Dashboard.jsx        # Analytics — heatmap, radar, leaderboard
│   │   │   ├── Achievements.jsx     # XP, badges, streaks
│   │   │   └── PlagReport.jsx       # Plagiarism detection results view
│   │   ├── firebase.js
│   │   └── main.jsx
│   └── .env
│
├── server/                          # Node.js + Express backend
│   ├── models/
│   │   ├── Problem.js               # MongoDB schema for problems
│   │   ├── UserProgress.js          # MongoDB schema — compound unique index on userId+problemId
│   │   ├── CodeSubmission.js        # Stores raw code submissions per user per problem
│   │   └── UserRating.js            # Weighted rating score per user
│   ├── utils/
│   │   └── ratingEngine.js          # Computes weighted score: difficulty × hints × time × AI usage
│   ├── index.js                     # All routes: problems, progress, dashboard, ratings
│   ├── seed.js                      # One-time database seeder
│   ├── problems.json                # 173 problems across DSA / Python / C
│   └── .env
│
└── ai-server/                       # Python FastAPI + Socket.IO
    ├── core/
    │   ├── hints.py                 # Gemini prompt templates for levels 1–4
    │   ├── search.py                # TheFuzz fuzzy search engine
    │   ├── ai_tutor.py              # RAG tutor — retrieves from FAISS, prompts Gemini
    │   ├── plagiarism.py            # Code similarity / plagiarism detection engine
    │   └── rag_engine.py            # LangChain pipeline — PDF ingestion + FAISS index builder
    ├── data/
    │   └── books/
    │       ├── dsa/                 # Algorithms-JeffE.pdf · ods-python.pdf
    │       ├── python/              # byte-of-python.pdf · thinkpython2.pdf
    │       └── c/                   # EssentialC.pdf · modernC.pdf
    ├── vectorstore/
    │   └── db_faiss/
    │       ├── index.faiss          # Pre-built FAISS vector index over all PDFs
    │       └── index.pkl            # Metadata map — chunk → source document + page
    ├── main.py                      # FastAPI app + Socket.IO server + all routes
    ├── requirements.txt
    └── .env
```

---

## Known Limitations & Roadmap

| Current Limitation | Planned Fix |
|-------------------|-------------|
| Code execution is simulated — no real test case runner | Integrate [Judge0 API](https://judge0.com/) for actual compilation and test evaluation |
| Achievements page uses hardcoded mock data | Connect to the same `UserProgress` collection as Dashboard |
| Gemini API key is hardcoded in `hints.py` | Move fully to `ai-server/.env` |
| `TopicList` fetches all problems and filters client-side | Push filtering to the database via `/api/problems/course/:name` |
| No feedback loop between code execution and hints | Feed Judge0 output back into Gemini for context-aware, test-aware hints |
| FAISS index must be rebuilt manually after adding new books | Add a `/admin/rebuild-index` endpoint that re-ingests PDFs on demand |

---

## License

MIT License — see [`LICENSE`](./LICENSE) for details.

---

## Acknowledgments

Powered by [Google Gemini](https://deepmind.google/technologies/gemini/), [Firebase](https://firebase.google.com/), and [MongoDB](https://www.mongodb.com/).  
Editor by [Monaco](https://microsoft.github.io/monaco-editor/) · Charts by [Recharts](https://recharts.org/) · Motion by [Framer Motion](https://www.framer.com/motion/).  
Inspired by LeetCode — built to fix what LeetCode doesn't do.

---

<div align="center">
  <i>Sutra AI — because debugging your thinking matters more than debugging your code.</i>
</div>
