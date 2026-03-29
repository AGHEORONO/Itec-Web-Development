import Link from 'next/link';
import { ArrowRight, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Glow similar cu imaginea atașată */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Top Badge: </> iTECify Web Development */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[11px] font-medium text-white/80 mb-8 backdrop-blur-sm shadow-sm select-none">
        <span className="text-blue-500 font-bold">{"</>"}</span>
        <span>iTECify Web Development</span>
      </div>

      {/* Main Typography: Code Together, Smarter & Faster. */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-center tracking-tight leading-tight mb-6 z-10 select-none">
        <span className="text-white">Code Together,</span>
        <br />
        <span className="bg-gradient-to-r from-[#4facfe] to-[#ab3cff] bg-clip-text text-transparent">
          Smarter & Faster.
        </span>
      </h1>

      {/* Subtitle / Description */}
      <p className="max-w-xl text-center text-gray-400 text-sm md:text-[15px] leading-relaxed mb-10 z-10 font-medium px-4">
        The ultimate platform for team collaboration. Real-time code editing, integrated artificial intelligence, and secure execution, designed for victory.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
        <Link 
          href="/editor" 
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 active:scale-95"
        >
          Open Workspace <ArrowRight className="w-4 h-4" />
        </Link>
        <button 
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[13px] font-bold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95"
        >
          Learn More
        </button>
      </div>

      {/* Bottom Left Logo Circle (N / Iconita) */}
      <div className="absolute bottom-6 left-6 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-lg select-none">
        <Code2 className="w-4 h-4 text-white/70" />
      </div>
    </div>
  );
}
