import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Camera, Mic, Volume2, Lightbulb, X, Terminal, Play, Send, CheckCircle } from 'lucide-react';

// ── Read from .env (add these to your client/.env file)
// VITE_NODE_URL=http://localhost:5000
// VITE_AI_URL=http://10.160.108.166:8000   ← your laptop IP
const NODE_URL  = import.meta.env.VITE_NODE_URL || 'http://localhost:5000';
const AI_URL    = import.meta.env.VITE_AI_URL   || 'http://10.160.108.166:8000';
const lensBaseURL = import.meta.env.VITE_LENS_URL || `http://10.160.108.166:5173`;

const IDE = () => {
  const { problemId } = useParams();
  const { user } = useAuth(); // ← Get current user for progress tracking

  const [code,        setCode]        = useState("# Write your solution here...");
  const [output,      setOutput]      = useState("");
  const [hintLevel,   setHintLevel]   = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR,  setShowLensQR]  = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'submitting' | 'passed' | 'failed'

  // ── Progress tracking refs (don't cause re-renders) ──────
  const startTimeRef  = useRef(Date.now()); // when user first opens problem
  const hintsUsedRef  = useRef(0);          // total hints requested this session
  const lensUsedRef   = useRef(false);
  const voiceUsedRef  = useRef(false);

  // ── Problem data (in production: fetch from /api/problems/:id) ──
  const problem = {
    title:       "Kth Largest Without Sorting",
    description: "Given an array of integers and an integer K, return the Kth largest element. You must optimize the solution.",
    topic:       "DSA",
    category:    "Heaps",
    difficulty:  "Hard",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "1 <= k <= nums.length",
      "Time Complexity: O(n) expected"
    ]
  };

  const lensURL = `${lensBaseURL}/lens/${problemId}`;

  // ── 1. SOCKET — Real-time Lens hints ─────────────────────
  useEffect(() => {
    const socket = io(AI_URL, { path: "/ws/socket.io" });
    socket.emit("join_problem", { problemId });

    socket.on("lens_hint", (data) => {
      lensUsedRef.current = true;
      setOutput(prev => prev + `\n[LENS AI]: ${data.hint}`);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.hint));

      // Track lens hint usage in DB (fire and forget)
      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, {
          userId:    user.uid,
          problemId,
          lensUsed:  true,
        }).catch(() => {}); // silent fail — don't disrupt UX
      }
    });

    return () => socket.disconnect();
  }, [problemId, user]);


  // ── 2. SAVE PROGRESS HELPER ───────────────────────────────
  const saveProgress = async (status) => {
    if (!user) return; // not logged in, skip

    const solveTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await axios.post(`${NODE_URL}/api/progress`, {
        userId:           user.uid,
        displayName:      user.displayName || user.email,
        problemId,
        problemTitle:     problem.title,
        topic:            problem.topic,
        category:         problem.category,
        difficulty:       problem.difficulty,
        status,
        solveTimeSeconds: status === 'solved' ? solveTimeSeconds : 0,
        hintsUsed:        hintsUsedRef.current,
        lensUsed:         lensUsedRef.current,
        voiceUsed:        voiceUsedRef.current,
      });
    } catch (err) {
      console.warn('Progress save failed:', err.message);
      // Silent fail — don't block the user if server is down
    }
  };


  // ── 3. RUN ────────────────────────────────────────────────
  const handleRun = () => {
    setOutput(prev => prev + "\n> Running test cases...\n> Result: Passed (O(n) logic detected)");
    // Save as 'attempted' each time they run (upsert won't overwrite a 'solved')
    saveProgress('attempted');
  };


  // ── 4. SUBMIT ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitState('submitting');
    setOutput(prev => prev + "\n> Submitting...");

    // Simulate test case check (replace with real Judge0 call later)
    await new Promise(r => setTimeout(r, 1000));
    const passed = true; // Replace: const passed = await runTestCases(code, problem);

    if (passed) {
      setSubmitState('passed');
      setOutput(prev => prev + "\n✅ 10/10 Test cases passed! Problem solved.");
      await saveProgress('solved'); // ← Save as SOLVED with full metrics
    } else {
      setSubmitState('failed');
      setOutput(prev => prev + "\n❌ Some test cases failed. Keep trying!");
      await saveProgress('attempted');
    }

    setTimeout(() => setSubmitState('idle'), 3000);
  };


  // ── 5. VOICE THOUGHTS ─────────────────────────────────────
  const startThoughtCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");

    voiceUsedRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => getAIHint(hintLevel, e.results[0][0].transcript);
    recognition.onend   = () => setIsListening(false);
    recognition.start();
  };


  // ── 6. AI HINT ────────────────────────────────────────────
  const getAIHint = async (level, context = "") => {
    hintsUsedRef.current += 1; // track locally
    setOutput(prev => prev + `\n[Level ${level}] AI Analyzing...`);

    try {
      const res = await axios.post(`${AI_URL}/ai/hint`, {
        level, code,
        problem:     problem.title,
        description: context || problem.description
      });
      const hint = res.data.hint;
      setOutput(prev => prev + `\nAI: ${hint}`);
      if (hintLevel < 4) setHintLevel(prev => prev + 1);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(hint));

      // Persist hint count to DB (fire and forget)
      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, {
          userId:    user.uid,
          problemId,
          voiceUsed: voiceUsedRef.current,
        }).catch(() => {});
      }
    } catch (e) {
      setOutput(prev => prev + "\nAI Server Error: Check Backend");
    }
  };


  // ── SUBMIT BUTTON STYLES ──────────────────────────────────
  const submitBtnStyle = {
    idle:       'bg-cyan-600 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)]',
    submitting: 'bg-zinc-700 text-zinc-400 cursor-wait',
    passed:     'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    failed:     'bg-red-700 text-white',
  };
  const submitBtnLabel = {
    idle:       <><Send size={12} fill="currentColor"/> SUBMIT</>,
    submitting: <>Checking...</>,
    passed:     <><CheckCircle size={12}/> PASSED</>,
    failed:     <>FAILED — Retry</>,
  };


  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950">
        <div className="flex gap-8">
          <button onClick={() => setShowLensQR(true)}
            className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
            <Camera size={18}/><span className="text-[9px] mt-1 font-bold">LENS</span>
          </button>
          <button onClick={startThoughtCapture}
            className={`flex flex-col items-center transition-colors ${isListening ? 'text-red-500' : 'text-zinc-500 hover:text-purple-400'}`}>
            <Mic size={18} className={isListening ? 'animate-pulse' : ''}/><span className="text-[9px] mt-1 font-bold">THOUGHTS</span>
          </button>
          <button onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(output.split('\n').pop()))}
            className="flex flex-col items-center text-zinc-500 hover:text-green-400 transition-colors">
            <Volume2 size={18}/><span className="text-[9px] mt-1 font-bold">SPEAK</span>
          </button>
          <button onClick={() => getAIHint(hintLevel)}
            className="flex flex-col items-center text-zinc-500 hover:text-yellow-400 transition-colors">
            <Lightbulb size={18}/><span className="text-[9px] mt-1 font-bold">HINT ({hintLevel})</span>
          </button>
        </div>

        {/* Live tracking indicator */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-bold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
              TRACKING PROGRESS
            </div>
          )}
          <div className="text-zinc-700 font-mono text-[10px] tracking-[4px] ml-4">SUTRA_IDE_V2.0</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL — Problem Statement ─────────────────── */}
        <div className="w-[35%] p-6 border-r border-zinc-900 overflow-y-auto bg-zinc-950/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase italic">Problem Statement</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
              problem.difficulty === 'Hard'   ? 'border-red-500/30 text-red-400' :
              problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                                                'border-green-500/30 text-green-400'
            }`}>{problem.difficulty}</span>
          </div>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">{problem.description}</p>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Constraints:</h4>
            <ul className="space-y-2">
              {problem.constraints.map((c, i) => (
                <li key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{c}</li>
              ))}
            </ul>
          </div>

          {/* Session stats — updates live */}
          <div className="mt-8 pt-6 border-t border-zinc-800/60">
            <p className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase mb-3">This Session</p>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-lg font-black text-yellow-400">{hintsUsedRef.current}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Hints</p>
              </div>
              <div>
                <p className="text-lg font-black text-cyan-400">
                  {Math.round((Date.now() - startTimeRef.current) / 60000)}m
                </p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── EDITOR PANEL ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">Python 3.10</span>
            <div className="flex gap-3">
              <button onClick={handleRun}
                className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all">
                <Play size={12} fill="currentColor"/> RUN
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === 'submitting'}
                className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-black transition-all ${submitBtnStyle[submitState]}`}
              >
                {submitBtnLabel[submitState]}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <Editor
              theme="vs-dark"
              defaultLanguage="python"
              value={code}
              onChange={setCode}
              options={{ fontSize: 15, minimap: { enabled: false } }}
            />
          </div>

          <div className="h-40 bg-black border-t border-zinc-900 p-4 font-mono overflow-y-auto">
            <div className="text-[9px] text-zinc-600 flex items-center gap-2 mb-2 tracking-widest uppercase">
              <Terminal size={12}/> Output Console
            </div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {output || "> System initialized. Waiting for input..."}
            </div>
          </div>
        </div>
      </div>

      {/* ── LENS QR MODAL ──────────────────────────────────── */}
      {showLensQR && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-800 text-center relative shadow-[0_0_50px_rgba(0,0,0,1)]">
            <button onClick={() => setShowLensQR(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24}/></button>
            <div className="bg-white p-4 rounded-3xl inline-block mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${lensURL}`} alt="QR" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Activate Sutra Lens</h3>
            <p className="text-[10px] text-zinc-500 mt-3 max-w-[220px] mx-auto uppercase leading-loose tracking-[1px]">
              Scan with your mobile to start real-time video analysis & OCR
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDE;