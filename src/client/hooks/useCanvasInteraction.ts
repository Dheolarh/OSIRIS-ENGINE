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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    screenToWorld
  };
};