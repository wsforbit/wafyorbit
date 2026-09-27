"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface OrbitPreloaderProps {
  onComplete?: () => void;
}

export function OrbitPreloader({ onComplete }: OrbitPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Start progress bar animation immediately
    const startTimer = setTimeout(() => {
      setProgress(100);
    }, 40);

    // After 3 seconds (3000ms), initiate smooth exit reveal
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    // After fade-out transition finishes (700ms), unmount preloader completely
    const unmountTimer = setTimeout(() => {
      setIsMounted(false);
    }, 3700);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  if (!isMounted) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        backgroundColor: "#ffffff",
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? "scale(1.05)" : "scale(1)",
        pointerEvents: isFadingOut ? "none" : "auto",
        transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Subtle radial lighting for high-end depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />

      {/* Main Orbit Stage */}
      <div className="relative flex items-center justify-center size-72 sm:size-80">
        {/* Outermost Dashed Orbital Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-amber-300/60 animate-orbit-spin-slow">
          {/* Revolving Golden Satellite Dot */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3.5 rounded-full bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.85)] border-2 border-white" />
        </div>

        {/* Middle Smooth Counter-Rotating Orbit Ring */}
        <div className="absolute inset-7 sm:inset-8 rounded-full border border-slate-200/90 animate-orbit-spin-reverse">
          {/* Revolving Minor Academic Node */}
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-2.5 rounded-full bg-slate-700 shadow-sm border border-white" />
        </div>

        {/* Expanding Pulse Wave */}
        <div className="absolute inset-12 sm:inset-14 rounded-full border border-amber-400/40 animate-orbit-ripple pointer-events-none" />

        {/* Center Circular Logo Disc */}
        <div className="relative z-10 size-32 sm:size-36 rounded-full bg-white border border-amber-200/70 p-3 shadow-[0_12px_36px_-6px_rgba(245,158,11,0.28),0_4px_12px_rgba(0,0,0,0.04)] flex items-center justify-center animate-orbit-pulse overflow-hidden">
          <Image
            src="/orbitlogo.png"
            alt="Wafy Orbit Logo"
            width={128}
            height={128}
            className="size-full object-contain rounded-full"
            priority
          />
        </div>
      </div>

      {/* Brand Title & 3-Second Progress Bar */}
      <div className="mt-8 flex flex-col items-center text-center space-y-3 z-10">
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.25em] text-slate-900 uppercase">
          Wafy Orbit
        </h1>

        {/* 3-Second Precision Progress Indicator */}
        <div className="w-52 sm:w-60 h-1 bg-slate-100 rounded-full overflow-hidden mt-3 relative border border-slate-200/40">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-[3000ms] ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
