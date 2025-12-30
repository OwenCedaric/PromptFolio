
import React, { useEffect, useRef, useState } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
}

const SnowEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // 监听主题变化，以便实时更新 Canvas 样式和绘制颜色
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Snowflake[] = [];
    const particleCount = 100;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          speed: Math.random() * 1 + 0.5,
          wind: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentIsDark = document.documentElement.classList.contains('dark');
      // 深色模式使用纯白雪花，浅色模式使用略带灰蓝色的雪花
      ctx.fillStyle = currentIsDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.5)';

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.y += p.speed;
        p.x += p.wind;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-1000"
      style={{ 
        // 关键修复：screen 模式在白色背景上不可见，浅色模式切换为 multiply 或 normal
        mixBlendMode: isDarkMode ? 'screen' : 'multiply' 
      }}
    />
  );
};

export default SnowEffect;
