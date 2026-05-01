# 🚀 SUTRA AI - ULTIMATE DEMO SETUP GUIDE

Welcome to the Sutra AI Setup Guide!  
To make the **Sutra Lens** (Mobile Camera) and **Voice** features work flawlessly across devices, we serve the application over secure HTTPS using **Ngrok** (Frontend) and **Cloudflare** (AI Backend).

---

## STEP 1: START THE SECURE TUNNELS
> Requires 2 separate terminals

### 🟢 Terminal 1 — Cloudflare (Python AI Backend)
```bash
npx cloudflared tunnel --url http://localhost:8000
npx cloudflared tunnel --url http://127.0.0.1:8000
```
📌 **Action:** Copy the generated link → looks like `https://your-random-words.trycloudflare.com`

### 🟢 Terminal 2 — Ngrok (React Frontend)
```bash
ngrok http 5173
npx localtunnel --port 5173
ssh -R 80:localhost:5173 serveo.net

https://console.serveo.net/settings?n=1&src=ssh_nudge&v=B
```
📌 **Action:** Copy the **Forwarding** link → looks like `https://random-id.ngrok-free.app`

---

## STEP 2: UPDATE ENVIRONMENT VARIABLES

Open `client/.env` and update with the links from Step 1:

```env
VITE_NODE_URL=http://localhost:5000
VITE_AI_URL=[PASTE_YOUR_CLOUDFLARE_LINK_HERE_WITHOUT_TRAILING_SLASH]
VITE_LENS_URL=[PASTE_YOUR_NGROK_LINK_HERE_WITHOUT_TRAILING_SLASH]

# Keep your Firebase keys exactly as they are:
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

📂 Also ensure `ai-server/.env` has a valid `GEMINI_API_KEY`.

---

## STEP 3: START ALL 3 SERVERS
> Requires 3 separate terminals

### 🟢 Terminal 3 — React Frontend
```bash
cd client
npm run dev
```

### 🟢 Terminal 4 — Node.js Backend
```bash
cd server
npm run dev
```

### 🟢 Terminal 5 — Python AI Backend
```bash
cd ai-server
uvicorn main:app --reload
```

---

## STEP 4: HOW TO PRESENT THE DEMO 

Once all 5 terminals are running without errors:

1. **Laptop** → Open browser → go to your **Ngrok link** → write code, test **Voice (Mic)**
2. **Mobile** → Open browser → go to the **same Ngrok link**
3. **Sutra Lens** → Click the 📷 camera icon on laptop → scan QR with phone → capture handwritten notes!

---

> 🎉 You are now running **Sutra AI** in full production-demo mode!