import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  Camera, Mic, Lightbulb, X, Terminal, Play, Send,
  CheckCircle, Loader, Bot, ShieldCheck, RotateCcw,
  Clock, BookOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import PlagReport from './PlagReport';

const JUDGE0_URL  = "https://ce.judge0.com";
const LANGUAGE_ID = { Python: 71, C: 50, python: 71, c: 50 };

const NODE_URL    = import.meta.env.VITE_NODE_URL;
const AI_URL      = import.meta.env.VITE_AI_URL;
const lensBaseURL = import.meta.env.VITE_LENS_URL;

const IDE = () => {
  const { problemId } = useParams();
  const { user }      = useAuth();

  const [problem,     setProblem]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [code,        setCode]        = useState("");
  const [output,      setOutput]      = useState("");
  const [hintLevel,   setHintLevel]   = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR,  setShowLensQR]  = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse,  setAiResponse]  = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);

  const [showPlagModal, setShowPlagModal] = useState(false);
  const [plagReport,    setPlagReport]    = useState(null);
  const [plagLoading,   setPlagLoading]   = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasSolved, setHasSolved] = useState(false);

  const startTimeRef = useRef(Date.now());
  const hintsUsedRef = useRef(0);
  const lensUsedRef  = useRef(false);
  const voiceUsedRef = useRef(false);
  const hintStatsRef = useRef({ level1: 0, level2: 0, level3: 0, level4: 0, custom_topics: [] });

  const lensURL = `${lensBaseURL}/lens/${problemId}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const res = await axios.get(`${NODE_URL}/api/problems`);
        const foundProblem = res.data.find(p => p.problemId === problemId);
        if (foundProblem) {
          setProblem(foundProblem);
          setCode(foundProblem.starterCode || "// Write your code here...");
        } else {
          setOutput("Error: Problem not found in database.");
        }
      } catch (err) {
        setOutput("Error connecting to server to fetch problem data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblemData();
  }, [problemId]);

  useEffect(() => {
    const socket = io(AI_URL, { path: "/ws/socket.io" });
    socket.emit("join_problem", { problemId });
    socket.on("lens_hint", (data) => {
      lensUsedRef.current = true;
      setAiResponse(data.hint);
      setShowAIModal(true);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.hint));
      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, { userId: user.uid, problemId, lensUsed: true }).catch(() => {});
      }
    });
    return () => socket.disconnect();
  }, [problemId, user]);

  const saveProgress = async (status, passedCases = 0, totalCases = 1, isPlagiarized = false) => {
    if (!user || !problem) return;
    const solveTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await axios.post(`${NODE_URL}/api/progress`, {
        userId: user.uid, displayName: user.displayName || user.email,
        problemId, problemTitle: problem.title, topic: problem.topic,
        category: problem.category, difficulty: problem.difficulty, status,
        solveTimeSeconds: status === 'solved' ? solveTimeSeconds : 0,
        hintsUsed: hintsUsedRef.current,
        lensUsed:  lensUsedRef.current,
        voiceUsed: voiceUsedRef.current,
        hintAnalytics: hintStatsRef.current,
        code, language: problem.language,
        testCasesPassed: passedCases,
        totalTestCases: totalCases,
        isPlagiarized: isPlagiarized
      });
      await axios.post(`${NODE_URL}/api/submissions`, {
        userId: user.uid, problemId, code, language: problem.language || "python", status,
      });
    } catch (err) {
      console.error("Failed to save data:", err);
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!code.trim() || !user || !problem) return;
    setPlagLoading(true);
    setPlagReport(null);
    try {
      const res = await axios.post(`${AI_URL}/api/plagiarism`, {
        code, problem_id: problemId, problem_title: problem.title, user_id: user.uid,
      });
      setPlagReport(res.data);
      setShowPlagModal(true);
    } catch (err) {
      setPlagReport({ status: "error", verdict: "error", overall_score: 0, message: "Could not reach the plagiarism service.", total_submissions_checked: 0, matches_found: 0 });
      setShowPlagModal(true);
    } finally {
      setPlagLoading(false);
    }
  };

  const handleRun = async () => {
    if (!problem) return;
    setOutput("> Running your code...");
    setSubmitState('submitting');
    const langId = LANGUAGE_ID[problem.language] || 71;
    try {
      const submitRes = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, { source_code: code, language_id: langId, stdin: problem.testCases?.[0]?.input || "" }, { headers: { "Content-Type": "application/json" } });
      const result = submitRes.data;
      if (result.stdout) setOutput(prev => prev + `\n> Output:\n${result.stdout}`);
      if (result.stderr) setOutput(prev => prev + `\n> Error:\n${result.stderr}`);
      if (result.compile_output) setOutput(prev => prev + `\n> Compile Error:\n${result.compile_output}`);
      if (!result.stdout && !result.stderr && !result.compile_output) setOutput(prev => prev + `\n> No output produced.`);
      saveProgress('attempted', 0, 1, false);
    } catch {
      setOutput(prev => prev + `\n> Execution failed. Check your code or try again.`);
    } finally {
      setSubmitState('idle');
    }
  };

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
      let passed = 0, failed = 0, results = [];
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, { source_code: code, language_id: langId, stdin: tc.input || "", expected_output: tc.output || "" }, { headers: { "Content-Type": "application/json" } });
        const r = res.data;
        const actual = (r.stdout || "").trim();
        const expected = (tc.output || "").trim();
        const ok = actual === expected && !r.stderr && !r.compile_output;
        if (ok) { passed++; results.push(`  ✅ Test ${i + 1}: Passed`); } 
        else {
          failed++;
          if (r.compile_output) results.push(`  ❌ Test ${i + 1}: Compile Error — ${r.compile_output.split('\n')[0]}`);
          else if (r.stderr) results.push(`  ❌ Test ${i + 1}: Runtime Error — ${r.stderr.split('\n')[0]}`);
          else { results.push(`  ❌ Test ${i + 1}: Wrong Answer`); results.push(`     Expected: ${expected}`); results.push(`     Got:      ${actual}`); }
        }
      }
      
      const summary = `\n> Results: ${passed}/${testCases.length} test cases passed\n` + results.join('\n');
      setOutput(prev => prev + summary);

      // 🔴 SILENT PLAGIARISM CHECK 🔴
      let isCopied = false;
      try {
        const plagRes = await axios.post(`${AI_URL}/api/plagiarism`, { code, problem_id: problemId, problem_title: problem.title, user_id: user.uid });
        if (plagRes.data && plagRes.data.overall_score >= 80) { 
          isCopied = true;
          setOutput(prev => prev + `\n\n🚨 PLAGIARISM DETECTED (${plagRes.data.overall_score}% match). -50 Points penalty applied!`);
        }
      } catch (err) {
         console.error("Silent plag check failed", err);
      }

      if (passed === testCases.length) {
        setSubmitState('passed');
        if (!isCopied) setOutput(prev => prev + `\n\n🎉 All test cases passed! Problem solved.`);
        await saveProgress('solved', passed, testCases.length, isCopied);
        setHasSolved(true);
        if (problem.explanation) setShowExplanation(true);
      } else {
        setSubmitState('failed');
        if (!isCopied) setOutput(prev => prev + `\n\nKeep trying — ${failed} test case(s) failed.`);
        await saveProgress('attempted', passed, testCases.length, isCopied);
      }
    } catch {
      setOutput(prev => prev + `\n> Submission failed.`);
      setSubmitState('failed');
    }
    setTimeout(() => setSubmitState('idle'), 4000);
  };

  const startThoughtCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Oops! Your browser doesn't support Web Speech API. Use Chrome/Edge on Desktop."); return; }
    voiceUsedRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setShowAIModal(true); setAiLoading(true); setAiResponse("🎤 Listening to you..."); };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setAiResponse(`🎤 You asked: "${transcript}"\n\n⏳ Sutra AI is thinking...`);
      getAIHint(hintLevel, transcript);
    };
    recognition.onerror = () => { setAiResponse("❌ Microphone Error. Please check permissions."); setAiLoading(false); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const getAIHint = async (level, voiceQuery = "") => {
    if (!problem) return;
    hintsUsedRef.current += 1;
    setShowAIModal(true);
    setAiLoading(true);
    if (!voiceQuery) setAiResponse(`⏳ Fetching Level ${level} Hint...`);
    try {
      const res = await axios.post(`${AI_URL}/ai/hint`, { level, code, problem: problem.title, description: problem.description, voice_query: voiceQuery });
      const rawHint = res.data.hint;
      if (voiceQuery) {
        try {
          const aiData = JSON.parse(rawHint);
          setAiResponse(`💡 Quick Note:\n${aiData.display}\n\n🗣️ Explanation:\n${aiData.spoken}`);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(aiData.spoken));
          if (aiData.category === "custom") { if (aiData.custom_topic) hintStatsRef.current.custom_topics.push(aiData.custom_topic); } 
          else {
            const askedLevel = parseInt(aiData.category.split("_")[1]);
            hintStatsRef.current[`level${askedLevel}`] += 1;
            if (askedLevel >= hintLevel && hintLevel < 4) setHintLevel(askedLevel + 1);
          }
        } catch { setAiResponse(rawHint); window.speechSynthesis.speak(new SpeechSynthesisUtterance(rawHint)); }
      } else {
        hintStatsRef.current[`level${level}`] += 1;
        setAiResponse(rawHint);
        if (hintLevel < 4) setHintLevel(prev => prev + 1);
      }
      if (user) { axios.patch(`${NODE_URL}/api/progress/hint`, { userId: user.uid, problemId, voiceUsed: voiceUsedRef.current }).catch(() => {}); }
    } catch {
      setAiResponse("❌ Error: Could not connect to AI Server.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetCode = () => {
    setCode(problem?.starterCode || "");
    setShowResetConfirm(false);
    setOutput("");
  };

  const submitBtnStyle = {
    idle: 'bg-cyan-600 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)]',
    submitting: 'bg-zinc-700 text-zinc-400 cursor-wait',
    passed: 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    failed: 'bg-red-700 text-white',
  };
  const submitBtnLabel = {
    idle: <><Send size={12} fill="currentColor"/> SUBMIT</>,
    submitting: <>Checking...</>,
    passed: <><CheckCircle size={12}/> PASSED</>,
    failed: <>FAILED — Retry</>,
  };

  if (loading) return <div className="h-screen bg-black text-cyan-500 flex flex-col items-center justify-center"><Loader className="animate-spin mb-4" size={32}/><p className="font-mono tracking-widest text-sm uppercase">Loading...</p></div>;
  if (!problem) return <div className="h-screen bg-black text-red-500 flex flex-col items-center justify-center"><X size={48} className="mb-4"/><p className="font-mono tracking-widest text-lg uppercase">Problem Not Found</p></div>;

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950">
        <div className="flex gap-8">
          <button onClick={() => setShowLensQR(true)} className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
            <Camera size={18}/><span className="text-[9px] mt-1 font-bold">LENS</span>
          </button>
          <button onClick={startThoughtCapture} className={`flex flex-col items-center transition-colors ${isListening ? 'text-red-500' : 'text-zinc-500 hover:text-purple-400'}`}>
            <Mic size={18} className={isListening ? 'animate-pulse' : ''}/>
            <span className="text-[9px] mt-1 font-bold">{isListening ? 'LISTENING...' : 'TALK TO AI'}</span>
          </button>
          <button onClick={() => getAIHint(hintLevel, "")} className="flex flex-col items-center text-zinc-500 hover:text-yellow-400 transition-colors">
            <Lightbulb size={18}/><span className="text-[9px] mt-1 font-bold">TEXT HINT ({hintLevel})</span>
          </button>
          <button onClick={() => setShowAIModal(true)} className="flex flex-col items-center text-zinc-500 hover:text-green-400 transition-colors ml-4 border-l border-zinc-800 pl-8">
            <Bot size={18}/><span className="text-[9px] mt-1 font-bold">AI REPLY</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-black font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
            <Clock size={11} className="text-cyan-500"/><span>{formatTime(elapsedSeconds)}</span>
          </div>
          {user && <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-bold"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>TRACKING PROGRESS</div>}
          <div className="text-zinc-700 font-mono text-[10px] tracking-[4px]">SUTRA_IDE_V2.0</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[35%] p-6 border-r border-zinc-900 overflow-y-auto bg-zinc-950/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase italic">{problem.topic}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${problem.difficulty === 'Hard' ? 'border-red-500/30 text-red-400' : problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' : 'border-green-500/30 text-green-400'}`}>
              {problem.difficulty}
            </span>
          </div>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 whitespace-pre-line">{problem.description}</p>
          {problem.constraints && (
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Constraints:</h4>
              <ul className="space-y-2">
                {Array.isArray(problem.constraints) ? problem.constraints.map((c, i) => <li key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{c}</li>) : <li className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{problem.constraints}</li>}
              </ul>
            </div>
          )}
          {problem.explanation && hasSolved && (
            <div className="mb-8 rounded-2xl border border-green-500/25 overflow-hidden">
              <button onClick={() => setShowExplanation(prev => !prev)} className="w-full flex items-center justify-between px-4 py-3 bg-green-500/10 hover:bg-green-500/15 transition-colors">
                <div className="flex items-center gap-2"><BookOpen size={13} className="text-green-400"/><span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Optimal Approach</span></div>
                {showExplanation ? <ChevronUp size={14} className="text-green-500"/> : <ChevronDown size={14} className="text-green-500"/>}
              </button>
              {showExplanation && <div className="px-4 py-4 bg-green-500/5 border-t border-green-500/15"><p className="text-zinc-300 text-[12px] leading-relaxed">{problem.explanation}</p></div>}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">{problem.language === "C" ? "C (GCC 11)" : "Python 3.10"}</span>
            <div className="flex gap-3 items-center">
              <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-500 hover:text-orange-400 hover:border-orange-500/30 transition-all"><RotateCcw size={11}/> RESET</button>
              <button onClick={handlePlagiarismCheck} disabled={plagLoading} className={`flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all ${plagLoading ? 'text-zinc-500 cursor-wait' : 'text-zinc-400'}`}>
                {plagLoading ? <Loader size={12} className="animate-spin"/> : <ShieldCheck size={12}/>}
                {plagLoading ? 'CHECKING...' : 'CHECK PLAGIARISM'}
              </button>
              <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all"><Play size={12} fill="currentColor"/> RUN</button>
              <button onClick={handleSubmit} disabled={submitState === 'submitting'} className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-black transition-all ${submitBtnStyle[submitState]}`}>
                {submitBtnLabel[submitState]}
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor theme="vs-dark" language={problem.language?.toLowerCase() === "c" ? "c" : "python"} value={code} onChange={setCode} options={{ fontSize: 15, minimap: { enabled: false } }}/>
          </div>
          <div className="h-40 bg-black border-t border-zinc-900 p-4 font-mono overflow-y-auto">
            <div className="text-[9px] text-zinc-600 flex items-center gap-2 mb-2 tracking-widest uppercase"><Terminal size={12}/> Output Console</div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{output || "> System initialized. Waiting for input..."}</div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleResetCode} className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-black text-xs font-black hover:bg-orange-400 transition-colors">Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-950 w-full max-w-3xl max-h-[80vh] rounded-3xl border border-zinc-800 shadow-[0_0_40px_rgba(0,190,255,0.1)] flex flex-col overflow-hidden">
            <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-900/50">
              <div className="flex items-center gap-3 text-cyan-400"><Bot size={20}/><h3 className="font-black italic uppercase tracking-widest text-sm">Sutra AI Tutor</h3></div>
              <button onClick={() => setShowAIModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap font-mono">
              {aiLoading ? <div className="flex flex-col items-center justify-center py-10 text-yellow-400 animate-pulse"><Loader size={32} className="animate-spin mb-4"/></div> : <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">{aiResponse || "Ask a question using Voice, or request a Text Hint!"}</div>}
            </div>
          </div>
        </div>
      )}
      
      {showPlagModal && <PlagReport report={plagReport} onClose={() => setShowPlagModal(false)}/>}
    </div>
  );
};

export default IDE;