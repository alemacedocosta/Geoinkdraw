import React from 'react';
import { Trophy, Star, Award, Crown, Zap, Target } from 'lucide-react';

interface TrophyDisplayProps {
  level: number;
  size?: number;
  className?: string;
}

export const TrophyDisplay: React.FC<TrophyDisplayProps> = ({ level, size = 24, className = "" }) => {
  const trophies = [
    { icon: Target, label: "Iniciante", color: "text-gray-400" },
    { icon: Zap, label: "Explorador", color: "text-gray-600" },
    { icon: Award, label: "Artista", color: "text-gray-800" },
    { icon: Star, label: "Mestre", color: "text-black" },
    { icon: Crown, label: "Lenda", color: "text-black drop-shadow-md" },
    { icon: Trophy, label: "GeoInk God", color: "text-black scale-110" }
  ];

  const current = trophies[Math.min(level, trophies.length - 1)];
  const Icon = current.icon;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <Icon size={size} className={current.color} />
      <span className="text-[10px] uppercase font-bold tracking-tighter">{current.label}</span>
    </div>
  );
};
