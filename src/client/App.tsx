import React, { useState, useRef } from 'react';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { LayerType } from './hooks/useTileManager';
import { Header } from './components/ui/Header';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';

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
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
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

  // Handle name editing
  const handleEditName = (id: string, currentName: string) => {
    setEditingName(id);
    setEditingValue(currentName);
  };

  const handleSaveName = () => {
    if (editingName) {
      tileManager.updateTileProperty('name', editingValue);
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
        <Header appMode={appMode} setAppMode={setAppMode} />
        <div className="terminal-content" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ color: 'var(--terminal-accent)', fontSize: '24px', marginBottom: '20px' }}>
            PLAYER MODE
          </div>
          <div style={{ color: 'var(--terminal-secondary)', fontSize: '14px' }}>
            Player mode functionality coming soon...
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
      <Header appMode={appMode} setAppMode={setAppMode} />
      
      <div className="terminal-content" style={{ display: 'flex', height: '640px' }}>
        <LeftPanel
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          cameraZoom={cameraZoom}
          tileManager={tileManager}
          showHierarchy={showHierarchy}
          setShowHierarchy={setShowHierarchy}
          editingName={editingName}
          editingValue={editingValue}
          setEditingName={setEditingName}
          setEditingValue={setEditingValue}
          handleEditName={handleEditName}
          handleSaveName={handleSaveName}
        />

        <Canvas
          canvasRef={canvasRef}
          currentLayer={currentLayer}
          cameraOffset={cameraOffset}
          cameraZoom={cameraZoom}
          interaction={interaction}
          tileManager={tileManager}
          handleCanvasClick={handleCanvasClick}
          handleDoubleClick={handleDoubleClick}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleWheelZoom={handleWheelZoom}
        />

        <RightPanel
          tileManager={tileManager}
          selectedTiles={selectedTiles}
          firstTile={firstTile}
          isMultiple={isMultiple}
          center={center}
          updateTilePropertyEnhanced={updateTilePropertyEnhanced}
        />
      </div>
    </div>
  );
};