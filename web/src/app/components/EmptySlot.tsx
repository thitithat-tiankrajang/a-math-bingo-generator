/**
 * EmptySlot Component
 * 
 * A unified component for rendering empty slots in both answer and rack areas.
 * This component handles the common functionality of:
 * - Visual representation of empty slots
 * - Click-to-place tile interactions
 * - Drag & drop target behaviors
 * - Type-specific styling (answer vs rack)
 * 
 * Used by: Tile component (when element is empty) and DisplayBox
 */

import React from 'react';

interface EmptySlotProps {
  index: number;
  slotType: 'answer' | 'rack';
  isDragOver?: boolean;
  isDropTarget?: boolean;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
}

export default function EmptySlot({
  index,
  slotType,
  isDragOver = false,
  isDropTarget = false,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  className = ""
}: EmptySlotProps) {
  
  // Base styles for empty slots
  const baseClasses = `
    relative aspect-square 
    min-w-[40px] w-12 sm:w-14 md:w-16 lg:w-18 
    text-sm sm:text-base md:text-lg lg:text-xl
    flex items-center justify-center rounded font-bold 
    transition-all duration-300 ease-in-out flex-shrink-0
    cursor-pointer
  `;

  // Type-specific styles
  const typeClasses = slotType === 'answer'
    ? 'border-2 border-dashed border-purple-400 bg-gradient-to-br from-purple-200 to-purple-300 hover:from-purple-300 hover:to-purple-400 shadow-sm'
    : 'border-2 border-dashed border-amber-400 bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 shadow-md ring-1 ring-amber-300';

  // Drag feedback styles
  const dragClasses = `
    ${isDragOver 
      ? 'ring-4 ring-green-400 ring-opacity-75 scale-105 bg-green-50' 
      : ''
    }
    ${isDropTarget && slotType === 'answer'
      ? 'ring-4 ring-green-500 ring-opacity-90 bg-gradient-to-br from-green-200 to-green-300 border-green-600 scale-110 z-10 animate-pulse shadow-xl'
      : ''
    }
    ${isDropTarget && slotType === 'rack'
      ? 'ring-4 ring-amber-500 ring-opacity-90 bg-gradient-to-br from-amber-200 to-amber-300 border-amber-600 scale-110 z-10 animate-pulse shadow-xl'
      : ''
    }
  `;

  // Content based on slot type
  const renderContent = () => {
    if (slotType === 'answer') {
      return (
        <div className="text-purple-500 text-sm font-medium transition-all flex items-center justify-center">
          <span>{index + 1}</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center opacity-80">
        </div>
      );
    }
  };

  // Tooltip text
  const tooltipText = slotType === 'answer' 
    ? `Answer slot ${index + 1} - Click or drag a tile here`
    : "Empty rack slot - Click or drag a tile here";

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${dragClasses} ${className}`}
      title={tooltipText}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-slot-index={index}
      data-slot-type={slotType}
    >
      {renderContent()}
    </div>
  );
} 