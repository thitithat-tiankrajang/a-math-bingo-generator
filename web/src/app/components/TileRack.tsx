import React from 'react';
import Tile from './Tile';
import EmptySlot from './EmptySlot';

interface TileRackProps {
  displayElements: (string | null)[];
  selectedTileIndex: number | null;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  usedTileIndices: Set<number>;
  choiceSelections: {[key: string]: string};
  showChoicePopup: boolean;
  onTileClick: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRackSlotClick: (index: number) => void;
  onRackDragOver: (e: React.DragEvent) => void;
  onRackDragLeave: (e: React.DragEvent) => void;
  onRackDrop: (e: React.DragEvent) => void;
  onRackSlotDrop: (e: React.DragEvent, index: number) => void;
  setDragOverIndex: (index: number | null) => void;
}

export default function TileRack({
  displayElements,
  selectedTileIndex,
  draggedIndex,
  dragOverIndex,
  choiceSelections,
  showChoicePopup,
  onTileClick,
  onDragStart,
  onDragEnd,
  onRackSlotClick,
  onRackDragOver,
  onRackDragLeave,
  onRackDrop,
  onRackSlotDrop,
  setDragOverIndex,
}: TileRackProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-green-900 border-b pb-2">
          Problem Set
        </h3>
      </div>
      
      {/* Tile rack: single row responsive layout with visible empty slots */}
      <div
        className={`flex gap-1 sm:gap-2 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative overflow-x-auto ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}
        onDragOver={onRackDragOver}
        onDragLeave={onRackDragLeave}
        onDrop={onRackDrop}
      >
        {displayElements.map((element, index) => {
          const isSelected = selectedTileIndex === index && !!element;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;
          
          return element ? (
            <Tile
              key={`rack-${index}`}
              element={element}
              index={index}
              sourceType="rack"
              isSelected={isSelected}
              isDragging={isDragging}
              isDragOver={isDragOver}
              choiceSelections={choiceSelections}
              onClick={() => onTileClick(index)}
              onDragStart={(e) => onDragStart(e, index)}
              onDragEnd={onDragEnd}
              draggable={true}
            />
          ) : (
            <EmptySlot
              key={`rack-empty-${index}`}
              index={index}
              slotType="rack"
              isDragOver={isDragOver}
              onClick={() => {
                if (selectedTileIndex !== null && displayElements[selectedTileIndex]) {
                  onRackSlotClick(index);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIndex(index);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRackSlotDrop(e, index);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
