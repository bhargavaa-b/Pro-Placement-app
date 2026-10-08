import React, { useEffect, useRef, useState } from 'react';
import { ThreeLlionLogo } from './ThreeLlionLogo';

interface IntroSplashAnimationProps {
  onFinish: () => void;
}

const INTRO_DURATION_MS = 2700; // Strictly 2.7 seconds to fully load (1% -> 100%)

export const IntroSplashAnimation: React.FC<IntroSplashAnimationProps> = ({
  onFinish,
}) => {
  const [progress, setProgress] = useState(1);
  const [entered, setEntered] = useState(false);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const startTime = performance.now();
    let rafId: number;

    const enterFrame = requestAnimationFrame(() => setEntered(true));

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, Math.max(0, elapsed / INTRO_DURATION_MS));
      const easedRatio = 1 - Math.pow(1 - ratio, 1.35);
      const nextPct = Math.min(100, Math.max(1, Math.round(1 + easedRatio * 99)));

      setProgress((prev) => (prev !== nextPct ? nextPct : prev));

      if (elapsed < INTRO_DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      } else if (!finishedRef.current) {
        finishedRef.current = true;
        setProgress(100);
        onFinishRef.current();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(enterFrame);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const isCompleting = progress >= 98;

  return (
    <div
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-8 select-none overflow-hidden transition-opacity duration-200 ${
        isCompleting ? 'opacity-95' : 'opacity-100'
      }`}
    >
      {/* Top Spacer */}
      <div />

      {/* Center Single-Flow Animated Brand Core with Exact Unmodified 3LLION Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-5">
        <div className="transform-gpu">
          <ThreeLlionLogo size="xl" animated />
        </div>

        {/* App Title, Animated Progress Bar & 1%–100% Counter */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 delay-100 ease-out transform-gpu ${
            entered
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0B2545]">
              Pro Placement
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#B8860B] mt-1">
              Engineering the future
            </p>
          </div>

          {/* Smooth Single-Flow Loading Line */}
          <div className="w-56 sm:w-68 h-2 bg-slate-200/90 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-2xs mt-1">
            <div
              className="h-full bg-gradient-to-r from-[#0B2545] via-[#D4AF37] to-[#0B2545] rounded-full transition-[width] duration-75 ease-linear will-change-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 1% to 100% Loading Counter Below Loading Line */}
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-[#0B2545] tracking-wider">
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Developer Credit Footer */}
      <div
        className={`relative z-10 text-xs text-slate-500 font-medium tracking-wide transition-all duration-700 delay-150 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        Developed by Bhargava B
      </div>
    </div>
  );
};
