import React from 'react';
import { Tile, LayerType } from '../../hooks/useTileManager';

interface CanvasTilesProps {
  tiles: Tile[];
  selectedTiles: string[];
  currentLayer: LayerType;
}

export const CanvasTiles: React.FC<CanvasTilesProps> = ({ tiles, selectedTiles, currentLayer }) => {
  return (
    <>
      {tiles
        .filter(tile => tile.layer === currentLayer)
        .map(tile => {
          const shadowStyle = tile.appearance.shadow?.enabled 
            ? `${tile.appearance.shadow.offsetX}px ${tile.appearance.shadow.offsetY}px ${tile.appearance.shadow.blur}px ${tile.appearance.shadow.color}` 
            : 'none';
          
          return (
            <div
              key={tile.id}
              style={{
                position: 'absolute',
                left: tile.transform.x,
                top: tile.transform.y,
                width: tile.transform.width,
                height: tile.transform.height,
                backgroundColor: tile.appearance.color,
                border: selectedTiles.includes(tile.id) 
                  ? '2px solid var(--terminal-accent)' 
                  : tile.appearance.borderWidth 
                    ? `${tile.appearance.borderWidth}px solid ${tile.appearance.borderColor}` 
                    : 'none',
                borderRadius: tile.appearance.borderRadius || 0,
                opacity: tile.appearance.opacity,
                cursor: 'pointer',
                boxShadow: shadowStyle,
                pointerEvents: 'auto'
              }}
            />
          );
        })}
    </>
  );
};