import { useState, useRef, useCallback } from 'react';
import { navigateTo } from '@devvit/web/client';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { LayerType } from './hooks/useTileManager';

type AppMode = 'creator' | 'player';

// Component/System types
interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface Appearance {
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  text?: string;
  fontSize: number;
}

interface Physics {
  collision: 'none' | 'solid' | 'trigger';
  movement?: {
    type: 'static' | 'oscillate' | 'rotate' | 'path';
    speed: number;
    config?: any; // For oscillate: {distance}, for path: {points}
  };
}

interface Events {
  triggers: {
    type: 'collision' | 'timer' | 'interaction';
    condition?: any;
    actions: {
      type: 'changeProperty' | 'move' | 'destroy' | 'spawn';
      target: 'self' | 'other' | string; // tile ID
      data: any;
    }[];
  }[];
}

interface Effects {
  glow?: { color: string; intensity: number };
  pulse?: { speed: number; scale: number };
  trail?: { length: number; color: string };
}

// Generic Tile - gets behavior from attached components
interface Tile {
  id: string;
  name: string; // For hierarchy display
  layer: LayerType;
  selected: boolean;
  
  // Core components that every tile has
  transform: Transform;
  appearance: Appearance;
  
  // Optional systems
  physics?: Physics;
  events?: Events;
  effects?: Effects;
  
  // Meshing
  meshId?: string; // If part of a merged mesh
}

