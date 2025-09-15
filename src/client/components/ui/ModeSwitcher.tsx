import React from 'react';
import { useInteractionState } from '../../hooks/useInteractionState';

interface ModeSwitcherProps {
  interaction: ReturnType<typeof useInteractionState>;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ interaction }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      display: 'flex',
      border: '2px solid var(--terminal-accent)',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: 'var(--terminal-bg)'
    }}>
      <button
        onClick={() => interaction.setCanvasMode('select')}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          backgroundColor: interaction.state.canvasMode === 'select' ? 'var(--terminal-accent)' : 'transparent',
          color: interaction.state.canvasMode === 'select' ? 'var(--terminal-bg)' : 'var(--terminal-accent)',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        title="Select Mode"
      >
        ⬚
      </button>
      <button
        onClick={() => interaction.setCanvasMode('add')}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          borderLeft: '1px solid var(--terminal-accent)',
          backgroundColor: interaction.state.canvasMode === 'add' ? 'var(--terminal-accent)' : 'transparent',
          color: interaction.state.canvasMode === 'add' ? 'var(--terminal-bg)' : 'var(--terminal-accent)',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        title="Add Mode"
      >
        ✚
      </button>
    </div>
  );
};