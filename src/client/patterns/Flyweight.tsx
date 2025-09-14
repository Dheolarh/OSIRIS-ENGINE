// Flyweight pattern for tile rendering optimization
import React from 'react';
import { Tile, Transform, Appearance } from '../hooks/useTileManager';

// Intrinsic state (shared between tiles)
export interface TileFlyweight {
  appearance: Appearance;
  render(context: TileContext): React.ReactElement;
}

// Extrinsic state (unique per tile instance)
export interface TileContext {
  id: string;
  transform: Transform;
  selected: boolean;
  layer: string;
  name: string;
}

// Concrete flyweight implementation
export class ConcreteTileFlyweight implements TileFlyweight {
  constructor(public appearance: Appearance) {}

  render(context: TileContext): React.ReactElement {
    return React.createElement('div', {
      key: context.id,
      style: {
        position: 'absolute',
        left: context.transform.x,
        top: context.transform.y,
        width: context.transform.width,
        height: context.transform.height,
        backgroundColor: this.appearance.color,
        border: `${this.appearance.borderWidth}px solid ${
          context.selected 
            ? 'var(--terminal-accent)' 
            : this.appearance.borderColor
        }`,
        opacity: this.appearance.opacity,
        cursor: 'pointer',
        boxSizing: 'border-box',
        transform: `rotate(${context.transform.rotation}deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: this.appearance.fontSize,
        color: 'var(--terminal-primary)',
        userSelect: 'none',
        zIndex: context.selected ? 1000 : 1
      }
    }, this.appearance.text);
  }
}

// Flyweight factory to manage flyweights
export class TileFlyweightFactory {
  private flyweights = new Map<string, TileFlyweight>();

  getFlyweight(appearance: Appearance): TileFlyweight {
    const key = this.getKey(appearance);
    
    if (!this.flyweights.has(key)) {
      this.flyweights.set(key, new ConcreteTileFlyweight(appearance));
    }
    
    return this.flyweights.get(key)!;
  }

  private getKey(appearance: Appearance): string {
    return JSON.stringify({
      color: appearance.color,
      opacity: appearance.opacity,
      borderColor: appearance.borderColor,
      borderWidth: appearance.borderWidth,
      text: appearance.text,
      fontSize: appearance.fontSize
    });
  }

  getCreatedFlyweightsCount(): number {
    return this.flyweights.size;
  }

  clear(): void {
    this.flyweights.clear();
  }
}

// Global flyweight factory
export const tileFlyweightFactory = new TileFlyweightFactory();

// Helper function to render tiles using flyweights
export function renderTilesWithFlyweight(tiles: Tile[]): React.ReactElement[] {
  return tiles.map(tile => {
    const flyweight = tileFlyweightFactory.getFlyweight(tile.appearance);
    const context: TileContext = {
      id: tile.id,
      transform: tile.transform,
      selected: tile.selected,
      layer: tile.layer,
      name: tile.name
    };
    return flyweight.render(context);
  });
}