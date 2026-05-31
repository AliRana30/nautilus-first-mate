"use client";

import React, { useState, useEffect } from "react";
import { Compass, ShieldAlert } from "lucide-react";

interface CompassLoaderProps {
  bearing?: number;
  spinning?: boolean;
}

export default function CompassLoader({ bearing = 284, spinning = false }: CompassLoaderProps) {
  const [currentBearing, setCurrentBearing] = useState(bearing);

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setCurrentBearing((prev) => (prev + 5) % 360);
      }, 50);
      return () => clearInterval(interval);
    } else {
      // Add a slight natural wave drift to make it feel alive!
      const interval = setInterval(() => {
        setCurrentBearing((prev) => {
          const drift = Math.sin(Date.now() / 1000) * 1.5;
          return Math.round(((bearing + drift + 360) % 360) * 10) / 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [spinning, bearing]);

  // Determine Cardinal direction
  const getCardinal = (deg: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-navy-light/35 border border-navy-border/50 rounded-xl relative overflow-hidden w-full max-w-[240px] font-mono select-none">
      
      {/* Brass bezel ring */}
      <div className="relative w-28 h-28 rounded-full border-4 border-gold bg-navy-deep flex items-center justify-center shadow-gold-glow">
        
        {/* Cardinal Markers */}
        <span className="absolute top-1 text-[9px] text-rust-bright font-bold font-cinzel">N</span>
        <span className="absolute right-1.5 text-[9px] text-gold/80 font-bold font-cinzel">E</span>
        <span className="absolute bottom-1 text-[9px] text-gold/80 font-bold font-cinzel">S</span>
        <span className="absolute left-1.5 text-[9px] text-gold/80 font-bold font-cinzel">W</span>

        {/* Graduations marks */}
        <div className="absolute inset-2 border border-dashed border-navy-border/40 rounded-full" />
        
        {/* Rotating Compass Card */}
        <div 
          className="absolute inset-3 flex items-center justify-center transition-transform duration-100 ease-out"
          style={{ transform: `rotate(${-currentBearing}deg)` }}
        >
          {/* Compass Needle */}
          <div className="w-1 h-20 bg-gradient-to-b from-rust-bright via-gold to-navy-border rounded-full relative">
            {/* North Indicator arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rust-bright" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-gold border border-navy-deep z-10" />
        </div>

      </div>

      {/* Bearing readings */}
      <div className="mt-3 text-center">
        <div className="text-xs text-gold font-bold tracking-wide">
          {currentBearing}° {getCardinal(currentBearing)}
        </div>
        <div className="text-[9px] text-parchment-dark/60 mt-0.5">
          COMPASS DEVIATION: 0.02°
        </div>
      </div>
      
      {/* Decorative metal rivets */}
      <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-navy-border" />
      <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-navy-border" />
      <div className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full bg-navy-border" />
      <div className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full bg-navy-border" />
    </div>
  );
}
