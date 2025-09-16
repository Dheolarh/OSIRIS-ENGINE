import Matter from 'matter-js';
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

export class MatterPhysicsManager {
  private engine: Matter.Engine;
  private world: Matter.World;
  private render?: Matter.Render;
  private runner?: Matter.Runner;
  
  // Maps to sync our data with Matter.js bodies
  private bodyMap: Map<string, { physicsBody: PhysicsBody; matterBody: Matter.Body }> = new Map();
  private colliderMap: Map<string, { collider: Collider; matterBody: Matter.Body }> = new Map();
  private forces: Map<string, PhysicsForce> = new Map();
  private triggers: Map<string, TriggerZone> = new Map();
  private constraints: Map<string, PhysicsConstraint> = new Map();
  private settings: PhysicsSettings = { ...DEFAULT_PHYSICS_SETTINGS };
  
  private collisionListeners: ((event: CollisionEvent) => void)[] = [];
  private isRunning: boolean = false;
  private canvasElement: HTMLElement | undefined;

  constructor(canvasElement?: HTMLElement) {
    // Create Matter.js engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.canvasElement = canvasElement;
    
    // Configure engine settings
    this.updateEngineSettings();
    
    // Set up collision detection
    this.setupCollisionDetection();
  }

  private updateEngineSettings(): void {
    // Apply our settings to Matter.js engine
    this.engine.world.gravity.x = this.settings.gravity.x;
    this.engine.world.gravity.y = this.settings.gravity.y;
    this.engine.constraintIterations = this.settings.positionIterations;
    this.engine.velocityIterations = this.settings.velocityIterations;
    
    // Configure timing
    this.engine.timing.timeScale = 1;
  }

