"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return;
      const x = e.clientX;
      const y = e.clientY;
      
      // Update main spotlight
      spotlightRef.current.style.setProperty("--mouse-x", `${x}px`);
      spotlightRef.current.style.setProperty("--mouse-y", `${y}px`);

      // Throttle trail dot creation slightly to prevent DOM overload
      const now = Date.now();
      if (now - lastTime > 30) {
        lastTime = now;
        const trailContainer = document.getElementById("trail-container");
        if (trailContainer) {
          const dot = document.createElement("div");
          dot.className = "mouse-trail-dot";
          dot.style.left = `${x}px`;
          dot.style.top = `${y}px`;
          trailContainer.appendChild(dot);
          
          setTimeout(() => {
            if (dot.parentNode) dot.parentNode.removeChild(dot);
          }, 800);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const err = await loginAction(username, password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030303] text-zinc-300 font-sans px-4">
      {/* CSS for mouse trail */}
      <style dangerouslySetInnerHTML={{__html: `
        .mouse-trail-dot {
          position: fixed;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 60%);
          pointer-events: none;
          transform: translate(-50%, -50%) scale(1);
          animation: fadeTrail 0.8s forwards ease-out;
          z-index: 1;
        }
        @keyframes fadeTrail {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.1); }
        }
      `}} />
      
      {/* Container for trail dots */}
      <div id="trail-container" className="fixed inset-0 z-0 pointer-events-none"></div>

      {/* Interactive Spotlight Background */}
      <div 
        ref={spotlightRef}
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 185, 129, 0.15), transparent 40%)"
        }}
      />
      
      {/* Subtle Noise Texture */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="relative z-10 w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-700 ease-out">
        
        {/* Glow behind the card */}
        <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-b from-emerald-500/20 to-transparent opacity-50 blur-xl"></div>
        
        <div className="backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/5 p-10 rounded-[24px] shadow-2xl relative">
          
          {/* Top highlight line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/5 shadow-inner mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-sm"></div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-400 relative z-10">
                <path d="M12 2L2 7l10 5 10-5-10-5Z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your workspace</p>
          </div>
          
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-400">Username</label>
              <input
                type="text"
                className="w-full bg-[#111] border border-white/5 text-zinc-100 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-400">Password</label>
              <input
                type="password"
                className="w-full bg-[#111] border border-white/5 text-zinc-100 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            
            {error && (
              <div className="mt-2 text-[13px] text-red-400 text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            
            <button 
              onClick={submit} 
              disabled={!username || !password || loading}
              className="mt-4 w-full bg-white hover:bg-zinc-100 text-zinc-950 font-medium rounded-xl px-4 py-3 text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
        
        <p className="text-center text-zinc-600 text-[11px] mt-8 font-medium tracking-wide uppercase">
          &copy; {new Date().getFullYear()} Silaa Collective
        </p>
      </div>
    </main>
  );
}
