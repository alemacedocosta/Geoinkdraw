import React, { useEffect, useRef } from 'react';
import { Point } from '../types';

interface PixelCanvasProps {
  path: Point[];
  width?: number;
  height?: number;
  className?: string;
  autoFit?: boolean;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({ 
  path, 
  width = 300, 
  height = 300, 
  className = "",
  autoFit = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || path.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Find bounds
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    path.forEach(p => {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    });

    const latRange = maxLat - minLat || 0.0001;
    const lngRange = maxLng - minLng || 0.0001;

    const padding = 20;
    const drawWidth = canvas.width - padding * 2;
    const drawHeight = canvas.height - padding * 2;

    const scale = Math.min(drawWidth / lngRange, drawHeight / latRange);

    const getX = (lng: number) => padding + (lng - minLng) * scale + (drawWidth - lngRange * scale) / 2;
    const getY = (lat: number) => padding + (maxLat - lat) * scale + (drawHeight - latRange * scale) / 2;

    ctx.beginPath();
    ctx.moveTo(getX(path[0].lng), getY(path[0].lat));
    
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(getX(path[i].lng), getY(path[i].lat));
    }
    ctx.stroke();

    // Add "pixelated" effect by drawing dots at points if it's a small path
    if (path.length < 50) {
      ctx.fillStyle = '#1a1a1a';
      path.forEach(p => {
        ctx.fillRect(getX(p.lng) - 1, getY(p.lat) - 1, 3, 3);
      });
    }

  }, [path, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className={`bg-white ink-border ${className}`}
    />
  );
};
