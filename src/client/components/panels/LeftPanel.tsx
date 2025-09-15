import React from 'react';
import { LayerType } from '../../hooks/useTileManager';
import { useTileManager } from '../../hooks/useTileManager';
import { LayerSelector } from './LayerSelector';
import { ActionButtons } from './ActionButtons';
import { CameraControls } from './CameraControls';
import { HierarchyPanel } from './HierarchyPanel';

interface LeftPanelProps {
  currentLayer: LayerType;
  setCurrentLayer: (layer: LayerType) => void;
  cameraZoom: number;
  tileManager: ReturnType<typeof useTileManager>;
  showHierarchy: boolean;
  setShowHierarchy: (show: boolean) => void;
  editingName: string | null;
  editingValue: string;
  setEditingName: (id: string | null) => void;
  setEditingValue: (value: string) => void;
  handleEditName: (id: string, currentName: string) => void;
  handleSaveName: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  currentLayer,
  setCurrentLayer,
  cameraZoom,
  tileManager,
  showHierarchy,
  setShowHierarchy,
  editingName,
  editingValue,
  setEditingName,
  setEditingValue,
  handleEditName,
  handleSaveName
}) => {
  return (
    <div style={{ width: '200px', paddingRight: '20px', borderRight: '1px solid var(--terminal-border)' }}>
      <LayerSelector 
        currentLayer={currentLayer}
        setCurrentLayer={setCurrentLayer}
      />
      
      <ActionButtons tileManager={tileManager} />
      
      <CameraControls cameraZoom={cameraZoom} />
      
      <HierarchyPanel
        tileManager={tileManager}
        showHierarchy={showHierarchy}
        setShowHierarchy={setShowHierarchy}
        editingName={editingName}
        editingValue={editingValue}
        setEditingName={setEditingName}
        setEditingValue={setEditingValue}
        handleEditName={handleEditName}
        handleSaveName={handleSaveName}
      />
    </div>
  );
};