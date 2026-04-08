import React, { useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import io from 'socket.io-client';
import { Camera, CheckCircle, Loader } from 'lucide-react';

// Pure .env variable (Ensure VITE_AI_URL has your IP, e.g., http://172.16.52.107:8000)
const AI_URL = import.meta.env.VITE_AI_URL; 

const Lens = () => {
  const { problemId } = useParams();
  const webcamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, analyzing, sent

  const captureAndSend = useCallback(() => {
    if (!webcamRef.current) return;
    
    // 1. Snapshot click karo
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setStatus('analyzing');

    // 2. Socket connect karo
    const socket = io(AI_URL, { path: "/ws/socket.io" });
    
    // 🚨 BUG FIX: Wait for connection to establish before emitting!
    socket.on("connect", () => {
      console.log("Socket connected, sending frame...");
      
      socket.emit("lens_frame", {
        frame: imageSrc,
        problemId: problemId
      });

      // 3. Image successfully bhejne ke 2 second baad UI update aur disconnect
      setTimeout(() => {
        setStatus('sent');
        socket.disconnect();
      }, 2000);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err);
      setStatus('idle');
      alert("Backend se connect nahi ho paaya! Check IP in .env");
    });

  }, [problemId]);

  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-0 w-full h-16 bg-zinc-950 border-b border-zinc-900 flex items-center justify-center z-10 shadow-lg">
        <h1 className="text-xl font-black italic tracking-widest text-cyan-400">SUTRA LENS</h1>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative w-[90%] max-w-md aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden border-2 border-zinc-800 shadow-[0_0_30px_rgba(0,190,255,0.15)] mt-10">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "environment" }} // Back camera use karega
          className="w-full h-full object-cover"
        />
        
        {/* Scanning Overlay Effect */}
        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-[2rem] pointer-events-none"></div>
        {status === 'analyzing' && (
          <div className="absolute inset-0 bg-cyan-500/20 animate-pulse pointer-events-none flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader size={48} className="animate-spin text-cyan-400 mb-4" />
            <p className="font-bold tracking-widest uppercase text-sm text-cyan-400">Sending to Laptop...</p>
          </div>
        )}
        {status === 'sent' && (
          <div className="absolute inset-0 bg-green-500/80 pointer-events-none flex flex-col items-center justify-center backdrop-blur-sm">
            <CheckCircle size={56} className="text-white mb-4" />
            <p className="font-black tracking-widest uppercase text-lg text-white">Analyzed!</p>
            <p className="text-xs font-bold text-white/80 mt-2 uppercase tracking-wider">Check your Laptop Screen</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mt-8 text-center px-8">
        Point at your code/notes, keep it steady, and tap analyze.
      </p>

      {/* Big Action Button */}
      <div className="absolute bottom-10 w-full flex justify-center z-10">
        <button 
          onClick={captureAndSend}
          disabled={status !== 'idle'}
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg tracking-widest uppercase transition-all transform active:scale-95 shadow-2xl ${
            status === 'idle' 
              ? 'bg-cyan-500 text-black shadow-cyan-500/50 hover:bg-cyan-400' 
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          <Camera size={24} />
          {status === 'idle' ? 'Analyze Code' : 'Done'}
        </button>
      </div>

    </div>
  );
};

export default Lens;