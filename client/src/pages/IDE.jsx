import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Camera, Mic, Lightbulb, X, Terminal, Play, Send, CheckCircle, Loader, Bot } from 'lucide-react';

const JUDGE0_URL = "https://ce.judge0.com";
const LANGUAGE_ID = { Python: 71, C: 50, python: 71, c: 50 };

const NODE_URL  = import.meta.env.VITE_NODE_URL;
const AI_URL    = import.meta.env.VITE_AI_URL;
const lensBaseURL = import.meta.env.VITE_LENS_URL;

const IDE = () => {
  const { problemId } = useParams();
  const { user } = useAuth(); 

  const [problem,     setProblem]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [code,        setCode]        = useState("");
  const [output,      setOutput]      = useState("");
  const [hintLevel,   setHintLevel]   = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR,  setShowLensQR]  = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  // 🚨 NAYE STATES: Dedicated AI Screen ke liye
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse,  setAiResponse]  = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);

  const startTimeRef  = useRef(Date.now());
  const hintsUsedRef  = useRef(0);         
  const lensUsedRef   = useRef(false);
  const voiceUsedRef  = useRef(false);
  
  const hintStatsRef  = useRef({
    level1: 0, level2: 0, level3: 0, level4: 0,
    custom_topics: [] 
  });

  const lensURL = `${lensBaseURL}/lens/${problemId}`;

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
        console.error("Failed to fetch problem:", err);
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
      // Console ki jagah ab modal me data dikhega
      setAiResponse(data.hint);
      setShowAIModal(true);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.hint));

      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, {
          userId: user.uid, problemId, lensUsed: true,
        }).catch(() => {}); 
      }
    });

    return () => socket.disconnect();
  }, [problemId, user]);

  const saveProgress = async (status) => {
    if (!user || !problem) return; 
    const solveTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await axios.post(`${NODE_URL}/api/progress`, {
        userId: user.uid, displayName: user.displayName || user.email,
        problemId, problemTitle: problem.title, topic: problem.topic,
        category: problem.category, difficulty: problem.difficulty, status,
        solveTimeSeconds: status === 'solved' ? solveTimeSeconds : 0,
        hintsUsed: hintsUsedRef.current, 
        lensUsed: lensUsedRef.current, 
        voiceUsed: voiceUsedRef.current,
        hintAnalytics: hintStatsRef.current
      });
    } catch (err) {}
  };

  const handleRun = async () => {
    if (!problem) return;
    setOutput("> Running your code...");
    setSubmitState('submitting');
    const langId = LANGUAGE_ID[problem.language] || 71;
    try {
      const submitRes = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        { source_code: code, language_id: langId, stdin: problem.testCases?.[0]?.input || "" },
        { headers: { "Content-Type": "application/json" } }
      );
      const result = submitRes.data;
      if (result.stdout) setOutput(prev => prev + `\n> Output:\n${result.stdout}`);
      if (result.stderr) setOutput(prev => prev + `\n> Error:\n${result.stderr}`);
      if (result.compile_output) setOutput(prev => prev + `\n> Compile Error:\n${result.compile_output}`);
      if (!result.stdout && !result.stderr && !result.compile_output) setOutput(prev => prev + `\n> No output produced.`);
      saveProgress('attempted');
    } catch (err) {
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
      let passed = 0; let failed = 0; let results = [];
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await axios.post(
          `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
          { source_code: code, language_id: langId, stdin: tc.input || "", expected_output: tc.output || "" },
          { headers: { "Content-Type": "application/json" } }
        );
        const r = res.data;
        const actual = (r.stdout || "").trim();
        const expected = (tc.output || "").trim();
        const ok = actual === expected && !r.stderr && !r.compile_output;
        if (ok) {
          passed++; results.push(`  ✅ Test ${i + 1}: Passed`);
        } else {
          failed++;
          if (r.compile_output) results.push(`  ❌ Test ${i + 1}: Compile Error — ${r.compile_output.split('\n')[0]}`);
          else if (r.stderr) results.push(`  ❌ Test ${i + 1}: Runtime Error — ${r.stderr.split('\n')[0]}`);
          else {
            results.push(`  ❌ Test ${i + 1}: Wrong Answer`);
            results.push(`     Expected: ${expected}`);
            results.push(`     Got:      ${actual}`);
          }
        }
      }
      const summary = `\n> Results: ${passed}/${testCases.length} test cases passed\n` + results.join('\n');
      setOutput(prev => prev + summary);
      if (passed === testCases.length) {
        setSubmitState('passed'); setOutput(prev => prev + `\n\n🎉 All test cases passed! Problem solved.`); await saveProgress('solved');
      } else {
        setSubmitState('failed'); setOutput(prev => prev + `\n\nKeep trying — ${failed} test case(s) failed.`); await saveProgress('attempted');
      }
    } catch (err) {
      setOutput(prev => prev + `\n> Submission failed.`); setSubmitState('failed');
    }
    setTimeout(() => setSubmitState('idle'), 4000);
  };

  const startThoughtCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Oops! Your browser doesn't support Web Speech API. Use Chrome/Edge on Desktop.");
      return;
    }

    voiceUsedRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    
    recognition.onstart = () => {
      setIsListening(true);
      setShowAIModal(true);
      setAiLoading(true);
      setAiResponse("🎤 Listening to you...");
    };
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setAiResponse(`🎤 You asked: "${transcript}"\n\n⏳ Sutra AI is thinking...`);
      getAIHint(hintLevel, transcript);
    };
    
    recognition.onerror = (e) => {
      setAiResponse("❌ Microphone Error. Please check permissions.");
      setAiLoading(false);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // 🚨 AI HINT ab UI Pop-up update karega instead of console
  const getAIHint = async (level, voiceQuery = "") => {
    if(!problem) return;
    
    hintsUsedRef.current += 1; 
    setShowAIModal(true);
    setAiLoading(true);
    
    if(!voiceQuery) {
        setAiResponse(`⏳ Fetching Level ${level} Hint...`);
    }

    try {
      const res = await axios.post(`${AI_URL}/ai/hint`, {
        level, code, problem: problem.title, description: problem.description, voice_query: voiceQuery 
      });
      
      const rawHint = res.data.hint;
      
      if (voiceQuery) {
        try {
          const aiData = JSON.parse(rawHint);
          
          // Formatted display in Modal
          setAiResponse(`💡 Quick Note:\n${aiData.display}\n\n🗣️ Explanation:\n${aiData.spoken}`);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(aiData.spoken));

          if (aiData.category === "custom") {
            if (aiData.custom_topic) hintStatsRef.current.custom_topics.push(aiData.custom_topic);
          } else {
            const askedLevel = parseInt(aiData.category.split("_")[1]); 
            hintStatsRef.current[`level${askedLevel}`] += 1;
            if (askedLevel >= hintLevel && hintLevel < 4) {
              setHintLevel(askedLevel + 1);
            }
          }
        } catch (parseError) {
          setAiResponse(rawHint);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(rawHint));
        }
      } else {
        hintStatsRef.current[`level${level}`] += 1;
        setAiResponse(rawHint);
        if (hintLevel < 4) setHintLevel(prev => prev + 1); 
      }

      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, {
          userId: user.uid, problemId, voiceUsed: voiceUsedRef.current,
        }).catch(() => {});
      }
    } catch (e) {
      setAiResponse("❌ Error: Could not connect to AI Server.");
    } finally {
      setAiLoading(false);
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

  if (loading) return (<div className="h-screen bg-black text-cyan-500 flex flex-col items-center justify-center"><Loader className="animate-spin mb-4" size={32} /><p className="font-mono tracking-widest text-sm uppercase">Loading...</p></div>);
  if (!problem) return (<div className="h-screen bg-black text-red-500 flex flex-col items-center justify-center"><X size={48} className="mb-4" /><p className="font-mono tracking-widest text-lg uppercase">Problem Not Found</p></div>);

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

          {/* 🚨 NAYA BUTTON: Read AI Response */}
          <button onClick={() => setShowAIModal(true)} className="flex flex-col items-center text-zinc-500 hover:text-green-400 transition-colors ml-4 border-l border-zinc-800 pl-8">
            <Bot size={18}/><span className="text-[9px] mt-1 font-bold">AI REPLY</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user && (<div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-bold"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>TRACKING PROGRESS</div>)}
          <div className="text-zinc-700 font-mono text-[10px] tracking-[4px] ml-4">SUTRA_IDE_V2.0</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[35%] p-6 border-r border-zinc-900 overflow-y-auto bg-zinc-950/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase italic">{problem.topic}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${problem.difficulty === 'Hard' ? 'border-red-500/30 text-red-400' : problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' : 'border-green-500/30 text-green-400'}`}>{problem.difficulty}</span>
          </div>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 whitespace-pre-line">{problem.description}</p>
          
          {problem.constraints && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Constraints:</h4>
              <ul className="space-y-2">
                {Array.isArray(problem.constraints) ? problem.constraints.map((c, i) => (<li key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{c}</li>)) : (<li className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">{problem.constraints}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-800/60">
            <p className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase mb-3">This Session</p>
            <div className="flex gap-4 text-center">
              <div><p className="text-lg font-black text-yellow-400">{hintsUsedRef.current}</p><p className="text-[9px] text-zinc-600 font-bold uppercase">Hints</p></div>
              <div><p className="text-lg font-black text-cyan-400">{Math.round((Date.now() - startTimeRef.current) / 60000)}m</p><p className="text-[9px] text-zinc-600 font-bold uppercase">Time</p></div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">{problem.language === "C" ? "C (GCC 11)" : "Python 3.10"}</span>
            <div className="flex gap-3">
              <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all"><Play size={12} fill="currentColor"/> RUN</button>
              <button onClick={handleSubmit} disabled={submitState === 'submitting'} className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-black transition-all ${submitBtnStyle[submitState]}`}>{submitBtnLabel[submitState]}</button>
            </div>
          </div>

          <div className="flex-1">
            <Editor theme="vs-dark" language={problem.language?.toLowerCase() === "c" ? "c" : "python"} value={code} onChange={setCode} options={{ fontSize: 15, minimap: { enabled: false } }} />
          </div>

          <div className="h-40 bg-black border-t border-zinc-900 p-4 font-mono overflow-y-auto">
            <div className="text-[9px] text-zinc-600 flex items-center gap-2 mb-2 tracking-widest uppercase"><Terminal size={12}/> Output Console</div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{output || "> System initialized. Waiting for input..."}</div>
          </div>
        </div>
      </div>

      {/* 🚨 NAYA UI: Dedicated AI Modal Pop-up */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-950 w-full max-w-3xl max-h-[80vh] rounded-3xl border border-zinc-800 shadow-[0_0_40px_rgba(0,190,255,0.1)] flex flex-col overflow-hidden">
            <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-900/50">
              <div className="flex items-center gap-3 text-cyan-400">
                <Bot size={20} />
                <h3 className="font-black italic uppercase tracking-widest text-sm">Sutra AI Tutor</h3>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap font-mono">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-yellow-400 animate-pulse">
                  <Loader size={32} className="animate-spin mb-4" />
                  <span className="tracking-widest uppercase text-xs">{aiResponse || "Analyzing your code..."}</span>
                </div>
              ) : (
                <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
                  {aiResponse || "Ask a question using Voice, or request a Text Hint!"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLensQR && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-800 text-center relative shadow-[0_0_50px_rgba(0,0,0,1)]">
            <button onClick={() => setShowLensQR(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24}/></button>
            <div className="bg-white p-4 rounded-3xl inline-block mb-6"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${lensURL}`} alt="QR" /></div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Activate Sutra Lens</h3>
            <p className="text-[10px] text-zinc-500 mt-3 max-w-[220px] mx-auto uppercase leading-loose tracking-[1px]">Scan with your mobile to start real-time video analysis & OCR</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDE;