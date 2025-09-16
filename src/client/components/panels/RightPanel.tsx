import React from 'react';
import { useTileManager, Tile } from '../../hooks/useTileManager';
import { UsePhysicsReturn } from '../../physics/hooks/usePhysics';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { TransformSection } from './TransformSection';
import { AppearanceSection } from './AppearanceSection';
import { MeshInfoSection } from './MeshInfoSection';
import { PhysicsPropertiesPanel } from '../physics/PhysicsPropertiesPanel';

interface RightPanelProps {
  tileManager: ReturnType<typeof useTileManager>;
  selectedTiles: Tile[];
  firstTile: Tile | undefined;
  isMultiple: boolean;
  center: { x: number; y: number };
  updateTilePropertyEnhanced: (path: string, value: any) => void;
  physics: UsePhysicsReturn;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  tileManager,
  selectedTiles,
  firstTile,
  isMultiple,
  center,
  updateTilePropertyEnhanced,
  physics
}) => {
  return (
    <div 
      className="properties-panel"
      style={{ 
        width: '300px', 
        paddingLeft: '20px', 
        borderLeft: '1px solid var(--terminal-border)',
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none'  // IE and Edge
      }}
    >
      <style>{`
        .properties-panel::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      
      <div style={{ color: 'var(--terminal-accent)', marginBottom: '10px', fontSize: '12px' }}>
        PROPERTIES
      </div>
      
      {selectedTiles.length > 0 && firstTile ? (
        <div style={{ fontSize: '10px' }}>
          {/* Multi-selection indicator */}
          {isMultiple && (
            <div style={{ 
              marginBottom: '10px', 
              padding: '5px', 
              backgroundColor: 'var(--terminal-accent-bg)', 
              color: 'var(--terminal-accent)',
              fontSize: '9px',
              textAlign: 'center'
            }}>
              {selectedTiles.length} OBJECTS SELECTED
            </div>
          )}

          {/* Mesh information */}
          <MeshInfoSection 
            firstTile={firstTile}
            tileManager={tileManager}
          />

          {/* Tile Properties Section - Collapsible */}
          <CollapsibleSection title="TILE PROPERTIES" defaultExpanded={true}>
            <TransformSection
              firstTile={firstTile}
              isMultiple={isMultiple}
              center={center}
              updateTilePropertyEnhanced={updateTilePropertyEnhanced}
            />

            <AppearanceSection
              firstTile={firstTile}
              isMultiple={isMultiple}
              tileManager={tileManager}
              updateTilePropertyEnhanced={updateTilePropertyEnhanced}
            />
          </CollapsibleSection>

          {/* Physics Components Section - Collapsible */}
          <CollapsibleSection 
            title="PHYSICS COMPONENTS" 
            defaultExpanded={false}
            accentColor="var(--terminal-success)"
          >
            <PhysicsPropertiesPanel 
              tileId={firstTile?.id}
              physics={physics}
              tileManager={tileManager}
            />
          </CollapsibleSection>
        </div>
      ) : (
        <div style={{ 
          color: 'var(--terminal-secondary)', 
          fontSize: '10px',
          textAlign: 'center',
          paddingTop: '50px'
        }}>
          Select a tile to view properties
        </div>
      )}
    </div>
  );
};