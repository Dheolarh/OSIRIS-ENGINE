import React from 'react';

interface HeaderProps {
  appMode: 'creator' | 'player';
  setAppMode: (mode: 'creator' | 'player') => void;
}

export const Header: React.FC<HeaderProps> = ({ appMode, setAppMode }) => {
  return (
    <div className="terminal-header">
      <span>EXIT_CODE.exe - Creator Studio v2.0 [TILE SYSTEM]</span>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          className="hacker-button" 
          onClick={() => setAppMode('player')}
          style={{ fontSize: '10px', padding: '4px 8px' }}
        >
          PLAY MODE
        </button>
        <span className="blinking-cursor">CREATING</span>
      </div>
    </div>
  );
};