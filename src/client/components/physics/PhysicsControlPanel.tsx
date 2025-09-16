import React, { useState } from 'react';
import { UsePhysicsReturn } from '../../physics/hooks/usePhysics';

interface PhysicsControlPanelProps {
  physics: UsePhysicsReturn;
}

export const PhysicsControlPanel: React.FC<PhysicsControlPanelProps> = ({
  physics
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const { physicsSettings, isPhysicsEnabled, setPhysicsEnabled, updatePhysicsSettings } = physics;

  const handleGravityChange = (axis: 'x' | 'y', value: number) => {
    updatePhysicsSettings({
      gravity: {
        ...physicsSettings.gravity,
        [axis]: value
      }
    });
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ 
        color: 'var(--terminal-success)', 
        fontSize: '10px', 
        marginBottom: '8px',
        fontWeight: 'bold'
      }}>
        PHYSICS WORLD
      </div>

      {/* Physics Enable Toggle */}
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
            checked={isPhysicsEnabled}
            onChange={(e) => setPhysicsEnabled(e.target.checked)}
            style={{ 
              marginRight: '6px', 
              accentColor: 'var(--terminal-success)',
              transform: 'scale(0.8)'
            }}
          />
          Make Objects Fall & Collide
        </label>
      </div>

      {/* Physics Status */}
      <div style={{ 
        marginBottom: '10px', 
        fontSize: '9px', 
        color: isPhysicsEnabled ? 'var(--terminal-success)' : 'var(--terminal-dim)',
        textAlign: 'center',
        padding: '4px',
        border: `1px solid ${isPhysicsEnabled ? 'var(--terminal-success)' : 'var(--terminal-dim)'}`,
        borderRadius: '2px'
      }}>
        {isPhysicsEnabled ? 'WORLD IS ALIVE' : 'WORLD IS PAUSED'}
      </div>

      {/* Quick Gravity Presets */}
      {isPhysicsEnabled && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ 
            color: 'var(--terminal-secondary)', 
            fontSize: '9px', 
            marginBottom: '4px' 
          }}>
            WHICH WAY THINGS FALL
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleGravityChange('y', 0)}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              FLOATING
            </button>
            <button
              onClick={() => handleGravityChange('y', 9.81)}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              EARTH
            </button>
            <button
              onClick={() => handleGravityChange('y', 1.62)}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--terminal-border)',
                backgroundColor: 'transparent',
                color: 'var(--terminal-secondary)',
                fontSize: '8px',
                cursor: 'pointer'
              }}
            >
              MOON
            </button>
          </div>
        </div>
      )}

      {/* Advanced Settings Toggle */}
      {isPhysicsEnabled && (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid var(--terminal-border)',
              backgroundColor: 'transparent',
              color: 'var(--terminal-secondary)',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            {showSettings ? '▲' : '▼'} EXPERT SETTINGS
          </button>

          {showSettings && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              border: '1px solid var(--terminal-border)',
              backgroundColor: 'rgba(0, 255, 0, 0.02)'
            }}>
              {/* Gravity Vector */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: 'var(--terminal-secondary)', fontSize: '8px', marginBottom: '2px' }}>
                  GRAVITY DIRECTION (Left/Right, Up/Down)
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="number"
                    value={physicsSettings.gravity.x}
                    onChange={(e) => handleGravityChange('x', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    style={{
                      width: '50%',
                      padding: '2px',
                      backgroundColor: 'var(--terminal-bg)',
                      border: '1px solid var(--terminal-border)',
                      color: 'var(--terminal-text)',
                      fontSize: '8px'
                    }}
                  />
                  <input
                    type="number"
                    value={physicsSettings.gravity.y}
                    onChange={(e) => handleGravityChange('y', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    style={{
                      width: '50%',
                      padding: '2px',
                      backgroundColor: 'var(--terminal-bg)',
                      border: '1px solid var(--terminal-border)',
                      color: 'var(--terminal-text)',
                      fontSize: '8px'
                    }}
                  />
                </div>
              </div>

              {/* Time Step */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: 'var(--terminal-secondary)', fontSize: '8px', marginBottom: '2px' }}>
                  SIMULATION SPEED: {physicsSettings.timeStep.toFixed(4)}s per frame
                </div>
                <input
                  type="range"
                  min="0.008"
                  max="0.033"
                  step="0.001"
                  value={physicsSettings.timeStep}
                  onChange={(e) => updatePhysicsSettings({ timeStep: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Iterations */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: 'var(--terminal-secondary)', fontSize: '8px', marginBottom: '2px' }}>
                  VELOCITY ITERATIONS: {physicsSettings.velocityIterations}
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={physicsSettings.velocityIterations}
                  onChange={(e) => updatePhysicsSettings({ velocityIterations: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Physics Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '8px', color: 'var(--terminal-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={physicsSettings.allowSleep}
                    onChange={(e) => updatePhysicsSettings({ allowSleep: e.target.checked })}
                    style={{ marginRight: '4px', accentColor: 'var(--terminal-success)', transform: 'scale(0.7)' }}
                  />
                  Allow Sleep
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '8px', color: 'var(--terminal-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={physicsSettings.continuousPhysics}
                    onChange={(e) => updatePhysicsSettings({ continuousPhysics: e.target.checked })}
                    style={{ marginRight: '4px', accentColor: 'var(--terminal-success)', transform: 'scale(0.7)' }}
                  />
                  Continuous Physics
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};