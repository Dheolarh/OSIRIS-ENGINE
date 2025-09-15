import { useState, useCallback } from 'react';

export type InteractionMode = 'idle' | 'selecting' | 'dragging' | 'panning' | 'box-selecting' | 'resizing';
export type CanvasMode = 'select' | 'add';

export interface InteractionState {
  mode: InteractionMode;
  canvasMode: CanvasMode;
  dragData?: {
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    tileId: string;
  };
  panData?: {
    startX: number;
    startY: number;
  };
  boxSelectData?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  resizeData?: {
    tileId: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    originalWidth: number;
    originalHeight: number;
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w'; // resize handle position
  };
}

export const useInteractionState = () => {
  const [state, setState] = useState<InteractionState>({
    mode: 'idle',
    canvasMode: 'select'
  });

  const setCanvasMode = useCallback((mode: CanvasMode) => {
    setState(prev => ({
      ...prev,
      canvasMode: mode,
      mode: 'idle' // Reset to idle when switching tools
    }));
  }, []);

  const startDragging = useCallback((tileId: string, startX: number, startY: number, offsetX: number, offsetY: number) => {
    setState(prev => ({
      ...prev,
      mode: 'dragging',
      dragData: { tileId, startX, startY, offsetX, offsetY }
    }));
  }, []);

  const startPanning = useCallback((startX: number, startY: number) => {
    setState(prev => ({
      ...prev,
      mode: 'panning',
      panData: { startX, startY }
    }));
  }, []);

  const startBoxSelecting = useCallback((startX: number, startY: number) => {
    setState(prev => ({
      ...prev,
      mode: 'box-selecting',
      boxSelectData: { startX, startY, endX: startX, endY: startY }
    }));
  }, []);

  const updateBoxSelect = useCallback((endX: number, endY: number) => {
    setState(prev => {
      if (prev.mode !== 'box-selecting' || !prev.boxSelectData) return prev;
      return {
        ...prev,
        boxSelectData: {
          ...prev.boxSelectData,
          endX,
          endY
        }
      };
    });
  }, []);

  const setIdle = useCallback(() => {
    setState(prev => ({
      canvasMode: prev.canvasMode,
      mode: 'idle'
    }));
  }, []);

  const canStart = useCallback((newMode: InteractionMode) => {
    // Define which modes can interrupt others
    const currentMode = state.mode;
    
    if (currentMode === 'idle') return true;
    if (newMode === 'panning') return true; // Middle mouse always works
    
    return false;
  }, [state.mode]);

  const startResizing = useCallback((tileId: string, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w', startX: number, startY: number, originalX: number, originalY: number, originalWidth: number, originalHeight: number) => {
    setState({
      canvasMode: state.canvasMode,
      mode: 'resizing',
      resizeData: {
        tileId,
        handle,
        startX,
        startY,
        originalX,
        originalY,
        originalWidth,
        originalHeight
      }
    });
  }, [state.canvasMode]);

  return {
    state,
    setCanvasMode,
    startDragging,
    startPanning,
    startBoxSelecting,
    updateBoxSelect,
    startResizing,
    setIdle,
    canStart
  };
};