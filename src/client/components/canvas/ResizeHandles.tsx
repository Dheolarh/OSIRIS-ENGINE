import React from 'react';
import { useInteractionState } from '../../hooks/useInteractionState';
import { useTileManager } from '../../hooks/useTileManager';

interface ResizeHandlesProps {
  interaction: ReturnType<typeof useInteractionState>;
  tileManager: ReturnType<typeof useTileManager>;
  canvasRef: React.RefObject<HTMLDivElement>;
  cameraOffset: { x: number; y: number };
  cameraZoom: number;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  interaction,
  tileManager,
  canvasRef,
  cameraOffset,
  cameraZoom
}) => {
  if (interaction.state.mode !== 'resizing' || !interaction.state.resizeData) {
    return null;
  }

  const tile = tileManager.tiles.find(t => t.id === interaction.state.resizeData!.tileId);
  if (!tile) return null;

  const handleSize = 8;
  const handleStyle = {
    position: 'absolute' as const,
    width: handleSize,
    height: handleSize,
    backgroundColor: 'var(--terminal-accent)',
    border: '1px solid var(--terminal-bg)',
    zIndex: 3000,
  };

  const handleMouseDown = (handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const worldPos = {
        x: (e.clientX - rect.left - cameraOffset.x) / cameraZoom,
        y: (e.clientY - rect.top - cameraOffset.y) / cameraZoom
      };
      interaction.startHandleDragging(
        tile.id,
        handle,
        worldPos.x,
        worldPos.y,
        tile.transform.x,
        tile.transform.y,
        tile.transform.width,
        tile.transform.height
      );
    }
  };

  return (
    <>
      {/* Corner handles */}
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x - handleSize / 2,
          top: tile.transform.y - handleSize / 2,
          cursor: 'nw-resize'
        }}
        title="Resize from top-left"
        onMouseDown={handleMouseDown('nw')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x + tile.transform.width - handleSize / 2,
          top: tile.transform.y - handleSize / 2,
          cursor: 'ne-resize'
        }}
        title="Resize from top-right"
        onMouseDown={handleMouseDown('ne')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x - handleSize / 2,
          top: tile.transform.y + tile.transform.height - handleSize / 2,
          cursor: 'sw-resize'
        }}
        title="Resize from bottom-left"
        onMouseDown={handleMouseDown('sw')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x + tile.transform.width - handleSize / 2,
          top: tile.transform.y + tile.transform.height - handleSize / 2,
          cursor: 'se-resize'
        }}
        title="Resize from bottom-right"
        onMouseDown={handleMouseDown('se')}
      />

      {/* Edge handles */}
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x + tile.transform.width / 2 - handleSize / 2,
          top: tile.transform.y - handleSize / 2,
          cursor: 'n-resize'
        }}
        title="Resize from top"
        onMouseDown={handleMouseDown('n')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x + tile.transform.width / 2 - handleSize / 2,
          top: tile.transform.y + tile.transform.height - handleSize / 2,
          cursor: 's-resize'
        }}
        title="Resize from bottom"
        onMouseDown={handleMouseDown('s')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x - handleSize / 2,
          top: tile.transform.y + tile.transform.height / 2 - handleSize / 2,
          cursor: 'w-resize'
        }}
        title="Resize from left"
        onMouseDown={handleMouseDown('w')}
      />
      <div
        style={{
          ...handleStyle,
          left: tile.transform.x + tile.transform.width - handleSize / 2,
          top: tile.transform.y + tile.transform.height / 2 - handleSize / 2,
          cursor: 'e-resize'
        }}
        title="Resize from right"
        onMouseDown={handleMouseDown('e')}
      />
    </>
  );
};