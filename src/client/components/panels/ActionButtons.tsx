import React from 'react';
import { useTileManager } from '../../hooks/useTileManager';

interface ActionButtonsProps {
  tileManager: ReturnType<typeof useTileManager>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ tileManager }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px', fontSize: '12px' }}>
        ACTIONS:
      </div>
      <button
        className="hacker-button"
        onClick={() => tileManager.deleteSelectedTiles()}
        disabled={tileManager.selectedTiles.length === 0}
        style={{ 
          fontSize: '10px', 
          width: '100%', 
          marginBottom: '4px',
          opacity: tileManager.selectedTiles.length === 0 ? 0.5 : 1
        }}
      >
        DELETE SELECTED
      </button>
      <button
        className="hacker-button"
        onClick={() => tileManager.createMeshFromSelected()}
        disabled={tileManager.selectedTiles.length < 2}
        style={{ 
          fontSize: '10px', 
          width: '100%', 
          marginBottom: '4px',
          opacity: tileManager.selectedTiles.length < 2 ? 0.5 : 1
        }}
      >
        CREATE MESH
      </button>
      <button
        className="hacker-button"
        onClick={() => tileManager.duplicateTiles(tileManager.selectedTiles)}
        disabled={tileManager.selectedTiles.length === 0}
        style={{ 
          fontSize: '10px', 
          width: '100%',
          opacity: tileManager.selectedTiles.length === 0 ? 0.5 : 1
        }}
      >
        DUPLICATE
      </button>
    </div>
  );
};