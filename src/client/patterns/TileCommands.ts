import { Command } from './Command';
import { Tile, Transform } from '../hooks/useTileManager';

// Transform command for moving tiles
export class TransformTilesCommand implements Command {
  public description: string;
  
  constructor(
    private tiles: Tile[],
    private oldTransforms: Transform[],
    private newTransforms: Transform[],
    private updateTileFn: (id: string, transform: Transform) => void
  ) {
    this.description = `Transform ${tiles.length} tile(s)`;
  }

  execute(): void {
    this.tiles.forEach((tile, index) => {
      if (this.newTransforms[index]) {
        this.updateTileFn(tile.id, this.newTransforms[index]);
      }
    });
  }

  undo(): void {
    this.tiles.forEach((tile, index) => {
      if (this.oldTransforms[index]) {
        this.updateTileFn(tile.id, this.oldTransforms[index]);
      }
    });
  }
}

// Create tile command
export class CreateTileCommand implements Command {
  public description = 'Create tile';
  
  constructor(
    private tile: Tile,
    private addTileFn: (tile: Tile) => void,
    private removeTileFn: (id: string) => void
  ) {}

  execute(): void {
    this.addTileFn(this.tile);
  }

  undo(): void {
    this.removeTileFn(this.tile.id);
  }
}

// Delete tiles command
export class DeleteTilesCommand implements Command {
  public description: string;
  
  constructor(
    private tiles: Tile[],
    private addTilesFn: (tiles: Tile[]) => void,
    private removeTilesFn: (ids: string[]) => void
  ) {
    this.description = `Delete ${tiles.length} tile(s)`;
  }

  execute(): void {
    this.removeTilesFn(this.tiles.map(t => t.id));
  }

  undo(): void {
    this.addTilesFn(this.tiles);
  }
}

// Property update command
export class UpdateTilePropertyCommand implements Command {
  public description: string;
  
  constructor(
    private tileIds: string[],
    private propertyPath: string,
    private oldValues: any[],
    private newValue: any,
    private updatePropertyFn: (id: string, path: string, value: any) => void,
    private getPropertyFn: (id: string, path: string) => any
  ) {
    this.description = `Update ${propertyPath} for ${tileIds.length} tile(s)`;
  }

  execute(): void {
    this.tileIds.forEach(id => {
      this.updatePropertyFn(id, this.propertyPath, this.newValue);
    });
  }

  undo(): void {
    this.tileIds.forEach((id, index) => {
      if (this.oldValues[index] !== undefined) {
        this.updatePropertyFn(id, this.propertyPath, this.oldValues[index]);
      }
    });
  }
}