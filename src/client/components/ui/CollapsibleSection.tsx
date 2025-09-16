import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  accentColor?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  children,
  accentColor = 'var(--terminal-accent)'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: '15px' }}>
      <div 
        style={{ 
          color: accentColor, 
          marginBottom: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '5px 0',
          borderBottom: `1px solid ${accentColor}`,
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{title}</span>
        <span style={{ fontSize: '10px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div style={{ 
          padding: '8px 0',
          borderLeft: `2px solid ${accentColor}`,
          paddingLeft: '8px'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};