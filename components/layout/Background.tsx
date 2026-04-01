"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

const CinematicBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);

  const bgImages = ["/background-images/main.svg"];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParticles(() => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 25; i++) {
          newParticles.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            speedX: (Math.random() - 0.5) * 0.02,
            speedY: (Math.random() - 0.5) * 0.02,
            opacity: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.7 ? '#dc2626' : Math.random() > 0.5 ? '#ffffff' : '#f97316',
          });
        }
        return newParticles;
      });

      const orbColors = ['#dc2626', '#7c3aed', '#2563eb', '#059669'];
      setOrbs(() => {
        const newOrbs: Orb[] = [];
        for (let i = 0; i < 4; i++) {
          newOrbs.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 200 + 100,
            speedX: (Math.random() - 0.5) * 0.01,
            speedY: (Math.random() - 0.5) * 0.01,
            color: orbColors[i],
          });
        }
        return newOrbs;
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let mounted = true;

    const animate = () => {
      if (!mounted) return;

      setParticles(prevParticles => {
        return prevParticles.map(p => ({
          ...p,
          x: (p.x + p.speedX + 100) % 100,
          y: (p.y + p.speedY + 100) % 100,
        }));
      });

      setOrbs(prevOrbs => {
        return prevOrbs.map(o => ({
          ...o,
          x: (o.x + o.speedX + 100) % 100,
          y: (o.y + o.speedY + 100) % 100,
        }));
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      mounted = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const parallaxX = mousePos.x * 0.02;
  const parallaxY = mousePos.y * 0.02;

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
        {bgImages.map((img) => (
          <div
            key={img}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `scale(1.1) translate(${parallaxX}%, ${parallaxY}%)`,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-linear-to-l from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]" />

        {orbs.map((orb) => (
          <div
            key={orb.id}
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: orb.size,
              height: orb.size,
              backgroundColor: orb.color,
              transform: `translate(-50%, -50%)`,
            }}
          />
        ))}

        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: particle.color === '#dc2626'
                ? `0 0 ${particle.size * 2}px rgba(220, 38, 38, 0.5)`
                : 'none',
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E')] pointer-events-none" />

        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%] pointer-events-none" />

        <div className="absolute bottom-0 left-0 w-full h-64 bg-linear-to-t from-[#0a0a0a] to-transparent" />
      </div>
    </>
  );
};

export default CinematicBackground;