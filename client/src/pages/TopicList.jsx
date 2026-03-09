import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, ChevronLeft, Layers, ArrowRight, Code } from "lucide-react";
import { motion } from "framer-motion";

const NODE_API = import.meta.env.VITE_NODE_URL;
const AI_API = import.meta.env.VITE_AI_URL;

const TopicList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [matchedCategories, setMatchedCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [courseId]);

  // SMART API SWITCHER
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        if (selectedCategory) {
          fetchFuzzyProblems(); // Page 3: Backend Problem Search
        } else {
          fetchFuzzyCategories(); // Page 2: Backend Category Search
        }
      } else if (searchTerm.length === 0) {
        if (selectedCategory) fetchInitialData();
        setMatchedCategories(categories); // Reset Categories
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, categories]);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${NODE_API}/api/problems`);
      const filtered = res.data.filter((p) => p.topic === courseId);
      setProblems(filtered);
      
      const uniqueCats = [...new Set(filtered.map((p) => p.category))];
      setCategories(uniqueCats);
      setMatchedCategories(uniqueCats);
    } catch (err) {
      console.error("Node Server Error:", err);
    }
  };

  // NAYI API CALL: AI se pucho kaunsi category match hui
  const fetchFuzzyCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${AI_API}/api/match-strings`, {
        query: searchTerm,
        targets: categories
      });
      setMatchedCategories(res.data.results || []);
    } catch (err) {
      console.error("AI Category Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // PURANI API CALL: AI se pucho kaunse problems match hue
  const fetchFuzzyProblems = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${AI_API}/api/search`, {
        query: searchTerm,
        topic: courseId
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

  const displayProblems = problems.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform mr-2" />
          {selectedCategory ? "Back to Categories" : "Back to Courses"}
        </button>

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

          <div className="relative w-full md:w-80">
            <Search className={`absolute left-4 top-3.5 ${loading ? "text-cyan-500 animate-pulse" : "text-gray-500"}`} size={18} />
            <input
              type="text"
              value={searchTerm}
              placeholder={selectedCategory ? "Search questions (e.g. Hepp)..." : "Search categories..."}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-3 pl-12 pr-6 text-sm focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* PAGE 2 - CATEGORY CARDS (Filtered by Python AI) */}
        {!selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedCategories.map((cat, index) => (
              <motion.div
                key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                onClick={() => { setSelectedCategory(cat); setSearchTerm(""); }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-cyan-500 cursor-pointer group transition-all"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-cyan-500 mb-6 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  <Layers size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{cat}</h3>
                <p className="text-gray-500 text-sm mb-6">Explore AI Problems</p>
                <div className="flex items-center text-cyan-500 font-bold text-sm gap-2">
                  EXPLORE <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            ))}
            {matchedCategories.length === 0 && !loading && (
               <div className="col-span-3 text-center py-20 text-gray-500">No categories match your AI query.</div>
            )}
          </div>
        )}

        {/* PAGE 3 - QUESTION LIST (Filtered by Python AI) */}
        {selectedCategory && (
          <div className="grid gap-4">
            {displayProblems.map((prob, index) => (
              <motion.div
                key={prob.problemId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/ide/${prob.problemId}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800 cursor-pointer flex justify-between items-center group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-gray-500 border border-zinc-800 group-hover:text-cyan-500 group-hover:border-cyan-500 transition-all">
                    <Code size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-200 group-hover:text-cyan-500 transition-colors">{prob.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{prob.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold border ${
                      prob.difficulty === "Easy" ? "border-green-500/30 text-green-500" :
                      prob.difficulty === "Medium" ? "border-yellow-500/30 text-yellow-500" : "border-red-500/30 text-red-500"
                    }`}>
                    {prob.difficulty}
                  </span>
                </div>
              </motion.div>
            ))}
            {displayProblems.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-500">No questions found via AI Search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicList;