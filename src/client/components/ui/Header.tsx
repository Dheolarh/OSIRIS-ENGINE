import React from 'react';
import { UsePhysicsReturn } from '../../physics/hooks/usePhysics';

interface HeaderProps {
  appMode: 'creator' | 'player';
  setAppMode: (mode: 'creator' | 'player') => void;
  physics: UsePhysicsReturn;
}

export const Header: React.FC<HeaderProps> = ({ appMode, setAppMode, physics }) => {
  return (
    <div className="terminal-header">
      <span>EXIT_CODE.exe - Creator Studio v2.0 [TILE SYSTEM]</span>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          className="hacker-button" 
          onClick={() => physics.setPhysicsEnabled(!physics.isPhysicsEnabled)}
          style={{ 
            fontSize: '10px', 
            padding: '4px 8px',
            backgroundColor: physics.isPhysicsEnabled ? 'var(--terminal-success)' : 'transparent',
            color: physics.isPhysicsEnabled ? 'var(--terminal-bg)' : 'var(--terminal-success)',
            border: '1px solid var(--terminal-success)'
          }}
        >
          {physics.isPhysicsEnabled ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button 
          className="hacker-button" 
          onClick={() => setAppMode('player')}
          style={{ fontSize: '10px', padding: '4px 8px' }}
        >
          PLAY MODE
        </button>
        <span className="blinking-cursor">
          {physics.isPhysicsEnabled ? 'SIMULATING' : 'CREATING'}
        </span>
      </div>
    </div>
  );
};