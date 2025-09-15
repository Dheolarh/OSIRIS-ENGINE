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
  borderRadius?: number;
  text?: string;
  fontSize: number;
  shadow?: {
    enabled: boolean;
    type: 'outer' | 'inner';
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
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
  
  // Sub-layer system
  subLayerId?: string;
}

export interface Mesh {
  id: string;
  tileIds: string[];
  name: string;
  physics?: Physics;
  events?: Events;
}

export interface SubLayer {
  id: string;
  name: string;
  parentLayer: LayerType;
  zIndex: number;
  visible: boolean;
}

const DEFAULT_TILE_SIZE = 20;

export const useTileManager = (currentLayer: LayerType = 'midground') => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [meshes, setMeshes] = useState<Mesh[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [subLayers, setSubLayers] = useState<SubLayer[]>([]);
  const [currentSubLayerId, setCurrentSubLayerId] = useState<string | null>(null);

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
      borderRadius: 0,
      fontSize: 12,
      shadow: {
        enabled: false,
        type: 'outer',
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: '#000000',
        opacity: 0.3
      }
    },
    ...(currentSubLayerId && { subLayerId: currentSubLayerId })
  }), [tiles.length, currentLayer, currentSubLayerId]);

  const addTile = useCallback((tile: Tile) => {
    setTiles(prev => [...prev, tile]);
    setSelectedTiles([tile.id]);
    setTiles(prev => prev.map(t => ({
      ...t,
      selected: t.id === tile.id
    })));
  }, []);

  const selectTile = useCallback((tileId: string, multiSelect: boolean = false) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    // Check if this tile is part of a mesh
    if (tile.meshId) {
      const mesh = meshes.find(m => m.id === tile.meshId);
      if (mesh) {
        // Select entire mesh
        const meshTileIds = mesh.tileIds;
        
        if (multiSelect) {
          setSelectedTiles(prev => {
            const meshIsSelected = meshTileIds.every(id => prev.includes(id));
            if (meshIsSelected) {
              // Deselect entire mesh
              return prev.filter(id => !meshTileIds.includes(id));
            } else {
              // Add entire mesh to selection
              const newSelection = [...prev.filter(id => !meshTileIds.includes(id)), ...meshTileIds];
              return newSelection;
            }
          });
          setTiles(prev => prev.map(t => ({
            ...t,
            selected: meshTileIds.includes(t.id) 
              ? !meshTileIds.every(id => selectedTiles.includes(id))
              : prev.find(pt => pt.id === t.id)?.selected || false
          })));
        } else {
          // Single select entire mesh
          setSelectedTiles(meshTileIds);
          setTiles(prev => prev.map(t => ({
            ...t,
            selected: meshTileIds.includes(t.id)
          })));
        }
        return;
      }
    }

    // Regular tile selection (not part of mesh)
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
  }, [tiles, meshes, selectedTiles]);

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
    setTiles(prev => {
      // Group tiles by meshId to handle mesh movement as unified groups
      const meshGroups: { [meshId: string]: Tile[] } = {};
      const individualTiles: Tile[] = [];
      
      // Categorize tiles by mesh groups
      tileIds.forEach(tileId => {
        const tile = prev.find(t => t.id === tileId);
        if (tile) {
          if (tile.meshId) {
            if (!meshGroups[tile.meshId]) {
              meshGroups[tile.meshId] = [];
            }
            meshGroups[tile.meshId]!.push(tile);
          } else {
            individualTiles.push(tile);
          }
        }
      });

      return prev.map(tile => {
        if (!tileIds.includes(tile.id)) return tile;
        
        // Handle mesh tiles - move as a unified group
        if (tile.meshId && meshGroups[tile.meshId]) {
          const meshTiles = meshGroups[tile.meshId]!;
          if (meshTiles && meshTiles.length > 0) {
            // Calculate the bounds of the entire mesh
            const minX = Math.min(...meshTiles.map(t => t.transform.x));
            const maxX = Math.max(...meshTiles.map(t => t.transform.x + t.transform.width));
            const minY = Math.min(...meshTiles.map(t => t.transform.y));
            const maxY = Math.max(...meshTiles.map(t => t.transform.y + t.transform.height));
            
            const meshWidth = maxX - minX;
            const meshHeight = maxY - minY;
            
            // Calculate constraints for the entire mesh
            const newMeshMinX = minX + deltaX;
            const newMeshMinY = minY + deltaY;
            
            const constrainedMeshMinX = Math.max(0, Math.min(newMeshMinX, canvasWidth / cameraZoom - meshWidth));
            const constrainedMeshMinY = Math.max(0, Math.min(newMeshMinY, canvasHeight / cameraZoom - meshHeight));
            
            const actualDeltaX = constrainedMeshMinX - minX;
            const actualDeltaY = constrainedMeshMinY - minY;
            
            return {
              ...tile,
              transform: {
                ...tile.transform,
                x: tile.transform.x + actualDeltaX,
                y: tile.transform.y + actualDeltaY
              }
            };
          }
        }
        
        // Handle individual tiles
        const newX = tile.transform.x + deltaX;
        const newY = tile.transform.y + deltaY;
        
        return {
          ...tile,
          transform: {
            ...tile.transform,
            x: Math.max(0, Math.min(newX, canvasWidth / cameraZoom - tile.transform.width)),
            y: Math.max(0, Math.min(newY, canvasWidth / cameraZoom - tile.transform.height))
          }
        };
      });
    });
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

  // Sub-layer management functions
  const createSubLayer = useCallback((name: string, parentLayer: LayerType, zIndex: number = 0): SubLayer => {
    const subLayer: SubLayer = {
      id: generateId(),
      name,
      parentLayer,
      zIndex,
      visible: true
    };
    
    setSubLayers(prev => [...prev, subLayer].sort((a, b) => a.zIndex - b.zIndex));
    return subLayer;
  }, []);

  const updateSubLayerZIndex = useCallback((subLayerId: string, newZIndex: number) => {
    setSubLayers(prev => prev.map(sl => 
      sl.id === subLayerId ? { ...sl, zIndex: newZIndex } : sl
    ).sort((a, b) => a.zIndex - b.zIndex));
  }, []);

  const renameSubLayer = useCallback((subLayerId: string, newName: string) => {
    setSubLayers(prev => prev.map(sl => 
      sl.id === subLayerId ? { ...sl, name: newName } : sl
    ));
  }, []);

  const toggleSubLayerVisibility = useCallback((subLayerId: string) => {
    setSubLayers(prev => prev.map(sl => 
      sl.id === subLayerId ? { ...sl, visible: !sl.visible } : sl
    ));
  }, []);

  const deleteSubLayer = useCallback((subLayerId: string) => {
    // Move all tiles in this sub-layer back to no sub-layer
    setTiles(prev => prev.map(tile => {
      if (tile.subLayerId === subLayerId) {
        const { subLayerId: _, ...tileWithoutSubLayer } = tile;
        return tileWithoutSubLayer;
      }
      return tile;
    }));
    
    setSubLayers(prev => prev.filter(sl => sl.id !== subLayerId));
    
    // Reset current sub-layer if it was deleted
    if (currentSubLayerId === subLayerId) {
      setCurrentSubLayerId(null);
    }
  }, [currentSubLayerId]);

  const getSubLayersForLayer = useCallback((layer: LayerType): SubLayer[] => {
    return subLayers.filter(sl => sl.parentLayer === layer);
  }, [subLayers]);

  const getTileAt = useCallback((x: number, y: number, layer?: LayerType): Tile | null => {
    return tiles.find(tile => 
      (!layer || tile.layer === layer) &&
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
    
    // Group tiles by mesh to handle mesh duplication properly
    const meshGroups: { [meshId: string]: Tile[] } = {};
    const individualTiles: Tile[] = [];
    
    tilesToDuplicate.forEach(tile => {
      if (tile.meshId) {
        if (!meshGroups[tile.meshId]) {
          meshGroups[tile.meshId] = [];
        }
        meshGroups[tile.meshId]!.push(tile);
      } else {
        individualTiles.push(tile);
      }
    });
    
    const duplicatedTiles: Tile[] = [];
    const newMeshes: Mesh[] = [];
    const oldToNewMeshIds: { [oldId: string]: string } = {};
    
    // Duplicate mesh groups
    Object.keys(meshGroups).forEach(oldMeshId => {
      const meshTiles = meshGroups[oldMeshId]!;
      const originalMesh = meshes.find(m => m.id === oldMeshId);
      
      if (originalMesh && meshTiles) {
        // Create new mesh
        const newMeshId = generateId();
        oldToNewMeshIds[oldMeshId] = newMeshId;
        
        const newMesh: Mesh = {
          id: newMeshId,
          name: `${originalMesh.name}_Copy`,
          tileIds: [],
          ...(originalMesh.physics && { physics: originalMesh.physics }),
          ...(originalMesh.events && { events: originalMesh.events })
        };
        
        // Duplicate tiles in this mesh
        const meshDuplicatedTiles = meshTiles.map(tile => {
          const newTile = { ...tile };
          newTile.id = generateId();
          newTile.name = `${tile.name}_Copy`;
          newTile.meshId = newMeshId;
          newTile.transform = {
            ...tile.transform,
            x: tile.transform.x + 20, // Offset duplicated tiles
            y: tile.transform.y + 20
          };
          newTile.selected = false;
          return newTile;
        });
        
        newMesh.tileIds = meshDuplicatedTiles.map(tile => tile.id);
        newMeshes.push(newMesh);
        duplicatedTiles.push(...meshDuplicatedTiles);
      }
    });
    
    // Duplicate individual tiles
    const individualDuplicatedTiles = individualTiles.map(tile => {
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
    
    duplicatedTiles.push(...individualDuplicatedTiles);

    // Update state
    setTiles(prev => [...prev, ...duplicatedTiles]);
    setMeshes(prev => [...prev, ...newMeshes]);
    
    // Select the duplicated tiles
    const duplicatedIds = duplicatedTiles.map(tile => tile.id);
    setSelectedTiles(duplicatedIds);
    setTiles(prev => prev.map(tile => ({
      ...tile,
      selected: duplicatedIds.includes(tile.id)
    })));
  }, [tiles, meshes]);

  const selectedTileData = selectedTiles.length > 0 ? tiles.find(t => t.id === selectedTiles[0]) : null;

  return {
    // State
    tiles,
    meshes,
    selectedTiles,
    selectedTileData,
    currentLayer,
    
    // Actions
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
    
    // Sub-layer functions
    subLayers,
    currentSubLayerId,
    setCurrentSubLayerId,
    createSubLayer,
    updateSubLayerZIndex,
    renameSubLayer,
    toggleSubLayerVisibility,
    deleteSubLayer,
    getSubLayersForLayer,
    
    // Queries
    getTileAt,
    getTilesInBox
  };
};