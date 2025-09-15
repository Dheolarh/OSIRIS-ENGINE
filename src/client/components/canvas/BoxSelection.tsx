import React from 'react';
import { useInteractionState } from '../../hooks/useInteractionState';

interface BoxSelectionProps {
  interaction: ReturnType<typeof useInteractionState>;
}

export const BoxSelection: React.FC<BoxSelectionProps> = ({ interaction }) => {
  if (interaction.state.mode !== 'box-selecting' || !interaction.state.boxSelectData) {
    return null;
  }

  const { boxSelectData } = interaction.state;

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.min(boxSelectData.startX, boxSelectData.endX),
        top: Math.min(boxSelectData.startY, boxSelectData.endY),
        width: Math.abs(boxSelectData.endX - boxSelectData.startX),
        height: Math.abs(boxSelectData.endY - boxSelectData.startY),
        border: '2px dashed var(--terminal-accent)',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: 2000
      }}
    />
  );
};