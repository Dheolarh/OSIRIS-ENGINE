import { 
  PhysicsBody, 
  Collider, 
  PhysicsForce, 
  TriggerZone, 
  PhysicsConstraint,
  CollisionEvent,
  PhysicsSettings,
  DEFAULT_PHYSICS_SETTINGS,
  Vector2
} from '../types/PhysicsTypes';

export class PhysicsManager {
  private bodies: Map<string, PhysicsBody> = new Map();
  private colliders: Map<string, Collider> = new Map();
  private forces: Map<string, PhysicsForce> = new Map();
  private triggers: Map<string, TriggerZone> = new Map();
  private constraints: Map<string, PhysicsConstraint> = new Map();
  private settings: PhysicsSettings = { ...DEFAULT_PHYSICS_SETTINGS };
  
  private collisionListeners: ((event: CollisionEvent) => void)[] = [];
  private isRunning: boolean = false;

  constructor() {
    // Physics manager initialized
  }

  // Physics Body Management
  createBody(tileId: string, properties: Partial<PhysicsBody> = {}): PhysicsBody {
    const id = `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const body: PhysicsBody = {
      id,
      tileId,
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
      freezePositionY: false,
      ...properties
    };

    this.bodies.set(id, body);
    return body;
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  getBodyByTileId(tileId: string): PhysicsBody | undefined {
    for (const body of this.bodies.values()) {
      if (body.tileId === tileId) {
        return body;
      }
    }
    return undefined;
  }

  updateBody(id: string, properties: Partial<PhysicsBody>): void {
    const body = this.bodies.get(id);
    if (body) {
      Object.assign(body, properties);
    }
  }

  removeBody(id: string): void {
    // Remove associated colliders and forces
    const collidersToRemove = Array.from(this.colliders.values())
      .filter(collider => collider.bodyId === id);
    collidersToRemove.forEach(collider => this.removeCollider(collider.id));

    const forcesToRemove = Array.from(this.forces.values())
      .filter(force => force.bodyId === id);
    forcesToRemove.forEach(force => this.removeForce(force.id));

    this.bodies.delete(id);
  }

  // Collider Management
  createCollider(bodyId: string, properties: Partial<Collider> = {}): Collider | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;

    const id = `collider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const collider: Collider = {
      id,
      bodyId,
      type: 'box',
      width: 50,
      height: 50,
      isSensor: false,
      offset: { x: 0, y: 0 },
      friction: 0.3,
      restitution: 0.0,
      density: 1.0,
      ...properties
    };

    this.colliders.set(id, collider);
    return collider;
  }

  getCollider(id: string): Collider | undefined {
    return this.colliders.get(id);
  }

  getCollidersByBodyId(bodyId: string): Collider[] {
    return Array.from(this.colliders.values())
      .filter(collider => collider.bodyId === bodyId);
  }

  updateCollider(id: string, properties: Partial<Collider>): void {
    const collider = this.colliders.get(id);
    if (collider) {
      Object.assign(collider, properties);
    }
  }

  removeCollider(id: string): void {
    // Remove associated triggers
    const triggersToRemove = Array.from(this.triggers.values())
      .filter(trigger => trigger.colliderId === id);
    triggersToRemove.forEach(trigger => this.removeTrigger(trigger.id));

    this.colliders.delete(id);
  }

  // Force Management
  applyForce(bodyId: string, force: Vector2, applicationPoint?: Vector2, mode: 'force' | 'impulse' | 'velocity_change' | 'acceleration' = 'force'): string | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;

    const id = `force_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const physicsForce: PhysicsForce = {
      id,
      bodyId,
      force,
      torque: 0,
      ...(applicationPoint && { applicationPoint }),
      mode,
      startTime: performance.now()
    };

    this.forces.set(id, physicsForce);
    return id;
  }

  applyTorque(bodyId: string, torque: number, mode: 'force' | 'impulse' | 'velocity_change' | 'acceleration' = 'force'): string | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;

    const id = `torque_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const physicsForce: PhysicsForce = {
      id,
      bodyId,
      force: { x: 0, y: 0 },
      torque,
      mode,
      startTime: performance.now()
    };

