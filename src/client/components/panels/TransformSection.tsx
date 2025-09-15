import React from 'react';
import { Tile } from '../../hooks/useTileManager';

interface TransformSectionProps {
  firstTile: Tile | undefined;
  isMultiple: boolean;
  center: { x: number; y: number };
  updateTilePropertyEnhanced: (path: string, value: any) => void;
}

export const TransformSection: React.FC<TransformSectionProps> = ({
  firstTile,
  isMultiple,
  center,
  updateTilePropertyEnhanced
}) => {
  if (!firstTile) return null;
  
  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ color: 'var(--terminal-accent)', marginBottom: '5px' }}>TRANSFORM</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px' }}>
        <div>
          <label style={{ color: 'var(--terminal-secondary)' }}>X:</label>
          <input
            type="number"
            value={Math.round(isMultiple ? center.x : firstTile.transform.x)}
            onChange={(e) => updateTilePropertyEnhanced('transform.x', Number(e.target.value))}
            className="hacker-input"
            style={{ width: '100%', fontSize: '10px' }}
            placeholder={isMultiple ? "Center X" : "X"}
          />
        </div>
        <div>
          <label style={{ color: 'var(--terminal-secondary)' }}>Y:</label>
          <input
            type="number"
            value={Math.round(isMultiple ? center.y : firstTile.transform.y)}
            onChange={(e) => updateTilePropertyEnhanced('transform.y', Number(e.target.value))}
            className="hacker-input"
            style={{ width: '100%', fontSize: '10px' }}
            placeholder={isMultiple ? "Center Y" : "Y"}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px' }}>
        <div>
          <label style={{ color: 'var(--terminal-secondary)' }}>W:</label>
          <input
            type="number"
            value={firstTile.transform.width}
            onChange={(e) => updateTilePropertyEnhanced('transform.width', Number(e.target.value))}
            className="hacker-input"
            style={{ width: '100%', fontSize: '10px' }}
          />
        </div>
        <div>
          <label style={{ color: 'var(--terminal-secondary)' }}>H:</label>
          <input
            type="number"
            value={firstTile.transform.height}
            onChange={(e) => updateTilePropertyEnhanced('transform.height', Number(e.target.value))}
            className="hacker-input"
            style={{ width: '100%', fontSize: '10px' }}
          />
        </div>
      </div>

      <div>
        <label style={{ color: 'var(--terminal-secondary)' }}>Rotation:</label>
        <input
          type="number"
          value={firstTile.transform.rotation}
          onChange={(e) => updateTilePropertyEnhanced('transform.rotation', Number(e.target.value))}
          className="hacker-input"
          style={{ width: '100%', fontSize: '10px' }}
        />
      </div>
    </div>
  );
};