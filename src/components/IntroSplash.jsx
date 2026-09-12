import { useEffect, useState } from 'react';
import { Satellite } from 'lucide-react';

const DISPLAY_MS = 2600;
const EXIT_MS = 550;

/**
 * First-load splash: a pure-CSS rotating wireframe globe + radar sweep,
 * shown once per browser tab (gated by sessionStorage in App.jsx) while the
 * live job feed connects in the background. Click-to-skip so it never
 * blocks anyone in a hurry.
 */
export default function IntroSplash({ onFinish }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!exiting) return undefined;
    const t = setTimeout(onFinish, EXIT_MS);
    return () => clearTimeout(t);
  }, [exiting, onFinish]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
      onClick={() => setExiting(true)}
      onKeyDown={(e) => e.key === 'Enter' && setExiting(true)}
      className={`fixed inset-0 z-[3000] flex cursor-pointer flex-col items-center justify-center gap-8 bg-radar-bg transition-all duration-500 ease-out ${
        exiting ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      }`}
    >
      <div className="asr-aurora" />

      <div className="asr-globe-wrap">
        <div className="asr-globe-halo" />
        <div className="asr-radar-sweep" />
        <div className="asr-globe">
          <div className="asr-globe-core" />
          <div className="asr-meridian" style={{ animationDelay: '0s' }} />
          <div className="asr-meridian" style={{ animationDelay: '-0.9s' }} />
          <div className="asr-meridian" style={{ animationDelay: '-1.8s' }} />
          <div className="asr-meridian" style={{ animationDelay: '-2.7s' }} />
          <div className="asr-latitude" style={{ top: '16%', height: '26%' }} />
          <div className="asr-equator" />
          <div className="asr-latitude" style={{ bottom: '16%', height: '26%' }} />
          <div className="asr-pin" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-radar-muted">
          <Satellite size={14} className="text-radar-accent" />
          <span className="font-display text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-radar-accent via-cyan-200 to-radar-accent2">
            Ahmedabad Startup Radar
          </span>
        </div>
        <p className="text-xs text-radar-muted">
          <span className="inline-block animate-pulse">Scanning live job signals across the city…</span>
        </p>
        <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-radar-border">
          <div className="h-full w-1/3 animate-[loadBar_1.3s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-radar-accent to-radar-accent2" />
        </div>
        <p className="mt-2 text-[10px] text-radar-muted/70">Click anywhere to skip</p>
      </div>

      <style>{`
        @keyframes loadBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(340%); }
        }
      `}</style>
    </div>
  );
}
