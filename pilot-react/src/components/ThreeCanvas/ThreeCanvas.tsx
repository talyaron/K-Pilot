import React from 'react';

interface ThreeCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ containerRef }) => (
  <div ref={containerRef as React.RefObject<HTMLDivElement>} id="three-canvas-container" />
);