interface Mesh {
  id: string;
  tileIds: string[];
  name: string;
  // Meshes can have their own systems too
  physics?: Physics;
  events?: Events;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEFAULT_TILE_SIZE = 20;

export const App = () => {
  const [appMode, setAppMode] = useState<AppMode>('creator');
  const [currentLayer, setCurrentLayer] = useState<LayerType>('midground');
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState(1);
  
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create a new generic tile with default properties
  const createTile = (x: number, y: number): Tile => ({
    id: generateId(),
    name: `Tile_${tiles.length + 1}`,
    layer: currentLayer,
    selected: false,
    transform: {
      x: x - DEFAULT_TILE_SIZE / 2,
      y: y - DEFAULT_TILE_SIZE / 2,
      width: DEFAULT_TILE_SIZE,
      height: DEFAULT_TILE_SIZE,
      rotation: 0
    },
    appearance: {
      color: '#333333',
      opacity: 1,
      borderColor: '#00ff00',
      borderWidth: 1,
      fontSize: 12
    }
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (appMode !== 'creator' || isPanning || isSelecting) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Adjust coordinates for camera offset and zoom
    const x = (e.clientX - rect.left - cameraOffset.x) / cameraZoom;
    const y = (e.clientY - rect.top - cameraOffset.y) / cameraZoom;

    // Check if clicking on existing tile
    const clickedTile = tiles.find(tile => 
      x >= tile.transform.x && 
      x <= tile.transform.x + tile.transform.width &&
      y >= tile.transform.y && 
      y <= tile.transform.y + tile.transform.height
    );

    if (clickedTile) {
      // If tile is part of a mesh, select all tiles in the mesh
      if (clickedTile.meshId) {
        const mesh = meshes.find(m => m.id === clickedTile.meshId);
        if (mesh) {
          if (e.ctrlKey || e.metaKey) {
            // Toggle mesh selection
            const meshTilesSelected = mesh.tileIds.every(id => selectedTiles.includes(id));
            if (meshTilesSelected) {
              // Deselect mesh
              setSelectedTiles(prev => prev.filter(id => !mesh.tileIds.includes(id)));
              setTiles(prev => prev.map(tile => ({
                ...tile,
                selected: mesh.tileIds.includes(tile.id) ? false : tile.selected
              })));
            } else {
              // Add mesh to selection
              setSelectedTiles(prev => [...prev.filter(id => !mesh.tileIds.includes(id)), ...mesh.tileIds]);
              setTiles(prev => prev.map(tile => ({
                ...tile,
                selected: mesh.tileIds.includes(tile.id) ? true : tile.selected
              })));
            }
          } else {
            // Select entire mesh
            setSelectedTiles(mesh.tileIds);
            setTiles(prev => prev.map(tile => ({
              ...tile,
              selected: mesh.tileIds.includes(tile.id)
            })));
          }
        }
      } else {
        // Regular tile selection logic
        if (e.ctrlKey || e.metaKey) {
          if (selectedTiles.includes(clickedTile.id)) {
            // Deselect if already selected
            setSelectedTiles(prev => prev.filter(id => id !== clickedTile.id));
            setTiles(prev => prev.map(tile => ({
              ...tile,
              selected: tile.id === clickedTile.id ? false : tile.selected
            })));
          } else {
            // Add to selection
            setSelectedTiles(prev => [...prev, clickedTile.id]);
            setTiles(prev => prev.map(tile => ({
              ...tile,
              selected: tile.id === clickedTile.id ? true : tile.selected
            })));
          }
        } else {
          // Single select
          setSelectedTiles([clickedTile.id]);
          setTiles(prev => prev.map(tile => ({
            ...tile,
            selected: tile.id === clickedTile.id
          })));
        }
      }
      // Properties panel is always visible - no need to show/hide
    } else {
      // Only create new tile if in add mode and not holding Ctrl
      if (canvasMode === 'add' && !e.ctrlKey && !e.metaKey) {
        const newTile = createTile(x, y);
        setTiles(prev => [...prev, newTile]);
        setSelectedTiles([newTile.id]);
      } else if (e.ctrlKey || e.metaKey || canvasMode === 'select') {
        // Clear selection if Ctrl+clicking empty space or in select mode
        setSelectedTiles([]);
        setTiles(prev => prev.map(tile => ({ ...tile, selected: false })));
      }
    }
  }, [appMode, currentLayer, tiles, selectedTiles, meshes, isPanning, cameraOffset, cameraZoom, isSelecting, canvasMode]);

  const handleTileMouseDown = useCallback((e: React.MouseEvent, tileId: string) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    // Handle Ctrl+click multi-select first
    if (e.ctrlKey || e.metaKey) {
      if (selectedTiles.includes(tileId)) {
        // Deselect if already selected
        setSelectedTiles(prev => prev.filter(id => id !== tileId));
        setTiles(prev => prev.map(tile => ({
          ...tile,
          selected: tile.id === tileId ? false : tile.selected
        })));
      } else {
        // Add to selection
        setSelectedTiles(prev => [...prev, tileId]);
        setTiles(prev => prev.map(tile => ({
          ...tile,
          selected: tile.id === tileId ? true : tile.selected
        })));
      }
      // Don't start dragging when Ctrl+clicking for multi-select
      return;
    }

    // Start dragging for normal clicks
    setIsDragging(true);
    
    // Ensure this tile is selected (either add to selection or make it the only selection)
    if (!selectedTiles.includes(tileId)) {
      // If not selected, make it the only selection
      setSelectedTiles([tileId]);
      setTiles(prev => prev.map(t => ({
        ...t,
        selected: t.id === tileId
      })));
    }
    // If already selected, keep current selection and start dragging
    
    // Adjust drag offset for camera transform
    const x = (e.clientX - rect.left - cameraOffset.x) / cameraZoom;
    const y = (e.clientY - rect.top - cameraOffset.y) / cameraZoom;
    
    setDragOffset({
      x: x - tile.transform.x,
      y: y - tile.transform.y
    });
  }, [tiles, selectedTiles, cameraOffset, cameraZoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedTiles.length === 0 || appMode !== 'creator') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Adjust coordinates for camera transform
    const x = (e.clientX - rect.left - cameraOffset.x) / cameraZoom;
    const y = (e.clientY - rect.top - cameraOffset.y) / cameraZoom;
    
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    // Move all selected tiles
    setTiles(prev => prev.map(tile => 
      selectedTiles.includes(tile.id)
        ? { 
            ...tile, 
            transform: {
              ...tile.transform,
              x: Math.max(0, Math.min(newX, CANVAS_WIDTH / cameraZoom - tile.transform.width)),
              y: Math.max(0, Math.min(newY, CANVAS_HEIGHT / cameraZoom - tile.transform.height))
            }
          }
        : tile
    ));
  }, [isDragging, selectedTiles, dragOffset, appMode, cameraOffset, cameraZoom]);

  // Camera pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - cameraOffset.x, y: e.clientY - cameraOffset.y });
    } else if (e.button === 0 && (e.ctrlKey || e.metaKey) && !isPanning) { // Left mouse + Ctrl for selection box
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Check if clicking on a tile - if so, don't start selection box
      const x = (e.clientX - rect.left - cameraOffset.x) / cameraZoom;
      const y = (e.clientY - rect.top - cameraOffset.y) / cameraZoom;
      
      const clickedTile = tiles.find(tile => 
        x >= tile.transform.x && 
        x <= tile.transform.x + tile.transform.width &&
        y >= tile.transform.y && 
        y <= tile.transform.y + tile.transform.height
      );
      
      // Only start selection box if NOT clicking on a tile
      if (!clickedTile) {
        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
      }
    }
  }, [cameraOffset, cameraZoom, isPanning, tiles]);

  const handleMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCameraOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - cameraOffset.x) / cameraZoom;
      const y = (e.clientY - rect.top - cameraOffset.y) / cameraZoom;
      
      setSelectionEnd({ x, y });
      
      // Calculate which tiles are being hovered by selection box
      const minX = Math.min(selectionStart.x, x);
      const maxX = Math.max(selectionStart.x, x);
      const minY = Math.min(selectionStart.y, y);
      const maxY = Math.max(selectionStart.y, y);
      
      const hoveredInBox = tiles
        .filter(tile => tile.layer === currentLayer)
        .filter(tile => 
          tile.transform.x < maxX &&
          tile.transform.x + tile.transform.width > minX &&
          tile.transform.y < maxY &&
          tile.transform.y + tile.transform.height > minY
        )
        .map(tile => tile.id);
      
      setHoveredTiles(hoveredInBox);
    } else {
      handleMouseMove(e);
    }
  }, [isPanning, panStart, isSelecting, cameraOffset, cameraZoom, handleMouseMove, selectionStart, tiles, currentLayer]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      // Calculate selection box bounds
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      
      // Find tiles in the selection box on current layer
      const selectedInBox = tiles
        .filter(tile => tile.layer === currentLayer)
        .filter(tile => 
          tile.transform.x < maxX &&
          tile.transform.x + tile.transform.width > minX &&
          tile.transform.y < maxY &&
          tile.transform.y + tile.transform.height > minY
        );
      
      if (selectedInBox.length > 0) {
        const newSelectedIds = selectedInBox.map(tile => tile.id);
        setSelectedTiles(newSelectedIds);
        setTiles(prev => prev.map(tile => ({
          ...tile,
          selected: newSelectedIds.includes(tile.id)
        })));
      }
      
      setIsSelecting(false);
      setHoveredTiles([]); // Clear hover state
    }
    
    setIsDragging(false);
    setIsPanning(false);
  }, [isSelecting, selectionStart, selectionEnd, tiles, currentLayer]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Always prevent default and zoom when mouse is over canvas
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setCameraZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  }, []);

  // Update tile property (works on all selected tiles)
  const updateTileProperty = (path: string, value: any) => {
    if (selectedTiles.length === 0) return;
    
    setTiles(prev => prev.map(tile => {
      if (!selectedTiles.includes(tile.id)) return tile;
      
      // Deep clone the tile to avoid mutation
      const newTile = JSON.parse(JSON.stringify(tile));
      const pathParts = path.split('.');
      let current: any = newTile;
      
      // Navigate to the parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        if (key && !current[key]) {
          current[key] = {};
        }
        if (key) {
          current = current[key];
        }
      }
      
      // Set the final property
      const finalKey = pathParts[pathParts.length - 1];
      if (finalKey) {
        current[finalKey] = value;
      }
      return newTile;
    }));
  };

  const deleteSelectedTiles = () => {
    if (selectedTiles.length > 0) {
      setTiles(prev => prev.filter(tile => !selectedTiles.includes(tile.id)));
      setSelectedTiles([]);
    }
  };

  const clearCanvas = () => {
    setTiles([]);
    setMeshes([]);
    setSelectedTiles([]);
  };

  // Create mesh from selected tiles
  const createMeshFromSelected = () => {
    if (selectedTiles.length < 2) return;
    
    const meshId = generateId();
    const meshName = `Mesh_${meshes.length + 1}`;
    
    // Create the mesh
    const newMesh: Mesh = {
      id: meshId,
      tileIds: [...selectedTiles],
      name: meshName
    };
    
    // Update tiles to be part of the mesh
    setTiles(prev => prev.map(tile => 
      selectedTiles.includes(tile.id) 
        ? { ...tile, meshId, selected: false }
        : tile
    ));
    
    setMeshes(prev => [...prev, newMesh]);
    setSelectedTiles([]);
  };

  // Rename functionality
  const startRename = (id: string, currentName: string) => {
    setEditingName(id);
    setEditingValue(currentName);
  };

  const finishRename = () => {
    if (editingName && editingValue.trim()) {
      // Update tile name
      setTiles(prev => prev.map(tile => 
        tile.id === editingName 
          ? { ...tile, name: editingValue.trim() }
          : tile
      ));
      // Update mesh name
      setMeshes(prev => prev.map(mesh => 
        mesh.id === editingName 
          ? { ...mesh, name: editingValue.trim() }
          : mesh
      ));
    }
    setEditingName(null);
    setEditingValue('');
  };

  const cancelRename = () => {
    setEditingName(null);
    setEditingValue('');
  };

  // Get selected tile for property editor (first selected if multiple)
  const selectedTileData = selectedTiles.length > 0 ? tiles.find(t => t.id === selectedTiles[0]) : null;

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
    <div className="terminal-container" style={{ margin: '20px', maxWidth: '1400px', minHeight: '700px' }}>
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
                  background: currentLayer === layer ? 'var(--terminal-accent)' : 'transparent',
                  color: currentLayer === layer ? 'var(--terminal-bg)' : 'var(--terminal-primary)'
                }}
              >
                {layer.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--terminal-accent)', marginBottom: '8px', fontSize: '12px' }}>
              ACTIONS:
            </div>
            <button 
              className="hacker-button" 
              onClick={deleteSelectedTiles}
              disabled={selectedTiles.length === 0}
              style={{ 
                display: 'block', 
                width: '100%', 
                marginBottom: '4px', 
                fontSize: '10px', 
                opacity: selectedTiles.length > 0 ? 1 : 0.5 
              }}
            >
              DELETE ({selectedTiles.length})
            </button>
            <button 
              className="hacker-button" 
              onClick={createMeshFromSelected}
              disabled={selectedTiles.length < 2}
              style={{ 
                display: 'block', 
                width: '100%', 
                marginBottom: '4px', 
                fontSize: '10px', 
                opacity: selectedTiles.length >= 2 ? 1 : 0.5 
              }}
            >
              CREATE MESH
            </button>
            <button 
              className="hacker-button" 
              onClick={clearCanvas}
              style={{ display: 'block', width: '100%', marginBottom: '4px', fontSize: '10px' }}
            >
              CLEAR ALL
            </button>
            <button 
              className="hacker-button" 
              onClick={() => setShowHierarchy(!showHierarchy)}
              style={{ 
                display: 'block', 
                width: '100%', 
                fontSize: '10px',
                background: showHierarchy ? 'var(--terminal-accent)' : 'transparent',
                color: showHierarchy ? 'var(--terminal-bg)' : 'var(--terminal-primary)'
              }}
            >
              HIERARCHY
            </button>
          </div>

          {/* Tile Info */}
          <div style={{ fontSize: '10px', color: 'var(--terminal-secondary)' }}>
            TILES: {tiles.length}<br/>
            MESHES: {meshes.length}<br/>
            LAYER: {currentLayer.toUpperCase()}<br/>
            SELECTED: {selectedTiles.length > 0 ? selectedTiles.length : 'NONE'}<br/>
            <br/>
            ZOOM: {Math.round(cameraZoom * 100)}%<br/>
            PAN: {Math.round(cameraOffset.x)}, {Math.round(cameraOffset.y)}
          </div>
        </div>

        {/* Main Canvas */}
        <div style={{ flex: 1, paddingLeft: '20px', paddingRight: '20px', display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: 'var(--terminal-accent)', fontSize: '12px' }}>
                QUEST CANVAS - CTRL+CLICK: MULTI-SELECT | CTRL+DRAG: SELECT BOX | MIDDLE MOUSE: PAN | SCROLL: ZOOM
              </div>
            </div>
            
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMoveCanvas}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                border: '2px solid var(--terminal-primary)',
                background: 'var(--terminal-bg)',
                position: 'relative',
                cursor: isPanning ? 'grabbing' : 
                        isSelecting ? 'crosshair' :
                        canvasMode === 'add' ? 'crosshair' : 'default',
                overflow: 'hidden'
              }}
            >
              {/* Grid Background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `
                  linear-gradient(var(--terminal-border) 1px, transparent 1px),
                  linear-gradient(90deg, var(--terminal-border) 1px, transparent 1px)
                `,
                backgroundSize: `${32 * cameraZoom}px ${32 * cameraZoom}px`,
                backgroundPosition: `${cameraOffset.x}px ${cameraOffset.y}px`,
                opacity: 0.2,
                pointerEvents: 'none'
              }} />

              {/* Unity-style Toolbar */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                display: 'flex',
                gap: '2px',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid var(--terminal-border)',
                zIndex: 999
              }}>
                {/* Select Tool */}
                <button
                  onClick={() => setCanvasMode('select')}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: canvasMode === 'select' ? 'var(--terminal-accent)' : 'transparent',
                    border: '1px solid var(--terminal-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: canvasMode === 'select' ? 'var(--terminal-bg)' : 'var(--terminal-primary)',
                    borderRadius: '2px'
                  }}
                  title="Select Tool"
                >
                  ↖
                </button>
                
                {/* Add Tile Tool */}
                <button
                  onClick={() => setCanvasMode('add')}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: canvasMode === 'add' ? 'var(--terminal-accent)' : 'transparent',
                    border: '1px solid var(--terminal-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: canvasMode === 'add' ? 'var(--terminal-bg)' : 'var(--terminal-primary)',
                    borderRadius: '2px'
                  }}
                  title="Add Tile Tool"
                >
                  +
                </button>
              </div>

              {/* Selection Box */}
              {isSelecting && selectionStart && selectionEnd && (
                <div style={{
                  position: 'absolute',
                  left: Math.min(selectionStart.x, selectionEnd.x) * cameraZoom + cameraOffset.x,
                  top: Math.min(selectionStart.y, selectionEnd.y) * cameraZoom + cameraOffset.y,
                  width: Math.abs(selectionEnd.x - selectionStart.x) * cameraZoom,
                  height: Math.abs(selectionEnd.y - selectionStart.y) * cameraZoom,
                  border: '2px dashed var(--terminal-primary)',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 1000
                }} />
              )}

              {/* Render Tiles by Layer */}
              {(['background', 'midground', 'foreground'] as LayerType[]).map(layer => (
                <div key={layer} style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${cameraZoom})`,
                  transformOrigin: '0 0'
                }}>
                  {tiles
                    .filter(tile => tile.layer === layer)
                    .map(tile => (
                      <div
                        key={tile.id}
                        onMouseDown={(e) => handleTileMouseDown(e, tile.id)}
                        style={{
                          position: 'absolute',
                          left: `${tile.transform.x}px`,
                          top: `${tile.transform.y}px`,
                          width: `${tile.transform.width}px`,
                          height: `${tile.transform.height}px`,
                          background: tile.appearance.color,
                          border: tile.selected 
                            ? '2px solid var(--terminal-accent)' 
                            : hoveredTiles.includes(tile.id)
                            ? '2px solid rgba(0, 255, 0, 0.7)'
                            : `${tile.appearance.borderWidth}px solid ${tile.appearance.borderColor}`,
                          opacity: tile.appearance.opacity * (layer === currentLayer ? 1 : 0.5),
                          cursor: 'move',
                          userSelect: 'none',
                          zIndex: layer === 'background' ? 1 : layer === 'midground' ? 2 : 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${tile.appearance.fontSize}px`,
                          color: 'var(--terminal-primary)',
                          transform: `rotate(${tile.transform.rotation}deg)`
                        }}
                      >
                        {tile.appearance.text || ''}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Scene Hierarchy */}
          {showHierarchy && (
            <div style={{ width: '200px', marginLeft: '20px', borderLeft: '1px solid var(--terminal-border)', paddingLeft: '15px' }}>
              <div style={{ color: 'var(--terminal-accent)', marginBottom: '10px', fontSize: '12px' }}>
                SCENE HIERARCHY:
              </div>
              
              {/* Tiles */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--terminal-primary)', marginBottom: '5px', fontSize: '11px' }}>
                  TILES ({tiles.filter(t => !t.meshId).length}):
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '10px' }}>
                  {tiles.filter(t => !t.meshId).map(tile => (
                    <div
                      key={tile.id}
                      onClick={() => setSelectedTiles([tile.id])}
                      onDoubleClick={() => startRename(tile.id, tile.name)}
                      style={{
                        padding: '2px 5px',
                        cursor: 'pointer',
                        background: selectedTiles.includes(tile.id) ? 'var(--terminal-accent)' : 'transparent',
                        color: selectedTiles.includes(tile.id) ? 'var(--terminal-bg)' : 'var(--terminal-secondary)',
                        marginBottom: '1px',
                        border: '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedTiles.includes(tile.id)) {
                          e.currentTarget.style.border = '1px solid var(--terminal-border)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedTiles.includes(tile.id)) {
                          e.currentTarget.style.border = '1px solid transparent';
                        }
                      }}
                    >
                      {editingName === tile.id ? (
                        <input
                          className="hacker-input"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={finishRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          autoFocus
                          style={{
                            fontSize: '10px',
                            padding: '1px 3px',
                            width: '100%',
                            background: 'var(--terminal-bg)',
                            border: '1px solid var(--terminal-accent)'
                          }}
                        />
                      ) : (
                        `${tile.name} [${tile.layer}]`
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Meshes */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--terminal-primary)', marginBottom: '5px', fontSize: '11px' }}>
                  MESHES ({meshes.length}):
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '10px' }}>
                  {meshes.map(mesh => (
                    <div
                      key={mesh.id}
                      onDoubleClick={() => startRename(mesh.id, mesh.name)}
                      style={{
                        padding: '2px 5px',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: 'var(--terminal-secondary)',
                        marginBottom: '1px',
                        border: '1px solid var(--terminal-border)'
                      }}
                    >
                      {editingName === mesh.id ? (
                        <input
                          className="hacker-input"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={finishRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          autoFocus
                          style={{
                            fontSize: '10px',
                            padding: '1px 3px',
                            width: '100%',
                            background: 'var(--terminal-bg)',
                            border: '1px solid var(--terminal-accent)'
                          }}
                        />
                      ) : (
                        `${mesh.name} (${mesh.tileIds.length} tiles)`
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties Editor */}
        <div style={{ width: '250px', paddingLeft: '20px', borderLeft: '1px solid var(--terminal-border)', fontSize: '11px' }}>
          <div style={{ color: 'var(--terminal-accent)', marginBottom: '10px', fontSize: '12px' }}>
            TILE PROPERTIES:
          </div>
          
          {selectedTileData ? (
            <>
              {/* Transform */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--terminal-primary)', marginBottom: '5px' }}>TRANSFORM:</div>
                <div style={{ marginBottom: '3px' }}>
                  Width: 
                  <input 
                    className="hacker-input" 
                    type="number" 
                    value={selectedTileData.transform.width}
                    onChange={(e) => updateTileProperty('transform.width', parseInt(e.target.value) || 32)}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '60px' }}
                  />
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Height: 
                  <input 
                    className="hacker-input" 
                    type="number" 
                    value={selectedTileData.transform.height}
                    onChange={(e) => updateTileProperty('transform.height', parseInt(e.target.value) || 32)}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '60px' }}
                  />
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Rotation: 
                  <input 
                    className="hacker-input" 
                    type="number" 
                    value={selectedTileData.transform.rotation}
                    onChange={(e) => updateTileProperty('transform.rotation', parseInt(e.target.value) || 0)}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '60px' }}
                  />
                </div>
              </div>

              {/* Appearance */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--terminal-primary)', marginBottom: '5px' }}>APPEARANCE:</div>
                <div style={{ marginBottom: '3px' }}>
                  Color: 
                  <input 
                    className="hacker-input" 
                    type="color" 
                    value={selectedTileData.appearance.color}
                    onChange={(e) => updateTileProperty('appearance.color', e.target.value)}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '60px' }}
                  />
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Opacity: 
                  <input 
                    className="hacker-input" 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={selectedTileData.appearance.opacity}
                    onChange={(e) => updateTileProperty('appearance.opacity', parseFloat(e.target.value))}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '80px' }}
                  />
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Text: 
                  <input 
                    className="hacker-input" 
                    type="text" 
                    value={selectedTileData.appearance.text || ''}
                    onChange={(e) => updateTileProperty('appearance.text', e.target.value)}
                    style={{ fontSize: '10px', padding: '2px', marginLeft: '5px', width: '100px' }}
                  />
                </div>
              </div>

              {/* System Toggles */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--terminal-primary)', marginBottom: '5px' }}>SYSTEMS:</div>
                <div style={{ fontSize: '10px', color: 'var(--terminal-secondary)' }}>
                  [ ] Physics<br/>
                  [ ] Events<br/>
                  [ ] Effects<br/>
                  [ ] Meshing
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '10px', color: 'var(--terminal-secondary)' }}>
              Select a tile to edit properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};