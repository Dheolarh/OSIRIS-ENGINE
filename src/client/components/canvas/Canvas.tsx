import React from 'react';
import { LayerType } from '../../hooks/useTileManager';
import { useInteractionState } from '../../hooks/useInteractionState';
import { useTileManager } from '../../hooks/useTileManager';
import { ModeSwitcher } from '../ui/ModeSwitcher';
import { CanvasInfo } from '../ui/CanvasInfo';
import { ResizeHandles } from './ResizeHandles';
import { CanvasTiles } from './CanvasTiles';
import { CanvasGrid } from './CanvasGrid';
import { BoxSelection } from './BoxSelection';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  currentLayer: LayerType;
  cameraOffset: { x: number; y: number };
  cameraZoom: number;
  interaction: ReturnType<typeof useInteractionState>;
  tileManager: ReturnType<typeof useTileManager>;
  handleCanvasClick: (e: React.MouseEvent) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleWheelZoom: (e: React.WheelEvent) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  currentLayer,
  cameraOffset,
  cameraZoom,
  interaction,
  tileManager,
  handleCanvasClick,
  handleDoubleClick,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheelZoom
}) => {
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '0 20px' }}>
      {/* Unity-style Mode Switcher - Top Left */}
      <ModeSwitcher interaction={interaction} />

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
        onDoubleClick={handleDoubleClick}
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
          <CanvasGrid width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

          {/* Render all tiles */}
          <CanvasTiles 
            tiles={tileManager.tiles} 
            selectedTiles={tileManager.selectedTiles}
            currentLayer={currentLayer}
          />

          {/* Box Selection */}
          <BoxSelection interaction={interaction} />

          {/* Resize handles */}
          <ResizeHandles 
            interaction={interaction}
            tileManager={tileManager}
            canvasRef={canvasRef}
            cameraOffset={cameraOffset}
            cameraZoom={cameraZoom}
          />
        </div>
      </div>

      {/* Canvas Info */}
      <CanvasInfo 
        mode={interaction.state.mode}
        canvasMode={interaction.state.canvasMode}
        currentLayer={currentLayer}
      />
    </div>
  );
};