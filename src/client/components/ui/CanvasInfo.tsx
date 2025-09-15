import React from 'react';
import { InteractionMode, CanvasMode } from '../../hooks/useInteractionState';
import { LayerType } from '../../hooks/useTileManager';

interface CanvasInfoProps {
  mode: InteractionMode;
  canvasMode: CanvasMode;
  currentLayer: LayerType;
}

export const CanvasInfo: React.FC<CanvasInfoProps> = ({ mode, canvasMode, currentLayer }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '10px', 
      left: '10px', 
      fontSize: '10px', 
      color: 'var(--terminal-secondary)',
      backgroundColor: 'var(--terminal-bg)',
      padding: '4px 8px',
      border: '1px solid var(--terminal-border)'
    }}>
      Mode: {mode.toUpperCase()} | 
      Canvas Mode: {canvasMode.toUpperCase()} |
      Layer: {currentLayer.toUpperCase()}
    </div>
  );
};