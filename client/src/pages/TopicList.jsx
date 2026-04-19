import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, ChevronLeft, Layers, ArrowRight, Code, CheckCircle, Clock, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const NODE_API = import.meta.env.VITE_NODE_URL;
const AI_API   = import.meta.env.VITE_AI_URL;

// ── STATUS CONFIG ─────────────────────────────────────────
// Maps a problem's status to icon, color, and label
const STATUS = {
  solved:    { icon: CheckCircle, color: "text-green-500",  border: "border-green-500/20",  bg: "bg-green-500/8",  label: "Solved"    },
  attempted: { icon: Clock,       color: "text-yellow-500", border: "border-yellow-500/20", bg: "bg-yellow-500/8", label: "Attempted" },
  unsolved:  { icon: Circle,      color: "text-zinc-700",   border: "border-zinc-800",      bg: "",                label: ""          },
};

const TopicList = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [problems,          setProblems]          = useState([]);
  const [categories,        setCategories]        = useState([]);
  const [matchedCategories, setMatchedCategories] = useState([]);
  const [selectedCategory,  setSelectedCategory]  = useState(null);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [loading,           setLoading]           = useState(false);

  // ── PROGRESS STATE ────────────────────────────────────────
  // solvedMap: { [problemId]: "solved" | "attempted" }
  const [solvedMap, setSolvedMap] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);

  // ── FETCH PROBLEMS + CATEGORIES ──────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, [courseId]);

  // ── FETCH USER PROGRESS ──────────────────────────────────
  // Runs once user is available. Hits existing /api/dashboard/:userId
  // and builds a flat map of { problemId -> status }
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProgress = async () => {
      setProgressLoading(true);
      try {
        const res = await axios.get(`${NODE_API}/api/dashboard/${user.uid}`);
        // recentActivity contains all attempts (solved + attempted)
        // We build the map from it
        const map = {};
        (res.data.recentActivity || []).forEach((item) => {
          // recentActivity is sorted newest first — first occurrence wins
          if (!map[item.id]) {
            map[item.id] = item.status; // "solved" or "attempted"
          }
        });
        setSolvedMap(map);
      } catch (err) {
        console.error("Progress fetch error:", err);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, [user?.uid]);

  // ── SMART SEARCH DEBOUNCE ─────────────────────────────────
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        if (selectedCategory) {
          fetchFuzzyProblems();
        } else {
          fetchFuzzyCategories();
        }
      } else if (searchTerm.length === 0) {
        if (selectedCategory) fetchInitialData();
        setMatchedCategories(categories);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, categories]);

  const fetchInitialData = async () => {
    try {
      const res      = await axios.get(`${NODE_API}/api/problems`);
      const filtered = res.data.filter((p) => p.topic === courseId);
      setProblems(filtered);

      const uniqueCats = [...new Set(filtered.map((p) => p.category))];
      setCategories(uniqueCats);
      setMatchedCategories(uniqueCats);
    } catch (err) {
      console.error("Node Server Error:", err);
    }
  };

  const fetchFuzzyCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${AI_API}/api/match-strings`, {
        query:   searchTerm,
        targets: categories,
      });
      setMatchedCategories(res.data.results || []);
    } catch (err) {
      console.error("AI Category Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFuzzyProblems = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${AI_API}/api/search`, {
        query: searchTerm,
        topic: courseId,
      });
      setProblems(res.data.results || []);
    } catch (err) {
      console.error("AI Problem Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    fetchInitialData();
  };

  // ── DERIVED VALUES ────────────────────────────────────────

  const displayProblems = problems.filter((p) => p.category === selectedCategory);

  // For a given category, count how many problems are solved/attempted
  const getCategoryStats = (cat) => {
    const catProblems = problems.filter((p) => p.category === cat);
    const total    = catProblems.length;
    const solved   = catProblems.filter((p) => solvedMap[p.problemId] === "solved").length;
    const attempted = catProblems.filter((p) => solvedMap[p.problemId] === "attempted").length;
    const pct      = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, attempted, pct };
  };

  // For a single problem row, get its status
  const getProblemStatus = (prob) => {
    const s = solvedMap[prob.problemId];
    if (s === "solved")   return STATUS.solved;
    if (s === "attempted") return STATUS.attempted;
    return STATUS.unsolved;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── BACK BUTTON ───────────────────────────────── */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-500 hover:text-white mb-8 transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform mr-2" />
          {selectedCategory ? "Back to Categories" : "Back to Courses"}
        </button>

        {/* ── HEADER ────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase">
              {selectedCategory || courseId}
              <span className="text-cyan-500"> {selectedCategory ? "CHALLENGES" : "MODULES"}</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {loading ? "AI Agent is searching..." : "Powered by Python Levenshtein Engine"}
            </p>
          </div>

          {/* ── SEARCH ──────────────────────────────────── */}
          <div className="relative w-full md:w-80">
            <Search
              className={`absolute left-4 top-3.5 ${loading ? "text-cyan-500 animate-pulse" : "text-gray-500"}`}
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              placeholder={selectedCategory ? "Search questions..." : "Search categories..."}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-3 pl-12 pr-6 text-sm focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* ── PAGE 2: CATEGORY CARDS ────────────────────── */}
        {!selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedCategories.map((cat, index) => {
              const stats = getCategoryStats(cat);
              const allDone = stats.solved === stats.total && stats.total > 0;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => { setSelectedCategory(cat); setSearchTerm(""); }}
                  className={`bg-zinc-900 border rounded-2xl p-8 cursor-pointer group transition-all
                    ${allDone
                      ? "border-green-500/30 hover:border-green-400"
                      : "border-zinc-800 hover:border-cyan-500"
                    }`}
                >
                  {/* Icon + completion badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${allDone
                        ? "bg-green-500/15 text-green-400 group-hover:bg-green-500 group-hover:text-black"
                        : "bg-white/5 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black"
                      }`}
                    >
                      {allDone ? <CheckCircle size={22} /> : <Layers size={24} />}
                    </div>

                    {/* X/Y pill */}
                    {!progressLoading && stats.total > 0 && (
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider
                        ${stats.solved === stats.total
                          ? "border-green-500/30 text-green-400 bg-green-500/8"
                          : stats.solved > 0
                          ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/8"
                          : "border-zinc-700 text-zinc-500"
                        }`}
                      >
                        {stats.solved}/{stats.total}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">{cat}</h3>
                  <p className="text-gray-500 text-sm mb-5">
                    {stats.attempted > 0 && stats.solved < stats.total
                      ? `${stats.attempted} in progress`
                      : "Explore problems"}
                  </p>

                  {/* Progress bar */}
                  {!progressLoading && stats.total > 0 && (
                    <div className="mb-5">
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                          className="h-full rounded-full"
                          style={{
                            background: allDone
                              ? "linear-gradient(90deg, #22c55e, #4ade80)"
                              : "linear-gradient(90deg, #00E5FF, #8B5CF6)",
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 font-bold mt-1.5 uppercase tracking-wider">
                        {stats.pct}% complete
                      </p>
                    </div>
                  )}

                  <div className={`flex items-center font-bold text-sm gap-2
                    ${allDone ? "text-green-400" : "text-cyan-500"}`}
                  >
                    {allDone ? "COMPLETED" : "EXPLORE"}
                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.div>
              );
            })}

            {matchedCategories.length === 0 && !loading && (
              <div className="col-span-3 text-center py-20 text-gray-500">
                No categories match your AI query.
              </div>
            )}
          </div>
        )}

        {/* ── PAGE 3: PROBLEM LIST ──────────────────────── */}
        {selectedCategory && (
          <>
            {/* Category summary bar */}
            {!progressLoading && (() => {
              const stats = getCategoryStats(selectedCategory);
              return stats.total > 0 ? (
                <div className="flex items-center gap-4 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #00E5FF, #8B5CF6)" }}
                    />
                  </div>
                  <span className="text-xs font-black text-zinc-400 whitespace-nowrap">
                    {stats.solved}/{stats.total} solved
                  </span>
                  {stats.attempted > 0 && (
                    <span className="text-[10px] font-bold text-yellow-500 whitespace-nowrap">
                      {stats.attempted} attempted
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {/* Problem rows */}
            <div className="grid gap-4">
              {displayProblems.map((prob, index) => {
                const status  = getProblemStatus(prob);
                const Icon    = status.icon;
                const isSolved   = status === STATUS.solved;
                const isAttempted = status === STATUS.attempted;

                return (
                  <motion.div
                    key={prob.problemId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/ide/${prob.problemId}`)}
                    className={`border rounded-xl p-6 cursor-pointer flex justify-between items-center group transition-all
                      ${isSolved
                        ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/40"
                        : isAttempted
                        ? "bg-yellow-500/5 border-yellow-500/15 hover:bg-yellow-500/8 hover:border-yellow-500/30"
                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                      }`}
                  >
                    {/* Left: status icon + title */}
                    <div className="flex items-center gap-4">
                      {/* Status icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all
                        ${isSolved
                          ? "bg-green-500/15 border-green-500/30 text-green-500"
                          : isAttempted
                          ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-500"
                          : "bg-black border-zinc-800 text-zinc-600 group-hover:text-cyan-500 group-hover:border-cyan-500"
                        }`}
                      >
                        {isSolved || isAttempted
                          ? <Icon size={18} />
                          : <Code size={18} />
                        }
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg font-bold transition-colors
                            ${isSolved
                              ? "text-green-400"
                              : isAttempted
                              ? "text-yellow-400"
                              : "text-gray-200 group-hover:text-cyan-500"
                            }`}
                          >
                            {prob.title}
                          </h4>
                          {/* Inline status badge */}
                          {(isSolved || isAttempted) && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest
                              ${isSolved
                                ? "border-green-500/30 text-green-500 bg-green-500/8"
                                : "border-yellow-500/30 text-yellow-500 bg-yellow-500/8"
                              }`}
                            >
                              {status.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{prob.description}</p>
                      </div>
                    </div>

                    {/* Right: difficulty badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded text-xs font-bold border ${
                        prob.difficulty === "Easy"
                          ? "border-green-500/30 text-green-500"
                          : prob.difficulty === "Medium"
                          ? "border-yellow-500/30 text-yellow-500"
                          : "border-red-500/30 text-red-500"
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {displayProblems.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-500">
                  No questions found via AI Search.
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TopicList;