import { useState, useCallback, useEffect } from 'react';
import { tileStateSubject, TileStateChange } from '../patterns/Observer';
import { commandManager } from '../patterns/Command';
import { 
  TransformTilesCommand, 
  CreateTileCommand, 
  DeleteTilesCommand, 
  UpdateTilePropertyCommand 
} from '../patterns/TileCommands';

// Re-export types from original useTileManager
export * from './useTileManager';

// Enhanced multi-object transform data
export interface MultiObjectTransform {
  centerX: number;
  centerY: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  avgRotation: number;
  isUniform: boolean; // true if all objects have same dimensions
}

// Enhanced tile manager with better transform handling
export const useEnhancedTileManager = () => {
  // ... (include all original state and methods)
  
  // Calculate transform data for multiple selected objects
  const getMultiObjectTransform = useCallback((selectedTileIds: string[], tiles: any[]): MultiObjectTransform | null => {
    if (selectedTileIds.length === 0) return null;
    
    const selectedTiles = tiles.filter(tile => selectedTileIds.includes(tile.id));
    if (selectedTiles.length === 0) return null;
    
    // Calculate bounding box center
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
    }, { 
      minX: Infinity, 
      maxX: -Infinity, 
      minY: Infinity, 
      maxY: -Infinity 
    });
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Calculate dimension ranges
    const widths = selectedTiles.map(tile => tile.transform.width);
    const heights = selectedTiles.map(tile => tile.transform.height);
    const rotations = selectedTiles.map(tile => tile.transform.rotation);
    
    const minWidth = Math.min(...widths);
    const maxWidth = Math.max(...widths);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const avgRotation = rotations.reduce((sum, rot) => sum + rot, 0) / rotations.length;
    
    const isUniform = minWidth === maxWidth && minHeight === maxHeight;
    
    return {
      centerX,
      centerY,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      avgRotation,
      isUniform
    };
  }, []);
  
  // Enhanced transform update that handles multiple objects properly
  const updateMultiObjectTransform = useCallback((
    selectedTileIds: string[],
    tiles: any[],
    setTiles: any,
    transformType: 'position' | 'scale' | 'rotation',
    value: any
  ) => {
    if (selectedTileIds.length === 0) return;
    
    const selectedTiles = tiles.filter(tile => selectedTileIds.includes(tile.id));
    const multiTransform = getMultiObjectTransform(selectedTileIds, tiles);
    
    if (!multiTransform) return;
    
    const oldTransforms = selectedTiles.map(tile => ({ ...tile.transform }));
    
    const newTransforms = selectedTiles.map(tile => {
      const newTransform = { ...tile.transform };
      
      switch (transformType) {
        case 'position':
          if (selectedTileIds.length === 1) {
            // Single object - direct positioning
            newTransform.x = value.x ?? newTransform.x;
            newTransform.y = value.y ?? newTransform.y;
          } else {
            // Multiple objects - maintain relative positions
            const offsetX = value.x ? value.x - multiTransform.centerX : 0;
            const offsetY = value.y ? value.y - multiTransform.centerY : 0;
            newTransform.x += offsetX;
            newTransform.y += offsetY;
          }
          break;
          
        case 'scale':
          if (multiTransform.isUniform) {
            // All objects same size - uniform scaling
            newTransform.width = value.width ?? newTransform.width;
            newTransform.height = value.height ?? newTransform.height;
          } else {
            // Different sizes - proportional scaling
            const scaleX = value.width ? value.width / multiTransform.minWidth : 1;
            const scaleY = value.height ? value.height / multiTransform.minHeight : 1;
            newTransform.width *= scaleX;
            newTransform.height *= scaleY;
          }
          break;
          
        case 'rotation':
          if (selectedTileIds.length === 1) {
            newTransform.rotation = value;
          } else {
            // Multi-object rotation around center
            const rotationDiff = value - multiTransform.avgRotation;
            newTransform.rotation += rotationDiff;
          }
          break;
      }
      
      return newTransform;
    });
    
    // Create command for undo/redo
    const command = new TransformTilesCommand(
      selectedTiles,
      oldTransforms,
      newTransforms,
      (id: string, transform: any) => {
        setTiles((prev: any[]) => prev.map(tile => 
          tile.id === id ? { ...tile, transform } : tile
        ));
      }
    );
    
    // Execute with command pattern
    commandManager.execute(command);
    
    // Notify observers
    tileStateSubject.notify({
      type: 'tiles_transformed',
      tileIds: selectedTileIds,
      data: { transformType, value }
    });
  }, [getMultiObjectTransform]);
  
  return {
    // ... include all original methods
    getMultiObjectTransform,
    updateMultiObjectTransform,
    
    // Command pattern integration
    undo: () => commandManager.undo(),
    redo: () => commandManager.redo(),
    canUndo: () => commandManager.canUndo(),
    canRedo: () => commandManager.canRedo(),
    getUndoDescription: () => commandManager.getUndoDescription(),
    getRedoDescription: () => commandManager.getRedoDescription()
  };
};