    this.forces.set(id, physicsForce);
    return id;
  }

  removeForce(id: string): void {
    this.forces.delete(id);
  }

  clearForcesForBody(bodyId: string): void {
    const forcesToRemove = Array.from(this.forces.values())
      .filter(force => force.bodyId === bodyId);
    forcesToRemove.forEach(force => this.removeForce(force.id));
  }

  // Trigger Management
  createTrigger(colliderId: string, properties: Partial<TriggerZone> = {}): TriggerZone | null {
    const collider = this.colliders.get(colliderId);
    if (!collider) return null;

    const id = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const trigger: TriggerZone = {
      id,
      colliderId,
      triggerLayers: [],
      triggerTags: [],
      ...properties
    };

    this.triggers.set(id, trigger);
    return trigger;
  }

  removeTrigger(id: string): void {
    this.triggers.delete(id);
  }

  // Physics Settings
  updateSettings(settings: Partial<PhysicsSettings>): void {
    Object.assign(this.settings, settings);
  }

  getSettings(): PhysicsSettings {
    return { ...this.settings };
  }

  // Collision Detection
  addCollisionListener(callback: (event: CollisionEvent) => void): void {
    this.collisionListeners.push(callback);
  }

  removeCollisionListener(callback: (event: CollisionEvent) => void): void {
    const index = this.collisionListeners.indexOf(callback);
    if (index !== -1) {
      this.collisionListeners.splice(index, 1);
    }
  }

  // Physics Simulation Control
  start(): void {
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  pause(): void {
    this.isRunning = false;
  }

  resume(): void {
    this.isRunning = true;
  }

  // Main update loop (simplified for now - would integrate with actual physics engine later)
  update(deltaTime: number): void {
    if (!this.isRunning) return;

    // Apply gravity
    for (const body of this.bodies.values()) {
      if (!body.isStatic && !body.isKinematic && body.gravityScale > 0) {
        body.acceleration.x += this.settings.gravity.x * body.gravityScale;
        body.acceleration.y += this.settings.gravity.y * body.gravityScale;
      }
    }

    // Apply forces
    this.applyForces(deltaTime);

    // Integrate velocity and position (basic Euler integration)
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        // Update velocity
        body.velocity.x += body.acceleration.x * deltaTime;
        body.velocity.y += body.acceleration.y * deltaTime;

        // Apply drag/damping
        const damping = 0.99; // Simple damping
        body.velocity.x *= damping;
        body.velocity.y *= damping;
        body.angularVelocity *= damping;

        // Reset acceleration for next frame
        body.acceleration.x = 0;
        body.acceleration.y = 0;
      }
    }

    // Clean up expired forces
    this.cleanupExpiredForces();
  }

  private applyForces(deltaTime: number): void {
    for (const force of this.forces.values()) {
      const body = this.bodies.get(force.bodyId);
      if (!body || body.isStatic) continue;

      switch (force.mode) {
        case 'force':
          body.acceleration.x += force.force.x / body.mass;
          body.acceleration.y += force.force.y / body.mass;
          break;
        case 'impulse':
          body.velocity.x += force.force.x / body.mass;
          body.velocity.y += force.force.y / body.mass;
          break;
        case 'velocity_change':
          body.velocity.x += force.force.x;
          body.velocity.y += force.force.y;
          break;
        case 'acceleration':
          body.acceleration.x += force.force.x;
          body.acceleration.y += force.force.y;
          break;
      }

      // Apply torque
      if (force.torque !== 0 && !body.freezeRotation) {
        body.angularVelocity += force.torque / body.mass * deltaTime;
      }
    }
  }

  private cleanupExpiredForces(): void {
    const currentTime = performance.now();
    const expiredForces: string[] = [];

    for (const [id, force] of this.forces) {
      if (force.duration && force.startTime) {
        if (currentTime - force.startTime > force.duration * 1000) {
          expiredForces.push(id);
        }
      }
    }

    expiredForces.forEach(id => this.removeForce(id));
  }

  // Utility methods
  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  getAllColliders(): Collider[] {
    return Array.from(this.colliders.values());
  }

  clearAll(): void {
    this.bodies.clear();
    this.colliders.clear();
    this.forces.clear();
    this.triggers.clear();
    this.constraints.clear();
  }
}