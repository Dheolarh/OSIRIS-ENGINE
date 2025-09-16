// Core physics types and interfaces

export interface Vector2 {
  x: number;
  y: number;
}

export interface PhysicsBody {
  id: string;
  tileId: string;
  
  // Basic properties
  mass: number;
  density: number;
  friction: number;
  restitution: number; // bounciness (0-1)
  
  // State
  velocity: Vector2;
  acceleration: Vector2;
  angularVelocity: number;
  
  // Physics settings
  isStatic: boolean;
  isKinematic: boolean;
  isTrigger: boolean;
  gravityScale: number;
  
  // Constraints
  freezeRotation: boolean;
  freezePositionX: boolean;
  freezePositionY: boolean;
}

export interface Collider {
  id: string;
  bodyId: string;
  
  // Collider type and shape
  type: 'box' | 'circle' | 'polygon';
  
  // Box collider properties
  width?: number;
  height?: number;
  
  // Circle collider properties
  radius?: number;
  
  // Polygon collider properties (for complex shapes)
  vertices?: Vector2[];
  
  // Collider settings
  isSensor: boolean; // triggers vs solid collision
  offset: Vector2; // offset from body center
  
  // Material properties
  friction: number;
  restitution: number;
  density: number;
}

export interface PhysicsForce {
  id: string;
  bodyId: string;
  
  // Force properties
  force: Vector2;
  torque: number;
  
  // Application
  applicationPoint?: Vector2; // where force is applied (default: center of mass)
  mode: 'force' | 'impulse' | 'velocity_change' | 'acceleration';
  
  // Timing
  duration?: number; // if undefined, applied continuously
  startTime?: number;
}

export interface TriggerZone {
  id: string;
  colliderId: string;
  
  // Trigger events
  onEnter?: (other: PhysicsBody) => void;
  onStay?: (other: PhysicsBody) => void;
  onExit?: (other: PhysicsBody) => void;
  
  // Filter what can trigger this zone
  triggerLayers: string[];
  triggerTags: string[];
}

export interface PhysicsConstraint {
  id: string;
  type: 'distance' | 'spring' | 'hinge' | 'slider' | 'fixed';
  
  // Bodies involved
  bodyA: string;
  bodyB?: string; // if undefined, constraint is to world
  
  // Anchor points
  anchorA: Vector2;
  anchorB?: Vector2;
  
  // Constraint-specific properties
  distance?: number;
  springStrength?: number;
  damping?: number;
  minAngle?: number;
  maxAngle?: number;
  motorSpeed?: number;
  maxMotorTorque?: number;
}

export interface CollisionEvent {
  bodyA: PhysicsBody;
  bodyB: PhysicsBody;
  colliderA: Collider;
  colliderB: Collider;
  contactPoints: Vector2[];
  normal: Vector2;
  impulse: number;
  timestamp: number;
}

export interface PhysicsSettings {
  gravity: Vector2;
  timeStep: number;
  velocityIterations: number;
  positionIterations: number;
  allowSleep: boolean;
  warmStarting: boolean;
  continuousPhysics: boolean;
}

// Default physics settings
export const DEFAULT_PHYSICS_SETTINGS: PhysicsSettings = {
  gravity: { x: 0, y: 9.81 }, // Standard Earth gravity
  timeStep: 1/60,
  velocityIterations: 8,
  positionIterations: 3,
  allowSleep: true,
  warmStarting: true,
  continuousPhysics: false
};

// Default physics body
export const DEFAULT_PHYSICS_BODY: Omit<PhysicsBody, 'id' | 'tileId'> = {
  mass: 1.0,
  density: 1.0,
  friction: 0.3,
  restitution: 0.0,
  velocity: { x: 0, y: 0 },
  acceleration: { x: 0, y: 0 },
  angularVelocity: 0,
  isStatic: false,
  isKinematic: false,
  isTrigger: false,
  gravityScale: 1.0,
  freezeRotation: false,
  freezePositionX: false,
  freezePositionY: false
};

// Default collider
export const DEFAULT_BOX_COLLIDER: Omit<Collider, 'id' | 'bodyId' | 'width' | 'height'> = {
  type: 'box',
  isSensor: false,
  offset: { x: 0, y: 0 },
  friction: 0.3,
  restitution: 0.0,
  density: 1.0
};