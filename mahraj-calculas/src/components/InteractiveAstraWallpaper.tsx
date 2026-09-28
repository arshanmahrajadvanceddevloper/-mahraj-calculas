import React, { useEffect, useRef } from 'react';

interface InteractiveAstraWallpaperProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseAngle: number;
}

export function InteractiveAstraWallpaper({ 
  className = '', 
  particleCount = 55, 
  interactive = true 
}: InteractiveAstraWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isMounted = true;

    const getSafeWidth = () => Math.max(300, canvas.parentElement?.clientWidth || window.innerWidth || 360);
    const getSafeHeight = () => Math.max(400, canvas.parentElement?.clientHeight || window.innerHeight || 640);

    let width = (canvas.width = getSafeWidth());
    let height = (canvas.height = getSafeHeight());

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovering: true,
      radius: 160
    };

    // Dynamic Astra 6 Glowing Color Palette
    const colorPalette = [
      'rgba(34, 211, 238,',   // Cyan
      'rgba(99, 102, 241,',   // Indigo / Electric Blue
      'rgba(168, 85, 247,',   // Purple / Violet
      'rgba(236, 72, 153,',   // Pink / Magenta
      'rgba(52, 211, 153,',   // Emerald / Mint
      'rgba(251, 191, 36,',   // Solar Gold
    ];

    const particles: Particle[] = [];
    const count = Math.min(particleCount, 60);

    for (let i = 0; i < count; i++) {
      const baseRadius = Math.random() * 2 + 0.8;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: baseRadius,
        baseRadius,
        color,
        alpha: Math.random() * 0.5 + 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseAngle: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas || !isMounted) return;
      width = canvas.width = getSafeWidth();
      height = canvas.height = getSafeHeight();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
        mouse.targetX = clientX;
        mouse.targetY = clientY;
        mouse.isHovering = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvas || e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX - rect.left;
      const clientY = e.touches[0].clientY - rect.top;
      if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
        mouse.targetX = clientX;
        mouse.targetY = clientY;
        mouse.isHovering = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let time = 0;

    const render = () => {
      if (!isMounted) return;
      try {
        time += 0.015;

        // Smooth cursor interpolation with NaN protection
        if (Number.isFinite(mouse.targetX) && Number.isFinite(mouse.targetY)) {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }

        const mx = Number.isFinite(mouse.x) ? mouse.x : width / 2;
        const my = Number.isFinite(mouse.y) ? mouse.y : height / 2;

        ctx.clearRect(0, 0, width, height);

        // 1. Draw Astra 6 Glowing Cursor Core & Nebula Fluid Field
        if (mouse.isHovering && width > 50 && height > 50) {
          try {
            // Outer Astra Nebula Flare
            const outerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 240);
            outerGlow.addColorStop(0, 'rgba(34, 211, 238, 0.12)');
            outerGlow.addColorStop(0.35, 'rgba(147, 51, 234, 0.07)');
            outerGlow.addColorStop(0.7, 'rgba(59, 130, 246, 0.02)');
            outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(mx, my, 240, 0, Math.PI * 2);
            ctx.fill();

            // Inner Astra Core Pulsar
            const coreGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 50);
            coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            coreGlow.addColorStop(0.4, 'rgba(34, 211, 238, 0.16)');
            coreGlow.addColorStop(0.8, 'rgba(168, 85, 247, 0.04)');
            coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(mx, my, 50, 0, Math.PI * 2);
            ctx.fill();

            // Orbital Ring
            ctx.save();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.arc(mx, my, 38 + Math.sin(time * 2) * 2.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          } catch (_) {}
        }

        // 2. Update & Connect Particles with Astra Constellation Lines
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];

          p1.pulseAngle += p1.pulseSpeed;
          p1.radius = Math.max(0.5, p1.baseRadius + Math.sin(p1.pulseAngle) * 0.5);
          p1.x += p1.vx;
          p1.y += p1.vy;

          if (interactive) {
            const dx = mx - p1.x;
            const dy = my - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 1) {
              const force = (1 - dist / mouse.radius) * 0.025;
              p1.vx += (dx / dist) * force * 1.2 - (dy / dist) * force * 0.5;
              p1.vy += (dy / dist) * force * 1.2 + (dx / dist) * force * 0.5;
              p1.alpha = Math.min(0.85, p1.alpha + 0.015);
            } else {
              p1.alpha = Math.max(0.2, p1.alpha - 0.005);
            }
          }

          p1.vx *= 0.985;
          p1.vy *= 0.985;

          if (p1.x < -15) p1.x = width + 15;
          if (p1.x > width + 15) p1.x = -15;
          if (p1.y < -15) p1.y = height + 15;
          if (p1.y > height + 15) p1.y = -15;

          // Constellation Web Lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const cdx = p1.x - p2.x;
            const cdy = p1.y - p2.y;
            const cDist = Math.sqrt(cdx * cdx + cdy * cdy);

            if (cDist < 85) {
              const lineAlpha = (1 - cDist / 85) * 0.16;
              ctx.strokeStyle = `rgba(34, 211, 238, ${lineAlpha})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          // Beam to cursor
          const mdx = mx - p1.x;
          const mdy = my - p1.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 100) {
            const beamAlpha = (1 - mDist / 100) * 0.22;
            ctx.strokeStyle = `rgba(168, 85, 247, ${beamAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }

          // Draw Particle Node
          ctx.fillStyle = `${p1.color}${p1.alpha})`;
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, Math.max(0.4, p1.radius), 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (_) {}

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, interactive]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85"
      />
    </div>
  );
}
