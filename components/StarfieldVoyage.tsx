"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function StarfieldVoyage() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate deterministic star coordinates on mount to avoid hydration mismatch
    const generatedStars: Star[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.8, // 0.8px to 2.6px
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3, // 3s to 7s twinkle duration
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none bg-[#050811]">
      {/* Stars Layer */}
      <div className="absolute inset-0 w-full h-full opacity-50">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              boxShadow: star.size > 2 ? "0 0 6px rgba(255, 255, 255, 0.7)" : "none",
            }}
          />
        ))}
      </div>

      {/* Cyber Nautical Navigation Grid */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        style={{
          backgroundImage: `
            radial-gradient(circle, #f0a500 1px, transparent 1px),
            linear-gradient(to right, rgba(35, 53, 94, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(35, 53, 94, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 40px 40px, 40px 40px",
          backgroundPosition: "0 0, 20px 20px, 20px 20px"
        }}
      />

      {/* Dynamic Animated Voyage Path Layer */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        {/* Constellation / Route Path 1 (Primary gold voyage) */}
        <motion.path
          d="M -50 200 C 150 120, 250 420, 500 320 C 750 220, 950 520, 1500 400"
          fill="none"
          stroke="#f0a500"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "loop" }}
        />

        {/* Constellation / Route Path 2 (Secondary rust scan) */}
        <motion.path
          d="M 100 600 Q 400 350, 800 550 T 1500 450"
          fill="none"
          stroke="#c0392b"
          strokeWidth="0.8"
          strokeDasharray="3 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 25, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        />

        {/* Voyage Submarine / Cursor Beacon 1 */}
        <motion.g
          initial={{ x: -50, y: 200 }}
          animate={{
            x: [-50, 200, 500, 750, 1500],
            y: [200, 120, 320, 220, 400],
          }}
          transition={{
            duration: 35,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Beacon pulse circles */}
          <circle r="12" fill="none" stroke="#f0a500" strokeWidth="0.5" className="animate-ping" style={{ transformOrigin: "center" }} />
          <circle r="4" fill="#f0a500" />
          <circle r="1.5" fill="#fff" />
          
          <line x1="0" y1="0" x2="20" y2="-20" stroke="#f0a500" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
          <text x="24" y="-20" fill="#f0a500" fontSize="7" fontFamily="monospace" opacity="0.6">
            VOYAGE_MATE
          </text>
        </motion.g>

        {/* Voyage Submarine / Cursor Beacon 2 (Secondary scanner) */}
        <motion.g
          initial={{ x: 100, y: 600 }}
          animate={{
            x: [100, 400, 800, 1500],
            y: [600, 430, 550, 450],
          }}
          transition={{
            duration: 45,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <circle r="16" fill="none" stroke="#c0392b" strokeWidth="0.5" className="animate-pulse" />
          <circle r="3.5" fill="#c0392b" />
          <text x="8" y="4" fill="#c0392b" fontSize="7" fontFamily="monospace" opacity="0.5">
            SONAR_S28
          </text>
        </motion.g>
      </svg>

      {/* Decorative Compass Roses in background */}
      <div className="absolute top-[12%] right-[8%] opacity-[0.035] w-36 h-36 border border-gold rounded-full flex items-center justify-center animate-spin-slow">
        <div className="w-full h-[1px] bg-gold absolute" />
        <div className="h-full w-[1px] bg-gold absolute" />
        <div className="w-2/3 h-2/3 border border-dashed border-gold rounded-full" />
      </div>
      <div className="absolute bottom-[10%] left-[4%] opacity-[0.025] w-48 h-48 border border-gold rounded-full flex items-center justify-center animate-spin-reverse-slow">
        <div className="w-full h-[1px] bg-gold absolute" style={{ transform: "rotate(45deg)" }} />
        <div className="w-full h-[1px] bg-gold absolute" style={{ transform: "rotate(-45deg)" }} />
        <div className="w-4/5 h-4/5 border border-dashed border-gold rounded-full" />
      </div>
    </div>
  );
}
