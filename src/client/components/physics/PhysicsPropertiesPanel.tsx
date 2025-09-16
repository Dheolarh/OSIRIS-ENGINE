import React, { useState, useEffect } from 'react';
import { UsePhysicsReturn } from '../../physics/hooks/usePhysics';
import { useTileManager } from '../../hooks/useTileManager';
import { Dropdown } from '../ui/Dropdown';

interface PhysicsPropertiesPanelProps {
  tileId?: string;
  physics: UsePhysicsReturn;
  tileManager?: ReturnType<typeof useTileManager>;
}

export const PhysicsPropertiesPanel: React.FC<PhysicsPropertiesPanelProps> = ({
  tileId,
  physics,
  tileManager
}) => {
  const [hasRigidbody, setHasRigidbody] = useState(false);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const [mass, setMass] = useState(1.0);
  const [bounce, setBounce] = useState(0.0);
  const [friction, setFriction] = useState(0.3);
  const [bodyType, setBodyType] = useState<'static' | 'dynamic'>('dynamic');
  const [colliderType, setColliderType] = useState<'box' | 'circle' | 'triangle'>('box');
  const [isTrigger, setIsTrigger] = useState(false);
  
  // Get current tile data
  const currentTile = tileManager?.tiles.find(tile => tile.id === tileId);

  // Load properties from selected tile
  useEffect(() => {
    if (tileId) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        setHasRigidbody(true);
        setMass(physicsBody.mass);
        setBounce(physicsBody.restitution);
        setFriction(physicsBody.friction);
        setBodyType(physicsBody.isStatic ? 'static' : 'dynamic');
        setGravityEnabled(physicsBody.gravityScale > 0);
        setIsTrigger(physicsBody.isTrigger);
      } else {
        setHasRigidbody(false);
        setMass(1.0);
        setBounce(0.0);
        setFriction(0.3);
        setBodyType('dynamic');
        setGravityEnabled(true);
        setIsTrigger(false);
      }
    }
  }, [tileId, physics]);

  const handleRigidbodyToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const enabled = event.target.checked;
    setHasRigidbody(enabled);
    
    if (tileId && currentTile) {
      if (enabled) {
        const bodyProperties = {
          mass,
          restitution: bounce,
          friction,
          isStatic: bodyType === 'static',
          isTrigger: isTrigger
        };
        
        // Create physics body
        const body = physics.createPhysicsBody(tileId, bodyProperties);
        if (body) {
          // Sync tile position and size to physics body
          physics.syncTileWithPhysics(tileId, 
            { x: currentTile.transform.x, y: currentTile.transform.y },
            { width: currentTile.transform.width, height: currentTile.transform.height }
          );
        }
      } else {
        physics.removePhysicsBody(tileId);
      }
    }
  };

  const handleGravityToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const enabled = event.target.checked;
    setGravityEnabled(enabled);
    
    // Update global gravity settings
    physics.updatePhysicsSettings({
      gravity: { x: 0, y: enabled ? 9.81 : 0 }
    });
  };

  const handleMassChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const newMass = parseFloat(event.target.value);
    setMass(newMass);
    
    if (tileId && hasRigidbody) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        physics.physicsManager.updateBody(physicsBody.id, { mass: newMass });
      }
    }
  };

  const handleBounceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const newBounce = parseFloat(event.target.value);
    setBounce(newBounce);
    
    if (tileId && hasRigidbody) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        physics.physicsManager.updateBody(physicsBody.id, { restitution: newBounce });
      }
    }
  };

  const handleFrictionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const newFriction = parseFloat(event.target.value);
    setFriction(newFriction);
    
    if (tileId && hasRigidbody) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        physics.physicsManager.updateBody(physicsBody.id, { friction: newFriction });
      }
    }
  };

  const handleBodyTypeChange = (newType: 'static' | 'dynamic') => {
    setBodyType(newType);
    
    if (tileId && hasRigidbody) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        physics.physicsManager.updateBody(physicsBody.id, {
          isStatic: newType === 'static'
        });
      }
    }
  };

  const handleTriggerColliderToggle = (type: 'trigger' | 'collider') => {
    const isTriggerMode = type === 'trigger';
    setIsTrigger(isTriggerMode);
    
    if (tileId && hasRigidbody) {
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        physics.physicsManager.updateBody(physicsBody.id, {
          isTrigger: isTriggerMode
        });
      }
    }
  };

  const handleColliderTypeChange = (newType: 'box' | 'circle' | 'triangle') => {
    setColliderType(newType);
    
    if (tileId && hasRigidbody) {
      // For now, we need to recreate the physics body with the new collider shape
      // In a more advanced system, we'd update the collider shape directly
      const physicsBody = physics.getPhysicsBody(tileId);
      if (physicsBody) {
        const bodyProperties = {
          mass,
          restitution: bounce,
          friction,
          isStatic: bodyType === 'static',
          isTrigger: isTrigger,
          colliderType: newType
        };
        
        // Remove old body and create new one with updated shape
        physics.removePhysicsBody(tileId);
        physics.createPhysicsBody(tileId, bodyProperties);
      }
    }
  };

  if (!tileId) {
    return (
      <div style={{
        fontSize: '9px',
        textAlign: 'center',
        padding: '20px',
        color: 'var(--terminal-secondary)'
      }}>
        Select a tile to configure physics
      </div>
    );
  }

  return (
    <div style={{ 
      fontSize: '11px',
      userSelect: 'none',
      padding: '15px'
    }}>
      <div style={{ 
        marginBottom: '15px', 
        fontWeight: 'bold', 
        color: 'var(--terminal-accent)',
        fontSize: '12px'
      }}>
        PHYSICS PROPERTIES
      </div>
      
      {/* Rigidbody Toggle - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasRigidbody}
            onChange={handleRigidbodyToggle}
            style={{ 
              marginRight: '8px',
              width: '16px',
              height: '16px',
              accentColor: 'var(--terminal-success)'
            }}
          />
          <span style={{ fontSize: '11px' }}>Enable Rigidbody</span>
        </label>
        <div style={{ fontSize: '9px', color: 'var(--terminal-secondary)', marginTop: '4px', marginLeft: '24px' }}>
          Objects need rigidbody to be affected by physics forces like gravity. Create a static ground object for objects to land on.
        </div>
      </div>

      {/* Gravity Toggle - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={gravityEnabled}
            onChange={handleGravityToggle}
            style={{ 
              marginRight: '8px',
              width: '16px',
              height: '16px',
              accentColor: 'var(--terminal-warning)'
            }}
          />
          <span style={{ fontSize: '11px' }}>Enable Gravity (9.81 m/s²)</span>
        </label>
      </div>

      {/* Mass Slider - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Mass:</span>
          <span style={{ color: 'var(--terminal-accent)' }}>{mass.toFixed(1)} kg</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="10.0"
          step="0.1"
          value={mass}
          onChange={handleMassChange}
          style={{ 
            width: '100%', 
            height: '6px',
            accentColor: 'var(--terminal-accent)'
          }}
        />
      </div>

      {/* Bounce Slider - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Bounce:</span>
          <span style={{ color: 'var(--terminal-warning)' }}>{bounce.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.01"
          value={bounce}
          onChange={handleBounceChange}
          style={{ 
            width: '100%', 
            height: '6px',
            accentColor: 'var(--terminal-warning)'
          }}
        />
      </div>

      {/* Friction Slider - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Friction:</span>
          <span style={{ color: 'var(--terminal-error)' }}>{friction.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.01"
          value={friction}
          onChange={handleFrictionChange}
          style={{ 
            width: '100%', 
            height: '6px',
            accentColor: 'var(--terminal-error)'
          }}
        />
      </div>

      {/* Body Type Dropdown - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>Body Type:</div>
        <Dropdown
          options={[
            { value: 'dynamic', label: 'Dynamic (moves with physics)' },
            { value: 'static', label: 'Static (immovable)' }
          ]}
          value={bodyType}
          onChange={(value) => handleBodyTypeChange(value as 'static' | 'dynamic')}
          style={{ width: '100%' }}
        />
      </div>

      {/* Collider Shape - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>Collider Shape:</div>
        <Dropdown
          options={[
            { value: 'box', label: 'Box Collider' },
            { value: 'circle', label: 'Circle Collider' },
            { value: 'triangle', label: 'Triangle Collider' }
          ]}
          value={colliderType}
          onChange={(value) => handleColliderTypeChange(value as 'box' | 'circle' | 'triangle')}
          style={{ width: '100%' }}
        />
      </div>

      {/* Collision Type - Always Visible */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>Collision Type:</div>
        <Dropdown
          options={[
            { value: 'collider', label: 'Solid Collider (blocks movement)' },
            { value: 'trigger', label: 'Trigger Zone (passes through)' }
          ]}
          value={isTrigger ? 'trigger' : 'collider'}
          onChange={(value) => handleTriggerColliderToggle(value as 'trigger' | 'collider')}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '9px', color: 'var(--terminal-secondary)', marginTop: '4px' }}>
          {isTrigger ? 'Objects pass through and trigger events' : 'Objects collide, bounce, and block movement'}
        </div>
      </div>
    </div>
  );
};