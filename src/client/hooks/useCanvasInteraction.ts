import { useCallback } from 'react';
import { useInteractionState } from './useInteractionState';
import { useTileManager, LayerType } from './useTileManager';

interface CanvasInteractionProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  cameraOffset: { x: number; y: number };
  cameraZoom: number;
  setCameraOffset: (offset: { x: number; y: number }) => void;
  canvasWidth: number;
  canvasHeight: number;
  currentLayer: LayerType;
}

export const useCanvasInteraction = ({
  canvasRef,
  cameraOffset,
  cameraZoom,
  setCameraOffset,
  canvasWidth,
  canvasHeight,
  currentLayer
}: CanvasInteractionProps) => {
  const interaction = useInteractionState();
  const tileManager = useTileManager(currentLayer);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - cameraOffset.x) / cameraZoom,
      y: (screenY - rect.top - cameraOffset.y) / cameraZoom
    };
  }, [canvasRef, cameraOffset, cameraZoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks if we're not in another interaction mode
    if (interaction.state.mode !== 'idle') return;
    
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedTile = tileManager.getTileAt(worldPos.x, worldPos.y, currentLayer);

    if (clickedTile) {
      // Handle tile selection
      const isMultiSelect = e.ctrlKey || e.metaKey;
      tileManager.selectTile(clickedTile.id, isMultiSelect);
    } else {
      // Handle empty space click
      if (interaction.state.canvasMode === 'add' && !e.ctrlKey && !e.metaKey) {
        // Create new tile
        const newTile = tileManager.createTile(worldPos.x, worldPos.y);
        tileManager.addTile(newTile);
      } else if (!e.ctrlKey && !e.metaKey && interaction.state.canvasMode === 'select') {
        // Clear selection only if not holding Ctrl (Ctrl+click in empty space should not clear)
        tileManager.clearSelection();
      }
    }
  }, [interaction.state, screenToWorld, tileManager, currentLayer]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only handle double-clicks on tiles when in idle mode
    if (interaction.state.mode !== 'idle') return;
    
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedTile = tileManager.getTileAt(worldPos.x, worldPos.y, currentLayer);
    
    if (clickedTile) {
      // Select the tile and enter resize mode
      tileManager.selectTile(clickedTile.id, false);
      
      // Start resize mode with the southeast handle by default
      interaction.startResizing(
        clickedTile.id,
        'se', // default to bottom-right corner
        worldPos.x,
        worldPos.y,
        clickedTile.transform.x,
        clickedTile.transform.y,
        clickedTile.transform.width,
        clickedTile.transform.height
      );
    }
  }, [interaction, screenToWorld, tileManager, currentLayer]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent the click event from firing if we're starting a special interaction
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedTile = tileManager.getTileAt(worldPos.x, worldPos.y, currentLayer);
    
    if (e.button === 1) { // Middle mouse - pan
      e.preventDefault();
      if (interaction.canStart('panning')) {
        interaction.startPanning(e.clientX - cameraOffset.x, e.clientY - cameraOffset.y);
      }
    } else if (e.button === 0) { // Left mouse
      if (e.ctrlKey || e.metaKey) {
        if (!clickedTile && interaction.canStart('box-selecting')) {
          // Start box selection only in empty space with Ctrl
          e.preventDefault(); // Prevent click event
          interaction.startBoxSelecting(worldPos.x, worldPos.y);
        }
        // If Ctrl+clicking on tile, let the click handler manage selection
      } else if (clickedTile && interaction.canStart('dragging')) {
        // Start dragging - prevent click to avoid selection conflicts
        e.preventDefault();
        if (!tileManager.selectedTiles.includes(clickedTile.id)) {
          tileManager.selectTile(clickedTile.id, false);
        }
        
        const offsetX = worldPos.x - clickedTile.transform.x;
        const offsetY = worldPos.y - clickedTile.transform.y;
        interaction.startDragging(clickedTile.id, worldPos.x, worldPos.y, offsetX, offsetY);
      }
    }
  }, [interaction, screenToWorld, tileManager, cameraOffset, currentLayer]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    switch (interaction.state.mode) {
      case 'panning':
        if (interaction.state.panData) {
          setCameraOffset({
            x: e.clientX - interaction.state.panData.startX,
            y: e.clientY - interaction.state.panData.startY
          });
        }
        break;

      case 'dragging':
        if (interaction.state.dragData && tileManager.selectedTiles.length > 0) {
          const deltaX = worldPos.x - interaction.state.dragData.startX;
          const deltaY = worldPos.y - interaction.state.dragData.startY;
          
          tileManager.moveTiles(
            tileManager.selectedTiles,
            deltaX,
            deltaY,
            canvasWidth,
            canvasHeight,
            cameraZoom
          );
          
          // Update drag start position for next move
          interaction.startDragging(
            interaction.state.dragData.tileId,
            worldPos.x,
            worldPos.y,
            interaction.state.dragData.offsetX,
            interaction.state.dragData.offsetY
          );
        }
        break;

      case 'box-selecting':
        interaction.updateBoxSelect(worldPos.x, worldPos.y);
        break;

      case 'resizing':
        if (interaction.state.resizeData) {
          const { tileId, handle, startX, startY, originalX, originalY, originalWidth, originalHeight } = interaction.state.resizeData;
          const deltaX = worldPos.x - startX;
          const deltaY = worldPos.y - startY;
          
          // Calculate new dimensions and position based on handle
          let newWidth = originalWidth;
          let newHeight = originalHeight;
          let newX = originalX;
          let newY = originalY;
          
          switch (handle) {
            case 'se': // bottom-right
              newWidth = Math.max(10, originalWidth + deltaX);
              newHeight = Math.max(10, originalHeight + deltaY);
              break;
            case 'sw': // bottom-left
              newWidth = Math.max(10, originalWidth - deltaX);
              newHeight = Math.max(10, originalHeight + deltaY);
              newX = originalX + originalWidth - newWidth; // maintain right edge position
              break;
            case 'ne': // top-right
              newWidth = Math.max(10, originalWidth + deltaX);
              newHeight = Math.max(10, originalHeight - deltaY);
              newY = originalY + originalHeight - newHeight; // maintain bottom edge position
              break;
            case 'nw': // top-left
              newWidth = Math.max(10, originalWidth - deltaX);
              newHeight = Math.max(10, originalHeight - deltaY);
              newX = originalX + originalWidth - newWidth; // maintain right edge position
              newY = originalY + originalHeight - newHeight; // maintain bottom edge position
              break;
            case 'e': // right edge
              newWidth = Math.max(10, originalWidth + deltaX);
              break;
            case 'w': // left edge
              newWidth = Math.max(10, originalWidth - deltaX);
              newX = originalX + originalWidth - newWidth; // maintain right edge position
              break;
            case 's': // bottom edge
              newHeight = Math.max(10, originalHeight + deltaY);
              break;
            case 'n': // top edge
              newHeight = Math.max(10, originalHeight - deltaY);
              newY = originalY + originalHeight - newHeight; // maintain bottom edge position
              break;
          }
          
          // Apply the resize by directly updating the specific tile
          const tile = tileManager.tiles.find(t => t.id === tileId);
          if (tile) {
            // Update the tile's transform properties
            const updates: any = { 
              width: newWidth, 
              height: newHeight,
              x: newX,
              y: newY
            };
            
            // Use the existing property update system but ensure the tile is selected
            const wasSelected = tileManager.selectedTiles.includes(tileId);
            if (!wasSelected) {
              tileManager.selectTile(tileId, false);
            }
            
            Object.entries(updates).forEach(([key, value]) => {
              tileManager.updateTileProperty(`transform.${key}`, value);
            });
            
            // Restore original selection if needed
            if (!wasSelected) {
              tileManager.clearSelection();
            }
          }
        }
        break;
    }
  }, [interaction, screenToWorld, tileManager, setCameraOffset, canvasWidth, canvasHeight, cameraZoom]);

  const handleMouseUp = useCallback(() => {
    switch (interaction.state.mode) {
      case 'box-selecting':
        if (interaction.state.boxSelectData) {
          const { startX, startY, endX, endY } = interaction.state.boxSelectData;
          const minX = Math.min(startX, endX);
          const maxX = Math.max(startX, endX);
          const minY = Math.min(startY, endY);
          const maxY = Math.max(startY, endY);
          
          const selectedInBox = tileManager.getTilesInBox(minX, minY, maxX, maxY, currentLayer);
          if (selectedInBox.length > 0) {
            const selectedIds = selectedInBox.map(tile => tile.id);
            tileManager.selectTiles(selectedIds);
          }
        }
        break;
      
      case 'resizing':
        // End resize mode
        break;
    }
    
    interaction.setIdle();
  }, [interaction, tileManager, currentLayer]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // Wheel handling would be passed back to parent component
  }, []);

  return {
    interaction,
    tileManager,
    handleCanvasClick,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    screenToWorld
  };
};