import React, { useState } from 'react';
import { UsePhysicsReturn } from '../../physics/hooks/usePhysics';

interface PhysicsDebugPanelProps {
  physics: UsePhysicsReturn;
}

export const PhysicsDebugPanel: React.FC<PhysicsDebugPanelProps> = ({
  physics
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const [debugOptions, setDebugOptions] = useState({
    showVelocity: true,
    showCollisions: true,
    showBounds: true,
    showForces: false
  });

  const allBodies = physics.physicsManager.getAllBodies();
  const enabledBodies = allBodies.length;

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ 
        color: 'var(--terminal-warning)', 
        fontSize: '10px', 
        marginBottom: '8px',
        fontWeight: 'bold'
      }}>
        PHYSICS DEBUG
      </div>

      {/* Debug Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontSize: '10px', 
          color: 'var(--terminal-secondary)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
            style={{ 
              marginRight: '6px', 
              accentColor: 'var(--terminal-warning)',
              transform: 'scale(0.8)'
            }}
          />
          Show Physics Visuals
        </label>
      </div>

      {/* Physics Stats */}
      <div style={{ 
        marginBottom: '10px', 
        fontSize: '9px', 
        color: 'var(--terminal-secondary)',
        padding: '6px',
        border: '1px solid var(--terminal-border)',
        borderRadius: '2px',
        backgroundColor: 'rgba(255, 255, 0, 0.02)'
      }}>
        <div>Objects with Physics: {enabledBodies}</div>
        <div>World Status: {physics.isPhysicsEnabled ? 'Running' : 'Paused'}</div>
        <div>Gravity: {physics.physicsSettings.gravity.x.toFixed(1)}, {physics.physicsSettings.gravity.y.toFixed(1)}</div>
      </div>

      {/* Debug Options */}
      {showDebug && (
        <div style={{ 
          padding: '8px', 
          border: '1px solid var(--terminal-border)',
          backgroundColor: 'rgba(255, 255, 0, 0.02)',
          marginBottom: '10px'
        }}>
          <div style={{ 
            color: 'var(--terminal-secondary)', 
            fontSize: '9px', 
            marginBottom: '6px' 
          }}>
            VISUAL DEBUG OPTIONS
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', color: 'var(--terminal-secondary)' }}>
              <input
                type="checkbox"
                checked={debugOptions.showVelocity}
                onChange={(e) => setDebugOptions(prev => ({ ...prev, showVelocity: e.target.checked }))}
                style={{ marginRight: '4px', accentColor: 'var(--terminal-warning)', transform: 'scale(0.7)' }}
              />
              Show Speed Arrows
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', color: 'var(--terminal-secondary)' }}>
              <input
                type="checkbox"
                checked={debugOptions.showCollisions}
                onChange={(e) => setDebugOptions(prev => ({ ...prev, showCollisions: e.target.checked }))}
                style={{ marginRight: '4px', accentColor: 'var(--terminal-warning)', transform: 'scale(0.7)' }}
              />
              Show Collision Points
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', color: 'var(--terminal-secondary)' }}>
              <input
                type="checkbox"
                checked={debugOptions.showBounds}
                onChange={(e) => setDebugOptions(prev => ({ ...prev, showBounds: e.target.checked }))}
                style={{ marginRight: '4px', accentColor: 'var(--terminal-warning)', transform: 'scale(0.7)' }}
              />
              Show Hit Boxes
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', color: 'var(--terminal-secondary)' }}>
              <input
                type="checkbox"
                checked={debugOptions.showForces}
                onChange={(e) => setDebugOptions(prev => ({ ...prev, showForces: e.target.checked }))}
                style={{ marginRight: '4px', accentColor: 'var(--terminal-warning)', transform: 'scale(0.7)' }}
              />
              Show Force Arrows
            </label>
          </div>
        </div>
      )}

      {/* Quick Physics Test Buttons */}
      {physics.isPhysicsEnabled && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ 
            color: 'var(--terminal-secondary)', 
            fontSize: '9px', 
            marginBottom: '4px' 
          }}>
            QUICK TESTS
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                // Create a test falling box
                // This would need integration with the canvas/tile system
              }}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              DROP BOX
            </button>
            
            <button
              onClick={() => {
                // Apply random forces to all physics objects
                allBodies.forEach(body => {
                  const randomForce = {
                    x: (Math.random() - 0.5) * 1000,
                    y: (Math.random() - 0.5) * 1000
                  };
                  physics.physicsManager.applyForce(body.id, randomForce, undefined, 'impulse');
                });
              }}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              SHAKE ALL
            </button>
            
            <button
              onClick={() => {
                // Stop all movement
                allBodies.forEach(body => {
                  physics.physicsManager.updateBody(body.id, {
                    velocity: { x: 0, y: 0 },
                    angularVelocity: 0
                  });
                });
              }}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              FREEZE ALL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};