  private setupCollisionDetection(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        this.handleCollision(pair.bodyA, pair.bodyB, pair);
      });
    });

    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      event.pairs.forEach(pair => {
        this.handleTriggerStay(pair.bodyA, pair.bodyB);
      });
    });

    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      event.pairs.forEach(pair => {
        this.handleTriggerExit(pair.bodyA, pair.bodyB);
      });
    });
  }

  private handleCollision(bodyA: Matter.Body, bodyB: Matter.Body, pair: Matter.Pair): void {
    const physicsBodyA = this.getPhysicsBodyByMatterBody(bodyA);
    const physicsBodyB = this.getPhysicsBodyByMatterBody(bodyB);
    
    if (physicsBodyA && physicsBodyB) {
      const collisionEvent: CollisionEvent = {
        bodyA: physicsBodyA,
        bodyB: physicsBodyB,
        colliderA: this.getColliderByMatterBody(bodyA)!,
        colliderB: this.getColliderByMatterBody(bodyB)!,
        contactPoints: pair.contacts.map(contact => ({ x: contact.vertex.x, y: contact.vertex.y })),
        normal: { x: pair.contacts[0]?.normalImpulse || 0, y: pair.contacts[0]?.tangentImpulse || 0 },
        impulse: pair.contacts[0]?.normalImpulse || 0,
        timestamp: performance.now()
      };

      this.collisionListeners.forEach(listener => listener(collisionEvent));
    }
  }

  private handleTriggerStay(bodyA: Matter.Body, bodyB: Matter.Body): void {
    // Handle trigger stay events
    const physicsBodyA = this.getPhysicsBodyByMatterBody(bodyA);
    const physicsBodyB = this.getPhysicsBodyByMatterBody(bodyB);
    
    if (physicsBodyA?.isTrigger || physicsBodyB?.isTrigger) {
      // Trigger logic here
    }
  }

  private handleTriggerExit(bodyA: Matter.Body, bodyB: Matter.Body): void {
    // Handle trigger exit events
    const physicsBodyA = this.getPhysicsBodyByMatterBody(bodyA);
    const physicsBodyB = this.getPhysicsBodyByMatterBody(bodyB);
    
    if (physicsBodyA?.isTrigger || physicsBodyB?.isTrigger) {
      // Trigger exit logic here
    }
  }

  private getPhysicsBodyByMatterBody(matterBody: Matter.Body): PhysicsBody | undefined {
    for (const { physicsBody, matterBody: mb } of this.bodyMap.values()) {
      if (mb.id === matterBody.id) {
        return physicsBody;
      }
    }
    return undefined;
  }

  private getColliderByMatterBody(matterBody: Matter.Body): Collider | undefined {
    for (const { collider } of this.colliderMap.values()) {
      if (this.bodyMap.get(collider.bodyId)?.matterBody.id === matterBody.id) {
        return collider;
      }
    }
    return undefined;
  }

  // Physics Body Management
  createBody(tileId: string, properties: Partial<PhysicsBody> = {}): PhysicsBody {
    const id = `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const physicsBody: PhysicsBody = {
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

    // Create Matter.js body (default rectangle for now)
    const matterBody = Matter.Bodies.rectangle(
      0, 0, // Position will be synced later
      50, 50, // Default size, will be updated
      {
        mass: physicsBody.mass,
        friction: physicsBody.friction,
        restitution: physicsBody.restitution,
        isStatic: physicsBody.isStatic,
        isSensor: physicsBody.isTrigger,
        density: physicsBody.density
      }
    );

    // Add custom properties to Matter body
    matterBody.label = `PhysicsBody_${id}`;
    (matterBody as any).physicsBodyId = id;

    // Store the mapping
    this.bodyMap.set(id, { physicsBody, matterBody });
    
    // Add to world
    Matter.World.add(this.world, matterBody);

    return physicsBody;
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodyMap.get(id)?.physicsBody;
  }

  getBodyByTileId(tileId: string): PhysicsBody | undefined {
    for (const { physicsBody } of this.bodyMap.values()) {
      if (physicsBody.tileId === tileId) {
        return physicsBody;
      }
    }
    return undefined;
  }

  updateBody(id: string, properties: Partial<PhysicsBody>): void {
    const entry = this.bodyMap.get(id);
    if (!entry) return;

    const { physicsBody, matterBody } = entry;
    
    // Update our physics body
    Object.assign(physicsBody, properties);

    // Sync changes to Matter.js body
    if (properties.mass !== undefined) {
      Matter.Body.setMass(matterBody, properties.mass);
    }
    if (properties.isStatic !== undefined) {
      Matter.Body.setStatic(matterBody, properties.isStatic);
    }
    if (properties.isTrigger !== undefined) {
      matterBody.isSensor = properties.isTrigger;
    }
    if (properties.friction !== undefined) {
      matterBody.friction = properties.friction;
    }
    if (properties.restitution !== undefined) {
      matterBody.restitution = properties.restitution;
    }
    if (properties.density !== undefined) {
      matterBody.density = properties.density;
    }
    if (properties.velocity !== undefined) {
      Matter.Body.setVelocity(matterBody, properties.velocity);
    }
    if (properties.angularVelocity !== undefined) {
      Matter.Body.setAngularVelocity(matterBody, properties.angularVelocity);
    }
  }

  removeBody(id: string): void {
    const entry = this.bodyMap.get(id);
    if (!entry) return;

    // Remove from Matter world
    Matter.World.remove(this.world, entry.matterBody);
    
    // Remove from our maps
    this.bodyMap.delete(id);
    
    // Clean up associated data
    const collidersToRemove = Array.from(this.colliderMap.entries())
      .filter(([, { collider }]) => collider.bodyId === id);
    collidersToRemove.forEach(([colliderId]) => this.removeCollider(colliderId));

    const forcesToRemove = Array.from(this.forces.entries())
      .filter(([, force]) => force.bodyId === id);
    forcesToRemove.forEach(([forceId]) => this.removeForce(forceId));
  }

  // Sync tile positions with physics bodies
  syncTileWithPhysicsBody(tileId: string, tilePosition: Vector2, tileSize: { width: number; height: number }): void {
    const physicsBody = this.getBodyByTileId(tileId);
    if (!physicsBody) return;

    const entry = this.bodyMap.get(physicsBody.id);
    if (!entry) return;

    const { matterBody } = entry;

    // Update Matter body position and size
    Matter.Body.setPosition(matterBody, { x: tilePosition.x + tileSize.width / 2, y: tilePosition.y + tileSize.height / 2 });
    
    // Scale body if size changed
    const currentBounds = matterBody.bounds;
    const currentWidth = currentBounds.max.x - currentBounds.min.x;
    const currentHeight = currentBounds.max.y - currentBounds.min.y;
    
    if (Math.abs(currentWidth - tileSize.width) > 0.1 || Math.abs(currentHeight - tileSize.height) > 0.1) {
      const scaleX = tileSize.width / currentWidth;
      const scaleY = tileSize.height / currentHeight;
      Matter.Body.scale(matterBody, scaleX, scaleY);
    }
  }

  // Get physics body position for tile sync
  getPhysicsBodyPosition(tileId: string): Vector2 | undefined {
    const physicsBody = this.getBodyByTileId(tileId);
    if (!physicsBody) return undefined;

    const entry = this.bodyMap.get(physicsBody.id);
    if (!entry) return undefined;

    const { matterBody } = entry;
    const bounds = matterBody.bounds;
    
    return {
      x: bounds.min.x,
      y: bounds.min.y
    };
  }

  // Force Management
  applyForce(bodyId: string, force: Vector2, applicationPoint?: Vector2, mode: 'force' | 'impulse' | 'velocity_change' | 'acceleration' = 'force'): string | null {
    const entry = this.bodyMap.get(bodyId);
    if (!entry) return null;

    const { matterBody } = entry;
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

    // Apply force immediately to Matter.js body
    switch (mode) {
      case 'force':
        Matter.Body.applyForce(matterBody, applicationPoint || matterBody.position, force);
        break;
      case 'impulse':
        // Convert impulse to velocity change
        const velocityChange = {
          x: force.x / matterBody.mass,
          y: force.y / matterBody.mass
        };
        const newVelocity = {
          x: matterBody.velocity.x + velocityChange.x,
          y: matterBody.velocity.y + velocityChange.y
        };
        Matter.Body.setVelocity(matterBody, newVelocity);
        break;
      case 'velocity_change':
        const currentVel = matterBody.velocity;
        Matter.Body.setVelocity(matterBody, { x: currentVel.x + force.x, y: currentVel.y + force.y });
        break;
    }

    this.forces.set(id, physicsForce);
    return id;
  }

  removeForce(id: string): void {
    this.forces.delete(id);
  }

  // Collider Management (simplified - using body shapes for now)
  createCollider(bodyId: string, properties: Partial<Collider> = {}): Collider | null {
    const entry = this.bodyMap.get(bodyId);
    if (!entry) return null;

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

    this.colliderMap.set(id, { collider, matterBody: entry.matterBody });
    return collider;
  }

  getCollidersByBodyId(bodyId: string): Collider[] {
    return Array.from(this.colliderMap.values())
      .filter(({ collider }) => collider.bodyId === bodyId)
      .map(({ collider }) => collider);
  }

  removeCollider(id: string): void {
    this.colliderMap.delete(id);
  }

  // Physics Settings
  updateSettings(settings: Partial<PhysicsSettings>): void {
    Object.assign(this.settings, settings);
    this.updateEngineSettings();
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
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Create and start Matter.js runner
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.runner) {
      Matter.Runner.stop(this.runner);
    }
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  // Main update loop - now handled by Matter.js runner
  update(_deltaTime: number): void {
    // Matter.js handles the physics update automatically
    // We just need to sync our physics bodies with the Matter bodies
    this.syncPhysicsBodies();
  }

  private syncPhysicsBodies(): void {
    for (const { physicsBody, matterBody } of this.bodyMap.values()) {
      // Update our physics body from Matter.js body
      physicsBody.velocity = { ...matterBody.velocity };
      physicsBody.angularVelocity = matterBody.angularVelocity;
    }
  }

  // Debug rendering
  enableDebugRender(canvas: HTMLCanvasElement): void {
    if (this.render) return;

    this.render = Matter.Render.create({
      canvas: canvas,
      engine: this.engine,
      options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        showVelocity: true,
        showAngleIndicator: true,
        showCollisions: true
      }
    });

    Matter.Render.run(this.render);
  }

  disableDebugRender(): void {
    if (this.render) {
      Matter.Render.stop(this.render);
      this.render = undefined as any;
    }
  }

  // Utility methods
  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodyMap.values()).map(({ physicsBody }) => physicsBody);
  }

  getAllColliders(): Collider[] {
    return Array.from(this.colliderMap.values()).map(({ collider }) => collider);
  }

  clearAll(): void {
    // Clear Matter.js world
    Matter.World.clear(this.world, false);
    
    // Clear our maps
    this.bodyMap.clear();
    this.colliderMap.clear();
    this.forces.clear();
    this.triggers.clear();
    this.constraints.clear();
  }

  // Get Matter.js engine for advanced use cases
  getMatterEngine(): Matter.Engine {
    return this.engine;
  }

  getMatterWorld(): Matter.World {
    return this.world;
  }
}