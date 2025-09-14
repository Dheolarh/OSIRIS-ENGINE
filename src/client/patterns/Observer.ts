// Observer pattern for state change notifications
export interface Observer<T> {
  update(data: T): void;
}

export interface Subject<T> {
  subscribe(observer: Observer<T>): () => void;
  notify(data: T): void;
}

export class StateSubject<T> implements Subject<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  notify(data: T): void {
    this.observers.forEach(observer => observer.update(data));
  }
}

// State change event types
export interface TileStateChange {
  type: 'tile_selected' | 'tile_deselected' | 'tile_moved' | 'tile_created' | 'tile_deleted' | 'tiles_transformed';
  tileIds: string[];
  data?: any;
}

export interface InteractionStateChange {
  type: 'mode_changed' | 'drag_started' | 'drag_ended' | 'pan_started' | 'pan_ended' | 'box_select_started' | 'box_select_ended';
  mode: string;
  data?: any;
}

// Global state observers
export const tileStateSubject = new StateSubject<TileStateChange>();
export const interactionStateSubject = new StateSubject<InteractionStateChange>();