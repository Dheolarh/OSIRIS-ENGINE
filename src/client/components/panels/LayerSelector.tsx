import React from 'react';
import { LayerType } from '../../hooks/useTileManager';

interface LayerSelectorProps {
  currentLayer: LayerType;
  setCurrentLayer: (layer: LayerType) => void;
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({
  currentLayer,
  setCurrentLayer
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px', fontSize: '12px' }}>
        LAYER:
      </div>
      {(['background', 'midground', 'foreground'] as LayerType[]).map((layer) => (
        <button
          key={layer}
          className="hacker-button"
          onClick={() => setCurrentLayer(layer)}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '4px',
            fontSize: '10px',
            padding: '4px 8px',
            backgroundColor: currentLayer === layer ? 'var(--terminal-accent)' : 'transparent',
            color: currentLayer === layer ? 'var(--terminal-bg)' : 'var(--terminal-primary)'
          }}
        >
          {layer.toUpperCase()}
        </button>
      ))}
    </div>
  );
};