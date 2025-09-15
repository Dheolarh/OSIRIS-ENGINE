import React from 'react';
import { useTileManager, Tile } from '../../hooks/useTileManager';

interface MeshInfoSectionProps {
  firstTile: Tile | undefined;
  tileManager: ReturnType<typeof useTileManager>;
}

export const MeshInfoSection: React.FC<MeshInfoSectionProps> = ({
  firstTile,
  tileManager
}) => {
  if (!firstTile) return null;
  
  const firstMesh = tileManager.meshes.find(mesh => mesh.tileIds.includes(firstTile.id));
  
  if (!firstMesh) return null;

  return (
    <div style={{ 
      marginBottom: '10px', 
      padding: '8px', 
      border: '1px solid var(--terminal-accent)', 
      borderRadius: '2px',
      backgroundColor: 'rgba(0, 255, 0, 0.05)'
    }}>
      <div style={{ 
        color: 'var(--terminal-accent)', 
        fontSize: '11px', 
        fontWeight: 'bold',
        marginBottom: '5px'
      }}>
        MESH INFO:
      </div>
      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px', marginBottom: '3px' }}>
        Name: {firstMesh.name}
      </div>
      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px', marginBottom: '3px' }}>
        Tiles: {firstMesh.tileIds.length}
      </div>
      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px' }}>
        ID: {firstMesh.id}
      </div>
    </div>
  );
};