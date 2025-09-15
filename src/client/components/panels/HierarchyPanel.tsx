import React from 'react';
import { useTileManager, LayerType } from '../../hooks/useTileManager';

interface HierarchyPanelProps {
  tileManager: ReturnType<typeof useTileManager>;
  showHierarchy: boolean;
  setShowHierarchy: (show: boolean) => void;
  editingName: string | null;
  editingValue: string;
  setEditingName: (id: string | null) => void;
  setEditingValue: (value: string) => void;
  handleEditName: (id: string, currentName: string) => void;
  handleSaveName: () => void;
}

export const HierarchyPanel: React.FC<HierarchyPanelProps> = ({
  tileManager,
  showHierarchy,
  setShowHierarchy,
  editingName,
  editingValue,
  setEditingName,
  setEditingValue,
  handleEditName,
  handleSaveName
}) => {
  return (
    <>
      {/* Hierarchy Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="hacker-button"
          onClick={() => setShowHierarchy(!showHierarchy)}
          style={{ fontSize: '10px', width: '100%' }}
        >
          {showHierarchy ? 'HIDE' : 'SHOW'} HIERARCHY
        </button>
      </div>

      {/* Hierarchy Panel */}
      {showHierarchy && (
        <div style={{ fontSize: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px' }}>
            SCENE TREE:
          </div>
          {(['background', 'midground', 'foreground'] as LayerType[]).map((layer) => {
            const layerTiles = tileManager.tiles.filter(tile => tile.layer === layer);
            
            // Group tiles by mesh and individual tiles
            const meshGroups = new Map<string, { mesh: any, tiles: typeof layerTiles }>();
            const individualTiles: typeof layerTiles = [];
            
            layerTiles.forEach(tile => {
              if (tile.meshId) {
                const mesh = tileManager.meshes.find(m => m.id === tile.meshId);
                if (mesh) {
                  if (!meshGroups.has(tile.meshId)) {
                    meshGroups.set(tile.meshId, { mesh, tiles: [] });
                  }
                  meshGroups.get(tile.meshId)!.tiles.push(tile);
                }
              } else {
                individualTiles.push(tile);
              }
            });
            
            return (
              <div key={layer} style={{ marginBottom: '10px' }}>
                <div style={{ color: 'var(--terminal-secondary)', fontSize: '9px' }}>
                  {layer.toUpperCase()} ({layerTiles.length})
                </div>
                
                {/* Display mesh groups */}
                {Array.from(meshGroups.values()).map(({ mesh, tiles }) => (
                  <div
                    key={mesh.id}
                    style={{
                      paddingLeft: '10px',
                      cursor: 'pointer',
                      color: tiles.some(tile => tileManager.selectedTiles.includes(tile.id))
                        ? 'var(--terminal-accent)' 
                        : 'var(--terminal-primary)',
                      backgroundColor: tiles.some(tile => tileManager.selectedTiles.includes(tile.id))
                        ? 'var(--terminal-accent-bg)' 
                        : 'transparent'
                    }}
                    onClick={() => {
                      // Select all tiles in the mesh
                      const meshTileIds = tiles.map(t => t.id);
                      tileManager.selectTiles(meshTileIds);
                    }}
                  >
                    <span style={{ fontSize: '9px', color: 'var(--terminal-secondary)' }}>📦 </span>
                    {mesh.name} ({tiles.length} tiles)
                  </div>
                ))}
                
                {/* Display individual tiles */}
                {individualTiles.map((tile) => (
                  <div
                    key={tile.id}
                    style={{
                      paddingLeft: '10px',
                      cursor: 'pointer',
                      color: tileManager.selectedTiles.includes(tile.id) 
                        ? 'var(--terminal-accent)' 
                        : 'var(--terminal-primary)',
                      backgroundColor: tileManager.selectedTiles.includes(tile.id) 
                        ? 'var(--terminal-accent-bg)' 
                        : 'transparent'
                    }}
                    onClick={() => tileManager.selectTile(tile.id, false)}
                  >
                    {editingName === tile.id ? (
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        autoFocus
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--terminal-accent)',
                          color: 'var(--terminal-primary)',
                          fontSize: '10px',
                          padding: '1px',
                          width: '100px'
                        }}
                      />
                    ) : (
                      <span onDoubleClick={() => handleEditName(tile.id, tile.name)}>
                        {tile.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};