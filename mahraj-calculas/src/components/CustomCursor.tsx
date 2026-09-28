import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  themeHex?: string;
  themeRgb?: string;
  enabled?: boolean;
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  type: 'star' | 'diamond' | 'glimmer';
}

export function CustomCursor({ 
  themeHex = '#a3e635', 
  themeRgb = 'rgba(163, 230, 53, 0.2)',
  enabled = true 
}: CustomCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Position state tracked with refs for 60fps/120fps animation without React re-renders
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const trailPos = useRef({ x: -100, y: -100 });
  const lastSparklePos = useRef({ x: -100, y: -100 });
  
  const isHoveredRef = useRef(false);
  const isClickedRef = useRef(false);
  const isVisibleRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Particle pool for sparkles
  const sparklesRef = useRef<SparkleParticle[]>([]);

  useEffect(() => {
    // Detect if device only has touch screen (mobile/tablet) to disable custom cursor
    if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
      setIsTouchDevice(true);
      return;
    }

    if (!enabled) {
      document.documentElement.classList.remove('custom-cursor-active');
      return;
    }

    // Hide Windows default cursor and show custom futuristic tracking cursor
    document.documentElement.classList.add('custom-cursor-active');

    const canvas = canvasRef.current;
    let ctx = canvas ? canvas.getContext('2d') : null;

    const resizeCanvas = () => {
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const sparkleColors = [
      themeHex,
      '#ffffff',
      '#fef08a', // warm star yellow
      '#67e8f9', // diamond cyan
      themeHex
    ];

    const spawnSparkles = (x: number, y: number, count: number = 1, burst: boolean = false) => {
      if (sparklesRef.current.length > 80) return; // Prevent excessive particle load

      for (let i = 0; i < count; i++) {
        const angle = burst ? Math.random() * Math.PI * 2 : Math.random() * Math.PI * 2;
        const speed = burst ? 1.5 + Math.random() * 3.5 : 0.3 + Math.random() * 1.5;
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
        const types: Array<'star' | 'diamond' | 'glimmer'> = ['star', 'diamond', 'glimmer'];
        const type = types[Math.floor(Math.random() * types.length)];
        const size = burst ? 4 + Math.random() * 5 : 3 + Math.random() * 4;

        sparklesRef.current.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (burst ? 0.5 : 0.2), // slight float up
          size,
          maxSize: size,
          alpha: 1,
          decay: 0.025 + Math.random() * 0.035, // lasts ~0.5s
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          color,
          type
        });
      }
    };

    let lastHoverCheck = 0;
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        ringPos.current = { x: e.clientX, y: e.clientY };
        trailPos.current = { x: e.clientX, y: e.clientY };
        lastSparklePos.current = { x: e.clientX, y: e.clientY };
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
        if (trailRef.current) trailRef.current.style.opacity = '0.5';
      }

      // Sparkle emission while moving
      const dist = Math.hypot(e.clientX - lastSparklePos.current.x, e.clientY - lastSparklePos.current.y);
      if (dist > 8) {
        lastSparklePos.current = { x: e.clientX, y: e.clientY };
        // Emit 1-2 sparkles along trail
        spawnSparkles(e.clientX, e.clientY, 1 + (dist > 25 ? 1 : 0));
      }

      // Throttled hover target check for buttons/interactive elements
      const now = performance.now();
      if (now - lastHoverCheck > 60) {
        lastHoverCheck = now;
        const target = e.target as HTMLElement | null;
        if (target) {
          isHoveredRef.current = Boolean(
            target.closest('button, a, input, textarea, select, [role="button"], .cursor-pointer, [data-cursor="hover"]')
          );
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isClickedRef.current = true;
      // Burst sparkles on click!
      spawnSparkles(e.clientX, e.clientY, 8, true);
    };

    const onMouseUp = () => {
      isClickedRef.current = false;
    };

    const onMouseLeave = () => {
      isVisibleRef.current = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (trailRef.current) trailRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
      if (trailRef.current) trailRef.current.style.opacity = '0.5';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Star drawing helper
    const drawStar = (c: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number, color: string, alpha: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = r * 2.5;

      c.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        c.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        const innerAngle = angle + Math.PI / 4;
        c.lineTo(Math.cos(innerAngle) * (r * 0.24), Math.sin(innerAngle) * (r * 0.24));
      }
      c.closePath();
      c.fill();

      // Bright inner core
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Diamond drawing helper
    const drawDiamond = (c: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number, color: string, alpha: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = r * 2;

      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(r * 0.6, 0);
      c.lineTo(0, r);
      c.lineTo(-r * 0.6, 0);
      c.closePath();
      c.fill();

      c.restore();
    };

    // Circular glimmer drawing helper
    const drawGlimmer = (c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) => {
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = r * 3;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Animation Loop with smooth fluid lerp physics & sparkle particle rendering
    let animationFrameId: number;

    const render = () => {
      if (isTabVisible) {
        // Render Cursor Physics
        if (isVisibleRef.current) {
          // 1. Fast instant tracking for central dot
          if (dotRef.current) {
            const dotScale = isClickedRef.current ? 0.75 : isHoveredRef.current ? 1.4 : 1;
            dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
          }

          // 2. Fluid spring/lerp trailing for outer circle ring (lerp factor 0.18 for smooth lag)
          const lerpFactor = 0.18;
          const ringDx = mousePos.current.x - ringPos.current.x;
          const ringDy = mousePos.current.y - ringPos.current.y;
          
          if (Math.abs(ringDx) > 0.1 || Math.abs(ringDy) > 0.1) {
            ringPos.current.x += ringDx * lerpFactor;
            ringPos.current.y += ringDy * lerpFactor;

            if (ringRef.current) {
              const ringScale = isClickedRef.current ? 0.75 : isHoveredRef.current ? 1.6 : 1;
              ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
            }
          }

          // 3. Echo trail circle for an extra futuristic liquid feel
          const trailLerpFactor = 0.10;
          const trailDx = mousePos.current.x - trailPos.current.x;
          const trailDy = mousePos.current.y - trailPos.current.y;

          if (Math.abs(trailDx) > 0.1 || Math.abs(trailDy) > 0.1) {
            trailPos.current.x += trailDx * trailLerpFactor;
            trailPos.current.y += trailDy * trailLerpFactor;

            if (trailRef.current) {
              trailRef.current.style.transform = `translate3d(${trailPos.current.x}px, ${trailPos.current.y}px, 0) translate(-50%, -50%) scale(${isHoveredRef.current ? 1.3 : 0.9})`;
            }
          }
        }

        // Render Sparkles Canvas
        if (canvas && ctx) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

          const list = sparklesRef.current;
          for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03; // subtle float gravity
            p.alpha -= p.decay;
            p.rotation += p.rotSpeed;

            if (p.alpha <= 0) {
              list.splice(i, 1);
              continue;
            }

            const currentSize = p.size * (p.alpha > 0.5 ? 1 : p.alpha * 1.8);
            if (p.type === 'star') {
              drawStar(ctx, p.x, p.y, currentSize, p.rotation, p.color, p.alpha);
            } else if (p.type === 'diamond') {
              drawDiamond(ctx, p.x, p.y, currentSize, p.rotation, p.color, p.alpha);
            } else {
              drawGlimmer(ctx, p.x, p.y, currentSize * 0.6, p.color, p.alpha);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, themeHex]);

  if (!enabled || isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* Sparkles Particle Trail Canvas (Zero DOM overhead, 60fps/120fps hardware accelerated) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99998]"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Main Fluid Follower Cursors */}
      <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
        {/* 1. Trailing Echo Ring (Subtle secondary fluid lag) */}
        <div
          ref={trailRef}
          className="fixed top-0 left-0 w-10 h-10 rounded-full border border-dashed transition-opacity duration-300 opacity-0 pointer-events-none"
          style={{
            borderColor: `${themeHex}33`,
            boxShadow: `0 0 15px ${themeHex}1a`,
            willChange: 'transform, opacity'
          }}
        />

        {/* 2. Primary Outer Smooth Lagging Ring */}
        <div
          ref={ringRef}
          className="fixed top-0 left-0 w-9 h-9 rounded-full border-[1.5px] transition-[opacity,border-color,background-color] duration-200 opacity-0 pointer-events-none flex items-center justify-center"
          style={{
            borderColor: `${themeHex}cc`,
            backgroundColor: `${themeHex}10`,
            boxShadow: `0 0 20px ${themeHex}4d, inset 0 0 10px ${themeHex}1a`,
            willChange: 'transform, opacity'
          }}
        />

        {/* 3. High-Precision Center Glowing Dot */}
        <div
          ref={dotRef}
          className="fixed top-0 left-0 w-2 h-2 rounded-full transition-opacity duration-150 opacity-0 pointer-events-none"
          style={{
            backgroundColor: themeHex,
            boxShadow: `0 0 10px ${themeHex}, 0 0 4px #ffffff`,
            willChange: 'transform, opacity'
          }}
        />
      </div>
    </>
  );
}
