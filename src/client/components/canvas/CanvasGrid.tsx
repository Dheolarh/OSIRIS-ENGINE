import React from 'react';

interface CanvasGridProps {
  width: number;
  height: number;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({ width, height }) => {
  const gridSize = 20;

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      <defs>
        <pattern
          id="grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="var(--terminal-border)"
            strokeWidth="1"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
};