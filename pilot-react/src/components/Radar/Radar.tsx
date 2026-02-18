import React, { useRef, useEffect } from 'react';
import './Radar.css';

interface RadarProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const Radar: React.FC<RadarProps> = React.memo(({ onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  return (
    <div id="radar-container">
      <canvas id="radar" ref={canvasRef} width={200} height={200} />
      <div id="radar-sweep" />
    </div>
  );
});

Radar.displayName = 'Radar';
