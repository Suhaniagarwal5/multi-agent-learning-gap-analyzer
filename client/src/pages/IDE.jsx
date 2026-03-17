import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Camera, Mic, Volume2, Lightbulb, X, Terminal, Play, Send, CheckCircle, Loader } from 'lucide-react';

const JUDGE0_URL = "https://ce.judge0.com";
const LANGUAGE_ID = { Python: 71, C: 50, python: 71, c: 50 };

const NODE_URL  = import.meta.env.VITE_NODE_URL;
const AI_URL    = import.meta.env.VITE_AI_URL;
const lensBaseURL = import.meta.env.VITE_LENS_URL;

const IDE = () => {
  const { problemId } = useParams(); // URL se problemId nikal rahe hain (e.g., DSA-011)
  const { user } = useAuth(); 

  // ── DYNAMIC STATES ────────────────────────────────────────
  const [problem,     setProblem]     = useState(null); // Real problem data store karne ke liye
  const [loading,     setLoading]     = useState(true); // Loading screen ke liye
  
  const [code,        setCode]        = useState("");
  const [output,      setOutput]      = useState("");
  const [hintLevel,   setHintLevel]   = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR,  setShowLensQR]  = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const startTimeRef  = useRef(Date.now());
  const hintsUsedRef  = useRef(0);         
  const lensUsedRef   = useRef(false);
  const voiceUsedRef  = useRef(false);

  const lensURL = `${lensBaseURL}/lens/${problemId}`;

  // ── 0. FETCH PROBLEM DATA DYNAMICALLY ───────────────────────
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        // Node backend se saare problems fetch karo
        const res = await axios.get(`${NODE_URL}/api/problems`);
        
        // Sirf wahi problem dhoondo jiska ID URL se match karta ho
        const foundProblem = res.data.find(p => p.problemId === problemId);
        
        if (foundProblem) {
          setProblem(foundProblem);
          // Starter code dynamically set karo (C ya Python ka)
          setCode(foundProblem.starterCode || "// Write your code here...");
        } else {
          setOutput("Error: Problem not found in database.");
        }
      } catch (err) {
        console.error("Failed to fetch problem:", err);
        setOutput("Error connecting to server to fetch problem data.");
      } finally {
        setLoading(false); // Data aate hi loading hata do
      }
    };

    fetchProblemData();
  }, [problemId]); // Jab bhi URL change hoga, naya problem aayega

  // ── 1. SOCKET — Real-time Lens hints ─────────────────────
  useEffect(() => {
    const socket = io(AI_URL, { path: "/ws/socket.io" });
    socket.emit("join_problem", { problemId });

    socket.on("lens_hint", (data) => {
      lensUsedRef.current = true;
      setOutput(prev => prev + `\n[LENS AI]: ${data.hint}`);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.hint));

      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, {
          userId:    user.uid,
          problemId,
          lensUsed:  true,
        }).catch(() => {}); 
      }
    });

    return () => socket.disconnect();
  }, [problemId, user]);


  // ── 2. SAVE PROGRESS HELPER ───────────────────────────────
  const saveProgress = async (status) => {
    if (!user || !problem) return; 

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
    }
  };


  // ── 3. RUN ────────────────────────────────────────────────
  const handleRun = async () => {
  if (!problem) return;
  setOutput("> Running your code...");
  setSubmitState('submitting');
 
  const langId = LANGUAGE_ID[problem.language] || 71;
 
  try {
    // Step 1 — Submit code to Judge0
    const submitRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: langId,
        stdin: problem.testCases?.[0]?.input || "",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
 
    const result = submitRes.data;
 
    // Step 2 — Show output
    if (result.stdout) {
      setOutput(prev => prev + `\n> Output:\n${result.stdout}`);
    }
    if (result.stderr) {
      setOutput(prev => prev + `\n> Error:\n${result.stderr}`);
    }
    if (result.compile_output) {
      setOutput(prev => prev + `\n> Compile Error:\n${result.compile_output}`);
    }
    if (!result.stdout && !result.stderr && !result.compile_output) {
      setOutput(prev => prev + `\n> No output produced.`);
    }
 
    // Save as attempted
    saveProgress('attempted');
 
  } catch (err) {
    setOutput(prev => prev + `\n> Execution failed. Check your code or try again.`);
    console.error("Judge0 error:", err);
  } finally {
    setSubmitState('idle');
  }
};


  // ── 4. SUBMIT ─────────────────────────────────────────────
  const handleSubmit = async () => {
  if (!problem) return;
  setSubmitState('submitting');
  setOutput("> Submitting — running all test cases...");
  const langId = LANGUAGE_ID[problem.language] || 71;
  const testCases = problem.testCases || [];
 
  if (testCases.length === 0) {
    setOutput(prev => prev + "\n> No test cases found for this problem.");
    setSubmitState('idle');
    return;
  }
 
  try {
    let passed = 0;
    let failed = 0;
    let results = [];
 
    // Run each test case one by one
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
 
      const res = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: langId,
          stdin: tc.input || "",
          expected_output: tc.output || "",
        },
        { headers: { "Content-Type": "application/json" } }
      );
 
      const r = res.data;
      const actual   = (r.stdout || "").trim();
      const expected = (tc.output || "").trim();
      const ok       = actual === expected && !r.stderr && !r.compile_output;
 
      if (ok) {
        passed++;
        results.push(`  ✅ Test ${i + 1}: Passed`);
      } else {
        failed++;
        // Show what went wrong
        if (r.compile_output) {
          results.push(`  ❌ Test ${i + 1}: Compile Error — ${r.compile_output.split('\n')[0]}`);
        } else if (r.stderr) {
          results.push(`  ❌ Test ${i + 1}: Runtime Error — ${r.stderr.split('\n')[0]}`);
        } else {
          results.push(`  ❌ Test ${i + 1}: Wrong Answer`);
          results.push(`     Expected: ${expected}`);
          results.push(`     Got:      ${actual}`);
        }
      }
    }
 
    // Show final result
    const summary = `\n> Results: ${passed}/${testCases.length} test cases passed\n` + results.join('\n');
    setOutput(prev => prev + summary);
 
    if (passed === testCases.length) {
      setSubmitState('passed');
      setOutput(prev => prev + `\n\n🎉 All test cases passed! Problem solved.`);
      await saveProgress('solved');
    } else {
      setSubmitState('failed');
      setOutput(prev => prev + `\n\nKeep trying — ${failed} test case(s) failed.`);
      await saveProgress('attempted');
    }
 
  } catch (err) {
    setOutput(prev => prev + `\n> Submission failed. Check connection or try again.`);
    setSubmitState('failed');
    console.error("Judge0 submit error:", err);
  }
 
  setTimeout(() => setSubmitState('idle'), 4000);
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
    if(!problem) return;
    
    hintsUsedRef.current += 1; 
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

  // ── LOADING UI ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-black text-cyan-500 flex flex-col items-center justify-center">
        <Loader className="animate-spin mb-4" size={32} />
        <p className="font-mono tracking-widest text-sm uppercase">Loading Problem Data...</p>
      </div>
    );
  }

  // ── NOT FOUND UI ───────────────────────────────────────
  if (!problem) {
    return (
      <div className="h-screen bg-black text-red-500 flex flex-col items-center justify-center">
        <X size={48} className="mb-4" />
        <p className="font-mono tracking-widest text-lg uppercase">Problem Not Found</p>
      </div>
    );
  }

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
            <span className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase italic">{problem.topic}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
              problem.difficulty === 'Hard'   ? 'border-red-500/30 text-red-400' :
              problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                                                'border-green-500/30 text-green-400'
            }`}>{problem.difficulty}</span>
          </div>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 whitespace-pre-line">{problem.description}</p>
          
          {problem.constraints && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Constraints:</h4>
              <ul className="space-y-2">
                {/* Dynamically checking if constraints is array or single string */}
                {Array.isArray(problem.constraints) ? problem.constraints.map((c, i) => (
                  <li key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{c}</li>
                )) : (
                  <li className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{problem.constraints}</li>
                )}
              </ul>
            </div>
          )}

          {/* Session stats */}
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
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">
              {/* Dynamic Language Label */}
              {problem.language === "C" ? "C (GCC 11)" : "Python 3.10"}
            </span>
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
              // Dynamic Language matching
              language={problem.language?.toLowerCase() === "c" ? "c" : "python"} 
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