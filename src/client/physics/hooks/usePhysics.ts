import { useState, useEffect, useRef } from 'react';
import { MatterPhysicsManager } from '../components/MatterPhysicsManager';
import { PhysicsBody, PhysicsSettings } from '../types/PhysicsTypes';

export interface UsePhysicsReturn {
  physicsManager: MatterPhysicsManager;
  isPhysicsEnabled: boolean;
  setPhysicsEnabled: (enabled: boolean) => void;
  createPhysicsBody: (tileId: string, properties?: Partial<PhysicsBody>) => PhysicsBody | null;
  removePhysicsBody: (tileId: string) => void;
  getPhysicsBody: (tileId: string) => PhysicsBody | undefined;
  hasPhysicsBody: (tileId: string) => boolean;
  updatePhysicsSettings: (settings: Partial<PhysicsSettings>) => void;
  physicsSettings: PhysicsSettings;
  syncTileWithPhysics: (tileId: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;
  getPhysicsPosition: (tileId: string) => { x: number; y: number } | undefined;
}

export const usePhysics = (): UsePhysicsReturn => {
  const physicsManagerRef = useRef<MatterPhysicsManager | null>(null);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>(() => {
    return physicsManagerRef.current?.getSettings() || {
      gravity: { x: 0, y: 9.81 },
      timeStep: 1/60,
      velocityIterations: 8,
      positionIterations: 3,
      allowSleep: true,
      warmStarting: true,
      continuousPhysics: false
    };
  });

  // Initialize physics manager
  if (!physicsManagerRef.current) {
    physicsManagerRef.current = new MatterPhysicsManager();
  }

  const physicsManager = physicsManagerRef.current;

  // Enable/disable physics simulation
  useEffect(() => {
    if (isPhysicsEnabled) {
      physicsManager.start();
    } else {
      physicsManager.stop();
    }
  }, [isPhysicsEnabled, physicsManager]);

  // Physics update loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const updatePhysics = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      if (isPhysicsEnabled) {
        physicsManager.update(deltaTime);
      }

      animationFrame = requestAnimationFrame(updatePhysics);
    };

    if (isPhysicsEnabled) {
      animationFrame = requestAnimationFrame(updatePhysics);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPhysicsEnabled, physicsManager]);

  const createPhysicsBody = (tileId: string, properties?: Partial<PhysicsBody>): PhysicsBody | null => {
    // Check if body already exists
    const existingBody = physicsManager.getBodyByTileId(tileId);
    if (existingBody) {
      return existingBody;
    }

    return physicsManager.createBody(tileId, properties);
  };

  const removePhysicsBody = (tileId: string): void => {
    const body = physicsManager.getBodyByTileId(tileId);
    if (body) {
      physicsManager.removeBody(body.id);
    }
  };

  const getPhysicsBody = (tileId: string): PhysicsBody | undefined => {
    return physicsManager.getBodyByTileId(tileId);
  };

  const hasPhysicsBody = (tileId: string): boolean => {
    return !!physicsManager.getBodyByTileId(tileId);
  };

  const updatePhysicsSettings = (settings: Partial<PhysicsSettings>): void => {
    physicsManager.updateSettings(settings);
    const updatedSettings = physicsManager.getSettings();
    setPhysicsSettings(updatedSettings);
  };

  const setPhysicsEnabled = (enabled: boolean): void => {
    setIsPhysicsEnabled(enabled);
  };

  const syncTileWithPhysics = (tileId: string, position: { x: number; y: number }, size: { width: number; height: number }): void => {
    physicsManager.syncTileWithPhysicsBody(tileId, position, size);
  };

  const getPhysicsPosition = (tileId: string): { x: number; y: number } | undefined => {
    return physicsManager.getPhysicsBodyPosition(tileId);
  };

  return {
    physicsManager,
    isPhysicsEnabled,
    setPhysicsEnabled,
    createPhysicsBody,
    removePhysicsBody,
    getPhysicsBody,
    hasPhysicsBody,
    updatePhysicsSettings,
    physicsSettings,
    syncTileWithPhysics,
    getPhysicsPosition
  };
};