import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import data from "./data/courses.json";
import { useParams } from "react-router-dom";
import { useState } from "react";

function Home() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("user");

  const handleTraining = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/courses");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 border-b border-gray-800">
        <h1 
          className="text-2xl font-bold text-cyan-400 cursor-pointer"
          onClick={() => navigate("/")}
        >
          Sutra AI
        </h1>

        <button 
          onClick={() => navigate("/login")}
          className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 transition rounded-lg font-semibold"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center mt-32 px-6">
        
        <h2 className="text-5xl font-bold leading-tight">
          Master Coding with <span className="text-cyan-400">AI Guidance</span>
        </h2>

        <p className="text-gray-400 mt-6 max-w-xl">
          Practice DSA, Python and C with AI hints and smart analytics.
        </p>

        <button 
          onClick={handleTraining}
          className="mt-8 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 transition rounded-xl text-lg font-semibold shadow-lg shadow-cyan-500/30"
        >
          Start Master Training
        </button>

      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("user", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
      <div className="bg-[#1e293b] p-10 rounded-2xl w-96 shadow-xl">

        <h2 className="text-3xl font-bold mb-6 text-center text-cyan-400">
          Login to Sutra AI
        </h2>

        <input 
          type="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 rounded-lg bg-[#0f172a] border border-gray-700 focus:outline-none"
        />

        <input 
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-4 py-2 rounded-lg bg-[#0f172a] border border-gray-700 focus:outline-none"
        />

        <button 
          onClick={handleLogin}
          className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 transition rounded-lg font-semibold"
        >
          Login
        </button>

      </div>
    </div>
  );
}



function Courses() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Courses
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {data.courses.map((course) => (
          <div 
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
            className="bg-[#1e293b] p-6 rounded-xl hover:scale-105 transition cursor-pointer shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-2">
              {course.title}
            </h2>
            <p className="text-gray-400">
              {course.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}




function Category() {
  const { id } = useParams();
  const navigate = useNavigate();   // ✅ must be inside

  const course = data.courses.find((c) => c.id === id);

  if (!course) {
    return (
      <div className="min-h-screen bg-red-900 text-white p-10">
        Course Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        {course.title} Categories
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {course.categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() =>
              navigate(`/courses/${id}/${cat.name.toLowerCase()}`)
            }
            className="bg-[#1e293b] p-6 rounded-xl hover:scale-105 transition cursor-pointer shadow-lg"
          >
            <h2 className="text-2xl font-semibold">{cat.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}


function Questions() {
  const [filter, setFilter] = useState("all");
  const { id, category } = useParams();
  const navigate = useNavigate();
  const course = data.courses.find((c) => c.id === id);
  const selectedCategory = course?.categories.find(
    (cat) => cat.name.toLowerCase() === category
  );

  if (!selectedCategory) {
    return <div className="text-white p-10">Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        {selectedCategory.name} Questions
      </h1>
      <div className="mb-6 flex gap-4">
        <button 
          onClick={() => setFilter("all")}
          className="px-4 py-2 bg-gray-700 rounded-lg"
        >
          All
        </button>

        <button 
          onClick={() => setFilter("solved")}
          className="px-4 py-2 bg-green-600 rounded-lg"
        >
          Solved
        </button>

        <button 
          onClick={() => setFilter("unsolved")}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          Unsolved
        </button>
      </div>

      {selectedCategory.questions
        .filter((q) => {
          const solved = localStorage.getItem(`solved-${q.id}`);

          if (filter === "solved") return solved;
          if (filter === "unsolved") return !solved;
          return true;
        })
        .map((q) => {
          const solved = localStorage.getItem(`solved-${q.id}`);

          return (
            <div
              key={q.id}
              onClick={() =>
                navigate(`/courses/${id}/${category}/${q.id}`)
              }
              className="bg-[#1e293b] p-4 mb-4 rounded-lg shadow-md cursor-pointer hover:scale-105 transition"
            >
              <h2 className="text-xl font-semibold">
                {q.title}
              </h2>

              <p
                className={`font-semibold ${
                  q.level === "Easy"
                    ? "text-green-400"
                    : q.level === "Medium"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                Level: {q.level}
              </p>


              {solved && (
                <span className="text-green-400 text-sm">
                  Solved ✅
                </span>
              )}
            </div>
          );
        })}


    </div>
  );
}
function IDE() {
  const navigate = useNavigate();
  const { id, category, questionId } = useParams();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const handleRun = () => {
    if (code.trim() === "") {
      setOutput("❌ Error: No code written");
    } else {
      setOutput("✅ Test Case Passed");
    }
  };

  const handleSubmit = () => {
    if (code.trim() === "") {
      setOutput("❌ Cannot submit empty code");
      return;
    }

    localStorage.setItem(`solved-${questionId}`, "true");

    const today = new Date().toISOString().split("T")[0];

    let streakData = JSON.parse(localStorage.getItem("streak")) || [];

    if (!streakData.includes(today)) {
      streakData.push(today);
      localStorage.setItem("streak", JSON.stringify(streakData));
}

    setOutput("🎉 Submitted Successfully");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex">

      {/* LEFT SIDE - QUESTION */}
      <div className="w-1/2 p-10 border-r border-gray-800 overflow-y-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-cyan-400 mb-4">
          Question {questionId}
        </h1>

        <p className="text-gray-400 leading-relaxed">
          This is where the real problem description will appear.
          Later we will load this dynamically from JSON.
        </p>

      </div>

      {/* RIGHT SIDE - IDE */}
      <div className="w-1/2 p-10 flex flex-col">

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-64 bg-[#1e293b] p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Write your code here..."
        />

        {/* Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleRun}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition font-semibold"
          >
            Run
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition font-semibold"
          >
            Submit
          </button>
        </div>

        {/* Output Section */}
        {output && (
          <div className="mt-6 p-4 bg-[#1e293b] rounded-lg text-gray-300">
            {output}
          </div>
        )}

      </div>
    </div>
  );
}

function Dashboard() {
  const streakData = JSON.parse(localStorage.getItem("streak")) || [];
  const daysInMonth = 30;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Dashboard
      </h1>

      {/* Streak Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">🔥 Streak</h2>

        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date();
            date.setDate(i + 1);
            const formatted = date.toISOString().split("T")[0];

            const solved = streakData.includes(formatted);

            return (
              <div
                key={i}
                className={`h-6 w-6 rounded ${
                  solved ? "bg-cyan-400" : "bg-gray-700"
                }`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Graph Placeholder */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          📊 Progress Overview
        </h2>

        <div className="h-40 bg-[#1e293b] rounded-lg flex items-center justify-center">
          Graph will appear here
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          🏆 Achievements
        </h2>

        <div className="flex gap-6">
          <div className="bg-[#1e293b] p-4 rounded-lg">
            No AI Used Badge
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg">
            7 Day Streak
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg">
            Python Master
          </div>
        </div>
      </div>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<Category />} />
      <Route path="/courses/:id/:category" element={<Questions />} />
      <Route path="/courses/:id/:category/:questionId" element={<IDE />} />
    </Routes>
  </BrowserRouter>
  );
}

export default App;

