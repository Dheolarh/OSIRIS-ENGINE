import { useState, useCallback } from 'react';

export type LayerType = 'background' | 'midground' | 'foreground';

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Appearance {
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  text?: string;
  fontSize: number;
}

export interface Physics {
  collision: 'none' | 'solid' | 'trigger';
  movement?: {
    type: 'static' | 'oscillate' | 'rotate' | 'path';
    speed: number;
    config?: any;
  };
}

export interface Events {
  triggers: {
    type: 'collision' | 'timer' | 'interaction';
    condition?: any;
    actions: {
      type: 'changeProperty' | 'move' | 'destroy' | 'spawn';
      target: 'self' | 'other' | string;
      data: any;
    }[];
  }[];
}

export interface Effects {
  glow?: { color: string; intensity: number };
  pulse?: { speed: number; scale: number };
  trail?: { length: number; color: string };
}

export interface Tile {
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

export interface Mesh {
  id: string;
  tileIds: string[];
  name: string;
  physics?: Physics;
  events?: Events;
}

const DEFAULT_TILE_SIZE = 20;

export const useTileManager = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [meshes, setMeshes] = useState<Mesh[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [currentLayer, setCurrentLayer] = useState<LayerType>('midground');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createTile = useCallback((x: number, y: number): Tile => ({
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
  }), [tiles.length, currentLayer]);

  const addTile = useCallback((tile: Tile) => {
    setTiles(prev => [...prev, tile]);
    setSelectedTiles([tile.id]);
    setTiles(prev => prev.map(t => ({
      ...t,
      selected: t.id === tile.id
    })));
  }, []);

  const selectTile = useCallback((tileId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedTiles(prev => {
        if (prev.includes(tileId)) {
          return prev.filter(id => id !== tileId);
        } else {
          return [...prev, tileId];
        }
      });
      setTiles(prev => prev.map(tile => ({
        ...tile,
        selected: tile.id === tileId ? !tile.selected : tile.selected
      })));
    } else {
      setSelectedTiles([tileId]);
      setTiles(prev => prev.map(tile => ({
        ...tile,
        selected: tile.id === tileId
      })));
    }
  }, []);

  const selectTiles = useCallback((tileIds: string[]) => {
    setSelectedTiles(tileIds);
    setTiles(prev => prev.map(tile => ({
      ...tile,
      selected: tileIds.includes(tile.id)
    })));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTiles([]);
    setTiles(prev => prev.map(tile => ({ ...tile, selected: false })));
  }, []);

  const moveTiles = useCallback((tileIds: string[], deltaX: number, deltaY: number, canvasWidth: number, canvasHeight: number, cameraZoom: number) => {
    setTiles(prev => prev.map(tile => {
      if (!tileIds.includes(tile.id)) return tile;
      
      const newX = tile.transform.x + deltaX;
      const newY = tile.transform.y + deltaY;
      
      return {
        ...tile,
        transform: {
          ...tile.transform,
          x: Math.max(0, Math.min(newX, canvasWidth / cameraZoom - tile.transform.width)),
          y: Math.max(0, Math.min(newY, canvasHeight / cameraZoom - tile.transform.height))
        }
      };
    }));
  }, []);

  const updateTileProperty = useCallback((path: string, value: any) => {
    if (selectedTiles.length === 0) return;
    
    setTiles(prev => prev.map(tile => {
      if (!selectedTiles.includes(tile.id)) return tile;
      
      const newTile = JSON.parse(JSON.stringify(tile));
      const pathParts = path.split('.');
      let current: any = newTile;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        if (key && !current[key]) {
          current[key] = {};
        }
        if (key) {
          current = current[key];
        }
      }
      
      const finalKey = pathParts[pathParts.length - 1];
      if (finalKey) {
        current[finalKey] = value;
      }
      return newTile;
    }));
  }, [selectedTiles]);

  const deleteTiles = useCallback((tileIds: string[]) => {
    setTiles(prev => prev.filter(tile => !tileIds.includes(tile.id)));
    setSelectedTiles(prev => prev.filter(id => !tileIds.includes(id)));
  }, []);

  const deleteSelectedTiles = useCallback(() => {
    if (selectedTiles.length > 0) {
      deleteTiles(selectedTiles);
    }
  }, [selectedTiles, deleteTiles]);

  const clearAll = useCallback(() => {
    setTiles([]);
    setMeshes([]);
    setSelectedTiles([]);
  }, []);

  const createMeshFromSelected = useCallback(() => {
    if (selectedTiles.length < 2) return;
    
    const meshId = generateId();
    const meshName = `Mesh_${meshes.length + 1}`;
    
    const newMesh: Mesh = {
      id: meshId,
      tileIds: [...selectedTiles],
      name: meshName
    };
    
    setTiles(prev => prev.map(tile => 
      selectedTiles.includes(tile.id) 
        ? { ...tile, meshId, selected: false }
        : tile
    ));
    
    setMeshes(prev => [...prev, newMesh]);
    setSelectedTiles([]);
  }, [selectedTiles, meshes.length]);

  const getTileAt = useCallback((x: number, y: number): Tile | null => {
    return tiles.find(tile => 
      x >= tile.transform.x && 
      x <= tile.transform.x + tile.transform.width &&
      y >= tile.transform.y && 
      y <= tile.transform.y + tile.transform.height
    ) || null;
  }, [tiles]);

  const getTilesInBox = useCallback((minX: number, minY: number, maxX: number, maxY: number, layer?: LayerType): Tile[] => {
    return tiles
      .filter(tile => !layer || tile.layer === layer)
      .filter(tile => 
        tile.transform.x < maxX &&
        tile.transform.x + tile.transform.width > minX &&
        tile.transform.y < maxY &&
        tile.transform.y + tile.transform.height > minY
      );
  }, [tiles]);

  const duplicateTiles = useCallback((tileIds: string[]) => {
    const tilesToDuplicate = tiles.filter(tile => tileIds.includes(tile.id));
    const duplicatedTiles = tilesToDuplicate.map(tile => {
      const newTile = { ...tile };
      newTile.id = generateId();
      newTile.name = `${tile.name}_Copy`;
      newTile.transform = {
        ...tile.transform,
        x: tile.transform.x + 20, // Offset duplicated tiles
        y: tile.transform.y + 20
      };
      newTile.selected = false;
      return newTile;
    });

    setTiles(prev => [...prev, ...duplicatedTiles]);
    
    // Select the duplicated tiles
    const duplicatedIds = duplicatedTiles.map(tile => tile.id);
    setSelectedTiles(duplicatedIds);
    setTiles(prev => prev.map(tile => ({
      ...tile,
      selected: duplicatedIds.includes(tile.id)
    })));
  }, [tiles]);

  const selectedTileData = selectedTiles.length > 0 ? tiles.find(t => t.id === selectedTiles[0]) : null;

  return {
    // State
    tiles,
    meshes,
    selectedTiles,
    selectedTileData,
    currentLayer,
    
    // Actions
    setCurrentLayer,
    createTile,
    addTile,
    selectTile,
    selectTiles,
    clearSelection,
    moveTiles,
    updateTileProperty,
    deleteSelectedTiles,
    deleteTiles,
    duplicateTiles,
    clearAll,
    createMeshFromSelected,
    
    // Queries
    getTileAt,
    getTilesInBox
  };
};