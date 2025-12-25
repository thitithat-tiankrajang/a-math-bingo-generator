import React from 'react';
import Tile from './Tile';
import EmptySlot from './EmptySlot';
import type { SelectedTile } from '@/app/types/TileSelection';
import type { TilePiece } from '@/app/types/TilePiece';

interface TileRackProps {
  displayElements: (TilePiece | null)[];
  selectedTile: SelectedTile;
  draggedIndex: number | null;
  dragOverIndex: number | null;
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
  selectedTile,
  draggedIndex,
  dragOverIndex,
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
  const selectedRackIndex =
    selectedTile?.source === 'rack' ? selectedTile.index : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--brand-dark)] border-b-2 border-[var(--brand-secondary)] pb-2">
          🧮 Problem Set
        </h3>
      </div>

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
          const isSelected = selectedRackIndex === index && !!element;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

          return element ? (
            <Tile
              key={`rack-${index}`}
              element={element.value}
              tileId={element.tileId}
              index={index}
              sourceType="rack"
              isSelected={isSelected}
              isDragging={isDragging}
              isDragOver={isDragOver}
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
                // ✅ Allow moving selected tile into this empty rack slot
                // - selected from rack: move within rack
                // - selected from answer: move answer -> rack
                if (!selectedTile) return;
                if (selectedTile.source === 'rack') {
                  if (selectedRackIndex !== null && displayElements[selectedRackIndex]) onRackSlotClick(index);
                  return;
                }
                if (selectedTile.source === 'answer') {
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
