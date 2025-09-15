import React from 'react';
import { Tile, useTileManager } from '../../hooks/useTileManager';

interface AppearanceSectionProps {
  firstTile: Tile | undefined;
  isMultiple: boolean;
  tileManager: ReturnType<typeof useTileManager>;
  updateTilePropertyEnhanced: (path: string, value: any) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  firstTile,
  isMultiple,
  tileManager,
  updateTilePropertyEnhanced
}) => {
  if (!firstTile) return null;
  
  const firstMesh = tileManager.meshes.find(mesh => mesh.tileIds.includes(firstTile.id));
  const isMeshTile = !!firstMesh;

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ color: 'var(--terminal-accent)', marginBottom: '5px' }}>APPEARANCE</div>
      
      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Color:</label>
        <input
          type="color"
          value={firstTile.appearance.color}
          onChange={(e) => updateTilePropertyEnhanced('appearance.color', e.target.value)}
          style={{ width: '100%', height: '20px' }}
        />
      </div>

      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Opacity:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={firstTile.appearance.opacity}
          onChange={(e) => updateTilePropertyEnhanced('appearance.opacity', Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <span style={{ color: 'var(--terminal-secondary)', fontSize: '9px' }}>
          {Math.round(firstTile.appearance.opacity * 100)}%
        </span>
      </div>

      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Border Color:</label>
        <input
          type="color"
          value={firstTile.appearance.borderColor}
          onChange={(e) => updateTilePropertyEnhanced('appearance.borderColor', e.target.value)}
          style={{ width: '100%', height: '20px' }}
        />
      </div>

      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Border Width:</label>
        <input
          type="number"
          min="0"
          max="10"
          value={firstTile.appearance.borderWidth}
          onChange={(e) => updateTilePropertyEnhanced('appearance.borderWidth', Number(e.target.value))}
          className="hacker-input"
          style={{ width: '100%', fontSize: '10px' }}
        />
      </div>

      {/* Only show border radius and shadow for individual tiles, not mesh tiles */}
      {!isMeshTile && (
        <>
          <div style={{ marginBottom: '5px' }}>
            <label style={{ color: 'var(--terminal-secondary)' }}>Border Radius:</label>
            <input
              type="number"
              min="0"
              max="50"
              value={firstTile.appearance.borderRadius || 0}
              onChange={(e) => updateTilePropertyEnhanced('appearance.borderRadius', Number(e.target.value))}
              className="hacker-input"
              style={{ width: '100%', fontSize: '10px' }}
            />
          </div>

          {/* Shadow controls */}
          <div style={{ marginBottom: '10px', padding: '8px', border: '1px solid var(--terminal-secondary)', borderRadius: '2px' }}>
            <div style={{ marginBottom: '5px' }}>
              <label style={{ color: 'var(--terminal-accent)', fontSize: '11px', fontWeight: 'bold' }}>SHADOW:</label>
            </div>
            
            <div style={{ marginBottom: '5px' }}>
              <label style={{ color: 'var(--terminal-secondary)', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={firstTile.appearance.shadow?.enabled || false}
                  onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.enabled', e.target.checked)}
                  style={{ marginRight: '5px' }}
                />
                Enable Shadow
              </label>
            </div>

            {firstTile.appearance.shadow?.enabled && (
              <>
                <div style={{ marginBottom: '5px' }}>
                  <label style={{ color: 'var(--terminal-secondary)' }}>Type:</label>
                  <select
                    value={firstTile.appearance.shadow.type}
                    onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.type', e.target.value)}
                    className="hacker-input"
                    style={{ width: '100%', fontSize: '10px' }}
                  >
                    <option value="outer">Outer</option>
                    <option value="inner">Inner</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--terminal-secondary)' }}>Offset X:</label>
                    <input
                      type="number"
                      min="-20"
                      max="20"
                      value={firstTile.appearance.shadow.offsetX}
                      onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.offsetX', Number(e.target.value))}
                      className="hacker-input"
                      style={{ width: '100%', fontSize: '10px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--terminal-secondary)' }}>Offset Y:</label>
                    <input
                      type="number"
                      min="-20"
                      max="20"
                      value={firstTile.appearance.shadow.offsetY}
                      onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.offsetY', Number(e.target.value))}
                      className="hacker-input"
                      style={{ width: '100%', fontSize: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '5px' }}>
                  <label style={{ color: 'var(--terminal-secondary)' }}>Blur:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={firstTile.appearance.shadow.blur}
                    onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.blur', Number(e.target.value))}
                    className="hacker-input"
                    style={{ width: '100%', fontSize: '10px' }}
                  />
                </div>

                <div style={{ marginBottom: '5px' }}>
                  <label style={{ color: 'var(--terminal-secondary)' }}>Shadow Color:</label>
                  <input
                    type="color"
                    value={firstTile.appearance.shadow.color}
                    onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.color', e.target.value)}
                    className="hacker-input"
                    style={{ width: '100%', height: '24px', padding: '0' }}
                  />
                </div>

                <div style={{ marginBottom: '5px' }}>
                  <label style={{ color: 'var(--terminal-secondary)' }}>Shadow Opacity:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={firstTile.appearance.shadow.opacity}
                    onChange={(e) => updateTilePropertyEnhanced('appearance.shadow.opacity', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--terminal-secondary)', textAlign: 'center' }}>
                    {(firstTile.appearance.shadow.opacity * 100).toFixed(0)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Text:</label>
        <input
          type="text"
          value={firstTile.appearance.text || ''}
          onChange={(e) => updateTilePropertyEnhanced('appearance.text', e.target.value)}
          className="hacker-input"
          style={{ width: '100%', fontSize: '10px' }}
          placeholder={isMultiple ? "Text (applies to all)" : "Optional text"}
        />
      </div>

      <div style={{ marginBottom: '5px' }}>
        <label style={{ color: 'var(--terminal-secondary)' }}>Font Size:</label>
        <input
          type="number"
          min="6"
          max="24"
          value={firstTile.appearance.fontSize}
          onChange={(e) => updateTilePropertyEnhanced('appearance.fontSize', Number(e.target.value))}
          className="hacker-input"
          style={{ width: '100%', fontSize: '10px' }}
        />
      </div>
    </div>
  );
};