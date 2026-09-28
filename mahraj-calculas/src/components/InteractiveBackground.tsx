import React, { useEffect, useRef } from 'react';

interface InteractiveBackgroundProps {
  themeHex?: string;
  themeTint?: string;
}

export function InteractiveBackground({ themeHex = '#22d3ee', themeTint = 'cyan' }: InteractiveBackgroundProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const secondarySpotlightRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 300 });
  const spotlightPos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 300 });
  const secondaryPos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 300 });
  const isMoving = useRef(true);
  const lastMoveTime = useRef(Date.now());

  useEffect(() => {
    // Detect low-end device to disable heavy CSS filters and throttle RAF
    const isTouchOnly = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      lastMoveTime.current = Date.now();
      isMoving.current = true;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isTabVisible) {
        // Sleep when mouse has been stationary for over 1.5s to preserve CPU/battery on low-end devices
        const timeSinceMove = Date.now() - lastMoveTime.current;
        if (timeSinceMove < 2000) {
          const dx = mousePos.current.x - spotlightPos.current.x;
          const dy = mousePos.current.y - spotlightPos.current.y;

          // Only compute and apply transform if movement difference is noticeable (> 0.2px)
          if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
            spotlightPos.current.x += dx * 0.08;
            spotlightPos.current.y += dy * 0.08;

            if (spotlightRef.current) {
              spotlightRef.current.style.transform = `translate3d(${spotlightPos.current.x}px, ${spotlightPos.current.y}px, 0) translate(-50%, -50%)`;
            }
          }

          if (!isTouchOnly) {
            const sDx = mousePos.current.x - secondaryPos.current.x;
            const sDy = mousePos.current.y - secondaryPos.current.y;
            if (Math.abs(sDx) > 0.2 || Math.abs(sDy) > 0.2) {
              secondaryPos.current.x += sDx * 0.04;
              secondaryPos.current.y += sDy * 0.04;

              if (secondarySpotlightRef.current) {
                secondarySpotlightRef.current.style.transform = `translate3d(${secondaryPos.current.x}px, ${secondaryPos.current.y}px, 0) translate(-50%, -50%)`;
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none contain-strict">
      {/* 1. Static Ambient Multi-Color Glow Orbs (Soft pre-calculated radial gradients with zero GPU overhead) */}
      {/* Top-Right Cyan/Teal Ambient Orb */}
      <div 
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.4) 0%, rgba(20, 184, 166, 0.15) 35%, rgba(6, 182, 212, 0.05) 55%, transparent 70%)'
        }}
      />

      {/* Bottom-Left Purple/Violet Ambient Orb */}
      <div 
        className="absolute -bottom-36 -left-36 w-[550px] h-[550px] rounded-full opacity-35 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.35) 0%, rgba(99, 102, 241, 0.15) 40%, transparent 70%)'
        }}
      />

      {/* Center-Right Deep Indigo/Blue Ambient Orb */}
      <div 
        className="absolute top-1/2 -right-32 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-25 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.1) 45%, transparent 70%)'
        }}
      />

      {/* 2. Interactive Cursor-Moving Colorful Spotlights */}
      {/* Secondary trailing aura (Magenta / Indigo / Purple glow trailing the cursor) */}
      <div
        ref={secondarySpotlightRef}
        className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full opacity-35 pointer-events-none transform-gpu"
        style={{
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, rgba(79, 70, 229, 0.12) 40%, transparent 65%)',
          willChange: 'transform'
        }}
      />

      {/* Primary cursor-following spotlight (Dynamic Theme + Cyan/Neon vibrant spotlight) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[450px] h-[450px] rounded-full opacity-45 pointer-events-none transform-gpu"
        style={{
          background: `radial-gradient(circle at center, ${themeHex}55 0%, rgba(6, 182, 212, 0.2) 35%, rgba(16, 185, 129, 0.05) 55%, transparent 70%)`,
          willChange: 'transform'
        }}
      />

      {/* High-Tech Grid Mesh Pattern (Catches the moving light) */}
      <div 
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />
    </div>
  );
}
