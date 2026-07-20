import React, { useEffect, useRef } from 'react';
import { demonTheme } from '../theme/tokens';

export const KineticGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Grid configuration
    const spacing = 40;
    const points: { x: number; y: number; base_y: number; angle: number }[] = [];

    // Initialize points
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        points.push({
          x,
          y,
          base_y: y,
          angle: (x * 0.05) + (y * 0.05)
        });
      }
    }

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);
      
      // Draw a subtle dark gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, demonTheme.colors.background);
      gradient.addColorStop(1, '#050505');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      time += 0.02;

      ctx.strokeStyle = demonTheme.colors.border;
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      points.forEach(p => {
        // Apply a wave motion to the points
        p.y = p.base_y + Math.sin(p.angle + time) * 10;
        
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      });
      ctx.stroke();
    };
    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: -2,
        pointerEvents: 'none'
      }} 
    />
  );
};
