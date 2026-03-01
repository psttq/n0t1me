import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  isActive?: boolean;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isActive = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      hue: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = isActive ? 25 : 15;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (isActive ? 1.5 : 0.5),
          vy: (Math.random() - 0.5) * (isActive ? 1.5 : 0.5),
          radius: Math.random() * 150 + 100,
          hue: Math.random() * 60 + 200, // Blue to purple range
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      
      if (isActive) {
        const time = Date.now() / 1000;
        gradient.addColorStop(0, `hsl(${210 + Math.sin(time) * 20}, 50%, 12%)`);
        gradient.addColorStop(0.5, `hsl(${230 + Math.cos(time * 0.7) * 15}, 45%, 10%)`);
        gradient.addColorStop(1, 'hsl(260, 35%, 6%)');
      } else {
        gradient.addColorStop(0, 'hsl(220, 20%, 6%)');
        gradient.addColorStop(0.5, 'hsl(240, 15%, 4%)');
        gradient.addColorStop(1, 'hsl(260, 12%, 3%)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = canvas.height + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        
        if (isActive) {
          const pulse = Math.sin(Date.now() / 500 + i) * 0.15 + 0.85;
          gradient.addColorStop(0, `hsla(${p.hue}, 60%, 60%, ${0.1 * pulse})`);
          gradient.addColorStop(0.4, `hsla(${p.hue + 30}, 50%, 50%, ${0.06 * pulse})`);
          gradient.addColorStop(1, 'transparent');
        } else {
          gradient.addColorStop(0, `hsla(${p.hue}, 40%, 50%, 0.04)`);
          gradient.addColorStop(0.4, `hsla(${p.hue + 30}, 30%, 40%, 0.02)`);
          gradient.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ filter: 'blur(60px)' }}
    />
  );
};

export default AnimatedBackground;
