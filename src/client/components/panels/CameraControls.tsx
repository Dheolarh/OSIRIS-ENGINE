import React from 'react';

interface CameraControlsProps {
  cameraZoom: number;
}

export const CameraControls: React.FC<CameraControlsProps> = ({ cameraZoom }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ color: 'var(--terminal-accent)', fontSize: '12px' }}>
        ZOOM: {Math.round(cameraZoom * 100)}%
      </div>
    </div>
  );
};