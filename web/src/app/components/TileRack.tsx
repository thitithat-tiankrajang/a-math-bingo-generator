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
        <h3 className="text-lg font-semibold text-[var(--brand-dark)] border-b-2 border-[var(--brand-secondary)] pb-2">
          🧮 Problem Set
        </h3>
      </div>
      
      {/* Tile rack: single-row with responsive tile size - no scrolling needed */}
      <div
        className={`
          flex items-center justify-center gap-[var(--tile-gap)] p-3 sm:p-4
          bg-[var(--brand-accent-light)] rounded-lg shadow-lg 
          border-2 border-[var(--brand-secondary)]
          relative flex-wrap
          ${showChoicePopup ? 'blur-sm opacity-60' : ''}
          [&_*]:transition-none [&_*]:duration-0 [&_*]:animate-none
        `}
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
