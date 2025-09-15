import { useState, useRef } from 'react';
import { navigateTo } from '@devvit/web/client';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { LayerType } from './hooks/useTileManager';

type AppMode = 'creator' | 'player';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const App = () => {
  const [appMode, setAppMode] = useState<AppMode>('creator');
  const [currentLayer, setCurrentLayer] = useState<LayerType>('midground');
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState(1);
  
  const canvasRef = useRef<HTMLDivElement>(null!);

  // Use the canvas interaction hook for clean state management
  const {
    interaction,
    tileManager,
    handleCanvasClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    screenToWorld
  } = useCanvasInteraction({
    canvasRef,
    cameraOffset,
    cameraZoom,
    setCameraOffset,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    currentLayer
  });

  // Camera zoom handler with bounds
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setCameraZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  };

  // Update tile property (works on all selected tiles)
  const updateTileProperty = (path: string, value: any) => {
    tileManager.updateTileProperty(path, value);
  };

  // Handle name editing
  const handleEditName = (id: string, currentName: string) => {
    setEditingName(id);
    setEditingValue(currentName);
  };

  const handleSaveName = () => {
    if (editingName) {
      updateTileProperty('name', editingValue);
    }
    setEditingName(null);
    setEditingValue('');
  };

  // Simple multi-selection support
  const selectedTiles = tileManager.tiles.filter(t => tileManager.selectedTiles.includes(t.id));
  const isMultiple = selectedTiles.length > 1;
  const firstTile = selectedTiles[0];
  
  // Calculate center for multiple selection
  const getCenter = () => {
    if (!isMultiple || selectedTiles.length === 0) return { x: 0, y: 0 };
    
    const bounds = selectedTiles.reduce((acc, tile) => {
      const left = tile.transform.x;
      const right = tile.transform.x + tile.transform.width;
      const top = tile.transform.y;
      const bottom = tile.transform.y + tile.transform.height;
      
      return {
        minX: Math.min(acc.minX, left),
        maxX: Math.max(acc.maxX, right),
        minY: Math.min(acc.minY, top),
        maxY: Math.max(acc.maxY, bottom)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  };
  
  const center = getCenter();

  // Enhanced update function for multi-selection
  const updateTilePropertyEnhanced = (path: string, value: any) => {
    if (selectedTiles.length === 0) return;
    
    if (isMultiple && path.startsWith('transform.')) {
      const transformProp = path.split('.')[1];
      
      if (transformProp === 'x' || transformProp === 'y') {
        // Position update - move all objects relative to center
        const deltaX = transformProp === 'x' ? value - center.x : 0;
        const deltaY = transformProp === 'y' ? value - center.y : 0;
        
        selectedTiles.forEach(tile => {
          const newX = tile.transform.x + deltaX;
          const newY = tile.transform.y + deltaY;
          if (transformProp === 'x') {
            tileManager.updateTileProperty('transform.x', newX);
          } else {
            tileManager.updateTileProperty('transform.y', newY);
          }
        });
        return;
      }
    }
    
    // Regular property update for all selected
    tileManager.updateTileProperty(path, value);
  };

  if (appMode === 'player') {
    return (
      <div className="terminal-container" style={{ margin: '20px', maxWidth: '800px', minHeight: '600px' }}>
        <div className="terminal-header">
          <span>EXIT_CODE.exe - Player Mode</span>
          <button className="hacker-button" onClick={() => setAppMode('creator')} style={{ fontSize: '10px' }}>
            CREATOR
          </button>
        </div>
        <div className="terminal-content" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ color: 'var(--terminal-accent)', fontSize: '24px', marginBottom: '20px' }}>
            PLAYER MODE
          </div>
          <div style={{ color: 'var(--terminal-primary)', marginBottom: '20px' }}>
            Coming Soon: Quest Player
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container" style={{ 
      margin: '20px', 
      maxWidth: '1400px', 
      minHeight: '700px',
      overflow: 'hidden' 
    }}>
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
      
      <div className="terminal-content" style={{ display: 'flex', height: '640px' }}>
        {/* Left Panel - Tools */}
        <div style={{ width: '200px', paddingRight: '20px', borderRight: '1px solid var(--terminal-border)' }}>
          {/* Layer Selector */}
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

          {/* Sub-layer controls */}
          <div style={{ marginBottom: '20px', padding: '8px', border: '1px solid var(--terminal-secondary)', borderRadius: '2px' }}>
            <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px', fontSize: '12px' }}>
              SUB-LAYERS ({currentLayer.toUpperCase()}):
            </div>
            
            {/* Current sub-layer display */}
            <div style={{ marginBottom: '8px', fontSize: '10px', color: 'var(--terminal-secondary)' }}>
              Current: {tileManager.currentSubLayerId ? 
                tileManager.subLayers.find(sl => sl.id === tileManager.currentSubLayerId)?.name || 'Unknown' : 
                'None (Main Layer)'
              }
            </div>

            {/* Sub-layer list */}
            <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
              {tileManager.getSubLayersForLayer(currentLayer).map((subLayer) => (
                <div key={subLayer.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '2px',
                  padding: '2px 4px',
                  backgroundColor: tileManager.currentSubLayerId === subLayer.id ? 'var(--terminal-accent-bg)' : 'transparent',
                  border: tileManager.currentSubLayerId === subLayer.id ? '1px solid var(--terminal-accent)' : '1px solid transparent'
                }}>
                  <button
                    onClick={() => tileManager.setCurrentSubLayerId(subLayer.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--terminal-primary)',
                      fontSize: '9px',
                      cursor: 'pointer',
                      padding: '2px',
                      flex: 1,
                      textAlign: 'left'
                    }}
                  >
                    {subLayer.name} (z:{subLayer.zIndex})
                  </button>
                  <button
                    onClick={() => tileManager.toggleSubLayerVisibility(subLayer.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: subLayer.visible ? 'var(--terminal-accent)' : 'var(--terminal-secondary)',
                      fontSize: '8px',
                      cursor: 'pointer',
                      padding: '2px',
                      width: '20px'
                    }}
                  >
                    👁
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-layer controls */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              <button
                onClick={() => {
                  const name = prompt('Sub-layer name:', `SubLayer_${tileManager.getSubLayersForLayer(currentLayer).length + 1}`);
                  if (name) {
                    const newSubLayer = tileManager.createSubLayer(name, currentLayer);
                    tileManager.setCurrentSubLayerId(newSubLayer.id);
                  }
                }}
                className="hacker-button"
                style={{ flex: 1, fontSize: '8px', padding: '2px 4px' }}
              >
                NEW
              </button>
              
              <button
                onClick={() => tileManager.setCurrentSubLayerId(null)}
                className="hacker-button"
                style={{ flex: 1, fontSize: '8px', padding: '2px 4px' }}
              >
                MAIN
              </button>
            </div>

            {/* Current sub-layer actions */}
            {tileManager.currentSubLayerId && (
              <div style={{ display: 'flex', gap: '4px', fontSize: '8px' }}>
                <button
                  onClick={() => {
                    const currentSub = tileManager.subLayers.find(sl => sl.id === tileManager.currentSubLayerId);
                    if (currentSub) {
                      const newName = prompt('Rename sub-layer:', currentSub.name);
                      if (newName && newName !== currentSub.name) {
                        tileManager.renameSubLayer(currentSub.id, newName);
                      }
                    }
                  }}
                  className="hacker-button"
                  style={{ flex: 1, padding: '2px 4px' }}
                >
                  RENAME
                </button>
                
                <button
                  onClick={() => {
                    const currentSub = tileManager.subLayers.find(sl => sl.id === tileManager.currentSubLayerId);
                    if (currentSub) {
                      const newZIndex = prompt('Set Z-Index:', currentSub.zIndex.toString());
                      if (newZIndex !== null) {
                        const zIndex = parseInt(newZIndex);
                        if (!isNaN(zIndex)) {
                          tileManager.updateSubLayerZIndex(currentSub.id, zIndex);
                        }
                      }
                    }
                  }}
                  className="hacker-button"
                  style={{ flex: 1, padding: '2px 4px' }}
                >
                  Z-IDX
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Delete this sub-layer? Tiles will be moved to the main layer.') && tileManager.currentSubLayerId) {
                      tileManager.deleteSubLayer(tileManager.currentSubLayerId);
                    }
                  }}
                  className="hacker-button"
                  style={{ flex: 1, padding: '2px 4px', color: 'var(--terminal-danger)' }}
                >
                  DEL
                </button>
              </div>
            )}
          </div>

          {/* Unity-style Mode Switcher */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px', fontSize: '12px' }}>
              MODE:
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--terminal-border)' }}>
              <button
                className="hacker-button"
                onClick={() => interaction.setCanvasMode('select')}
                style={{
                  flex: 1,
                  margin: 0,
                  fontSize: '10px',
                  padding: '6px',
                  borderRadius: 0,
                  backgroundColor: interaction.state.canvasMode === 'select' ? 'var(--terminal-accent)' : 'transparent',
                  color: interaction.state.canvasMode === 'select' ? 'var(--terminal-bg)' : 'var(--terminal-primary)',
                  border: 'none'
                }}
              >
                SELECT
              </button>
              <button
                className="hacker-button"
                onClick={() => interaction.setCanvasMode('add')}
                style={{
                  flex: 1,
                  margin: 0,
                  fontSize: '10px',
                  padding: '6px',
                  borderRadius: 0,
                  backgroundColor: interaction.state.canvasMode === 'add' ? 'var(--terminal-accent)' : 'transparent',
                  color: interaction.state.canvasMode === 'add' ? 'var(--terminal-bg)' : 'var(--terminal-primary)',
                  border: 'none',
                  borderLeft: '1px solid var(--terminal-border)'
                }}
              >
                ADD
              </button>
            </div>
          </div>

          {/* Tile Count Info */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--terminal-accent)', fontSize: '12px' }}>
              TILES: {tileManager.tiles.length}
            </div>
            <div style={{ color: 'var(--terminal-accent)', fontSize: '12px' }}>
              SELECTED: {tileManager.selectedTiles.length}
            </div>
            <div style={{ color: 'var(--terminal-accent)', fontSize: '12px' }}>
              ZOOM: {Math.round(cameraZoom * 100)}%
            </div>
          </div>

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
                return (
                  <div key={layer} style={{ marginBottom: '10px' }}>
                    <div style={{ color: 'var(--terminal-secondary)', fontSize: '9px' }}>
                      {layer.toUpperCase()} ({layerTiles.length})
                    </div>
                    {layerTiles.map((tile) => (
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
        </div>

        {/* Center - Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '0 20px' }}>
          <div
            ref={canvasRef}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              border: '2px solid var(--terminal-accent)',
              backgroundColor: 'var(--terminal-bg-alt)',
              position: 'relative',
              cursor: interaction.state.mode === 'panning' ? 'grabbing' : 'default',
              overflow: 'hidden'
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheelZoom}
          >
            {/* Canvas transform container */}
            <div
              style={{
                transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${cameraZoom})`,
                transformOrigin: '0 0',
                position: 'relative',
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT
              }}
            >
              {/* Grid lines */}
              <svg
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--terminal-border)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Render tiles */}
              {tileManager.tiles
                .sort((a, b) => {
                  // First sort by layer order
                  const layerOrder = { background: 0, midground: 1, foreground: 2 };
                  const layerDiff = layerOrder[a.layer] - layerOrder[b.layer];
                  if (layerDiff !== 0) return layerDiff;
                  
                  // Then sort by sub-layer z-index within the same layer
                  const aSubLayer = tileManager.subLayers.find(sl => sl.id === a.subLayerId);
                  const bSubLayer = tileManager.subLayers.find(sl => sl.id === b.subLayerId);
                  const aZIndex = aSubLayer ? aSubLayer.zIndex : 0; // Main layer has z-index 0
                  const bZIndex = bSubLayer ? bSubLayer.zIndex : 0;
                  
                  return aZIndex - bZIndex;
                })
                .filter(tile => {
                  // Filter out tiles in hidden sub-layers
                  if (tile.subLayerId) {
                    const subLayer = tileManager.subLayers.find(sl => sl.id === tile.subLayerId);
                    return subLayer?.visible !== false;
                  }
                  return true;
                })
                .map((tile) => (
                <div
                  key={tile.id}
                  style={{
                    position: 'absolute',
                    left: tile.transform.x,
                    top: tile.transform.y,
                    width: tile.transform.width,
                    height: tile.transform.height,
                    backgroundColor: tile.appearance.color,
                    border: `${tile.appearance.borderWidth}px solid ${
                      tileManager.selectedTiles.includes(tile.id) 
                        ? 'var(--terminal-accent)' 
                        : tile.appearance.borderColor
                    }`,
                    borderRadius: tile.appearance.borderRadius || 0,
                    boxShadow: tile.appearance.shadow?.enabled 
                      ? `${tile.appearance.shadow.type === 'inner' ? 'inset ' : ''}${tile.appearance.shadow.offsetX}px ${tile.appearance.shadow.offsetY}px ${tile.appearance.shadow.blur}px ${tile.appearance.shadow.color}${Math.round(tile.appearance.shadow.opacity * 255).toString(16).padStart(2, '0')}`
                      : 'none',
                    opacity: tile.layer === currentLayer 
                      ? tile.appearance.opacity 
                      : tile.appearance.opacity * 0.3, // Dim unselected layers
                    cursor: tile.layer === currentLayer ? 'pointer' : 'default',
                    boxSizing: 'border-box',
                    transform: `rotate(${tile.transform.rotation}deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: tile.appearance.fontSize,
                    color: 'var(--terminal-primary)',
                    userSelect: 'none',
                    zIndex: (() => {
                      let baseZIndex = tile.layer === currentLayer ? 100 : 1;
                      
                      // Add sub-layer z-index offset
                      if (tile.subLayerId) {
                        const subLayer = tileManager.subLayers.find(sl => sl.id === tile.subLayerId);
                        if (subLayer) {
                          baseZIndex += subLayer.zIndex;
                        }
                      }
                      
                      // Selected tiles get priority
                      if (tile.layer === currentLayer && tileManager.selectedTiles.includes(tile.id)) {
                        baseZIndex += 1000;
                      }
                      
                      return baseZIndex;
                    })(),
                    pointerEvents: tile.layer === currentLayer ? 'auto' : 'none' // Disable interaction for dimmed layers
                  }}
                >
                  {tile.appearance.text}
                </div>
              ))}

              {/* Selection box */}
              {interaction.state.mode === 'box-selecting' && interaction.state.boxSelectData && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(interaction.state.boxSelectData.startX, interaction.state.boxSelectData.endX),
                    top: Math.min(interaction.state.boxSelectData.startY, interaction.state.boxSelectData.endY),
                    width: Math.abs(interaction.state.boxSelectData.endX - interaction.state.boxSelectData.startX),
                    height: Math.abs(interaction.state.boxSelectData.endY - interaction.state.boxSelectData.startY),
                    border: '2px dashed var(--terminal-accent)',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 2000
                  }}
                />
              )}
            </div>
          </div>

          {/* Canvas Info */}
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
            Mode: {interaction.state.mode.toUpperCase()} | 
            Canvas Mode: {interaction.state.canvasMode.toUpperCase()} |
            Layer: {currentLayer.toUpperCase()}
          </div>
        </div>

        {/* Right Panel - Properties (Always Visible) */}
        <div 
          className="properties-panel"
          style={{ 
            width: '300px', 
            paddingLeft: '20px', 
            borderLeft: '1px solid var(--terminal-border)',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none'  // IE and Edge
          }}
        >
          <style>{`
            .properties-panel::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
          <div style={{ color: 'var(--terminal-accent)', marginBottom: '10px', fontSize: '12px' }}>
            PROPERTIES
          </div>
          
          {selectedTiles.length > 0 && firstTile ? (
            <div style={{ fontSize: '10px' }}>
              {/* Multi-selection indicator */}
              {isMultiple && (
                <div style={{ 
                  marginBottom: '10px', 
                  padding: '5px', 
                  backgroundColor: 'var(--terminal-accent-bg)', 
                  color: 'var(--terminal-accent)',
                  fontSize: '9px',
                  textAlign: 'center'
                }}>
                  {selectedTiles.length} OBJECTS SELECTED
                </div>
              )}

              {/* Mesh information */}
              {(() => {
                const firstMesh = tileManager.meshes.find(mesh => mesh.tileIds.includes(firstTile.id));
                if (firstMesh) {
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
                        ID: {firstMesh.id}
                      </div>
                      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px' }}>
                        Objects: {firstMesh.tileIds.length}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Sub-layer information */}
              {firstTile.subLayerId && (() => {
                const subLayer = tileManager.subLayers.find(sl => sl.id === firstTile.subLayerId);
                if (subLayer) {
                  return (
                    <div style={{ 
                      marginBottom: '10px', 
                      padding: '8px', 
                      border: '1px solid var(--terminal-secondary)', 
                      borderRadius: '2px',
                      backgroundColor: 'rgba(128, 128, 128, 0.05)'
                    }}>
                      <div style={{ 
                        color: 'var(--terminal-secondary)', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        SUB-LAYER:
                      </div>
                      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px', marginBottom: '3px' }}>
                        Name: {subLayer.name}
                      </div>
                      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px', marginBottom: '3px' }}>
                        Layer: {subLayer.parentLayer}
                      </div>
                      <div style={{ color: 'var(--terminal-secondary)', fontSize: '10px' }}>
                        Z-Index: {subLayer.zIndex}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
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

              {/* Action Buttons */}
              <div style={{ marginTop: '20px' }}>
                <button
                  className="hacker-button"
                  onClick={() => tileManager.deleteTiles(tileManager.selectedTiles)}
                  style={{ fontSize: '10px', width: '100%', marginBottom: '5px' }}
                >
                  DELETE SELECTED
                </button>
                <button
                  className="hacker-button"
                  onClick={() => tileManager.duplicateTiles(tileManager.selectedTiles)}
                  style={{ fontSize: '10px', width: '100%', marginBottom: '5px' }}
                >
                  DUPLICATE
                </button>
                <button
                  className="hacker-button"
                  onClick={() => tileManager.createMeshFromSelected()}
                  disabled={tileManager.selectedTiles.length < 2}
                  style={{ 
                    fontSize: '10px', 
                    width: '100%', 
                    marginBottom: '5px',
                    opacity: tileManager.selectedTiles.length < 2 ? 0.5 : 1
                  }}
                >
                  CREATE MESH ({tileManager.selectedTiles.length})
                </button>
              </div>
            </div>
          ) : (
            <div style={{ 
              color: 'var(--terminal-secondary)', 
              fontSize: '10px',
              textAlign: 'center',
              paddingTop: '50px'
            }}>
              Select a tile to view properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};