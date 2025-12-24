import React from 'react';
import { AMATH_TOKENS } from "@/app/lib/equationAnagramLogic";
import EmptySlot from './EmptySlot';

interface TileProps {
  element: string;
  index: number;
  sourceType: 'rack' | 'answer';
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isUsedInAnswer?: boolean;
  isHighlighted?: boolean;
  choiceSelections?: {[key: string]: string};
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClear?: () => void;
  className?: string;
  title?: string;
  draggable?: boolean;
}

// ฟังก์ชันกำหนดสีของ element ตามประเภท
function getElementStyle(element: string): string {
  // ตัวเลขเบา (0-9)
  if (/^[0-9]$/.test(element)) {
    return "bg-green-100 text-green-900 border-2 border-green-300 shadow-sm";
  }

  // ตัวเลขหนัก (10-20)
  if (/^(1[0-9]|20)$/.test(element)) {
    return "bg-green-200 text-green-900 border-2 border-green-300 shadow-sm";
  }

  // เครื่องหมายคำนวณพื้นฐาน
  if (["+", "-", "×", "÷"].includes(element)) {
    return "bg-yellow-100 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // เครื่องหมายทางเลือก
  if (["+/-", "×/÷"].includes(element)) {
    return "bg-yellow-100 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // เครื่องหมาย =
  if (element === "=") {
    return "bg-yellow-200 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // Blank ?
  if (element === "?") {
    return "bg-yellow-200 text-yellow-900 border-2 border-yellow-400 shadow-sm";
  }

  // default
  return "bg-green-50 text-green-900 border-2 border-green-100 shadow-sm";
}

// ฟังก์ชันกำหนดป้ายชื่อประเภท
function getElementTypeLabel(element: string): string {
  if (/^[0-9]$/.test(element)) return "Light number";
  if (/^(1[0-9]|20)$/.test(element)) return "Heavy number";
  if (["+", "-", "×", "÷"].includes(element)) return "Operator";
  if (["+/-", "×/÷"].includes(element)) return "Choice operator";
  if (element === "=") return "Equals";
  if (element === "?") return "Blank";
  return "Unknown";
}

// Function to get display text for choice tokens with selected values
function getDisplayTextForChoiceToken(originalToken: string, answerIndex: number, choiceSelections: {[key: string]: string}) {
  const uniqueKey = `${originalToken}_${answerIndex}`;
  const selectedChoice = choiceSelections[uniqueKey];
  
  if (!selectedChoice) return originalToken;
  
  if (originalToken === '+/-') {
    return selectedChoice === '+' 
      ? <span><span className="text-green-600 font-bold">+</span><span className="text-gray-400">/-</span></span>
      : <span><span className="text-gray-400">+/</span><span className="text-red-600 font-bold">-</span></span>;
  }
  
  if (originalToken === '×/÷') {
    return selectedChoice === '×'
      ? <span><span className="text-blue-600 font-bold">×</span><span className="text-gray-400">/÷</span></span>
      : <span><span className="text-gray-400">×/</span><span className="text-purple-600 font-bold">÷</span></span>;
  }
  
  if (originalToken === '?') {
    return <span className="text-orange-600 font-bold">{selectedChoice}</span>;
  }
  
  return originalToken;
}

export default function Tile({
  element,
  index,
  sourceType,
  isSelected = false,
  isDragging = false,
  isDragOver = false,
  isUsedInAnswer = false,
  isHighlighted = false,
  choiceSelections = {},
  onClick,
  onDragStart,
  onDragEnd,
  onClear,
  className = "",
  title,
  draggable = true,
}: TileProps) {
  const baseTitle = title || (
    element 
      ? `${getElementTypeLabel(element)}${isUsedInAnswer ? " - Used in answer" : " - Click to select/move or drag anywhere to reorder"}`
      : sourceType === 'answer' 
        ? `Answer slot ${index + 1} - Click or drag a tile here`
        : "Empty rack slot - Click or drag a tile here"
  );

  // If no element, render EmptySlot
  if (!element) {
    return (
      <EmptySlot
        index={index}
        slotType={sourceType}
        isDragOver={isDragOver}
        isDropTarget={false} // This will be handled by parent component
        onClick={onClick}
        onDragOver={onDragStart} // Pass through drag handlers
        onDragLeave={onDragEnd}
        onDrop={undefined} // Drop handling is done by parent
        className={className}
      />
    );
  }

  return (
    <div
      className={`
        relative aspect-square 
        min-w-[var(--tile-size)] w-[var(--tile-size)] h-[var(--tile-size)]
        text-[calc(var(--tile-size)*0.35)]
        flex items-center justify-center rounded font-bold 
        transition-all duration-300 ease-in-out flex-shrink-0
        ${getElementStyle(element)}
        ${isSelected 
          ? "ring-2 ring-blue-400 ring-opacity-75 scale-110 z-10 shadow-lg bg-blue-100 border-blue-400" 
          : ""
        }
        ${isDragging 
          ? "opacity-50 scale-95" 
          : ""
        }
        ${isDragOver 
          ? "ring-2 ring-green-400 ring-opacity-75 scale-105 bg-green-50" 
          : ""
        }
        ${isUsedInAnswer && sourceType === 'rack'
          ? "opacity-30 pointer-events-none grayscale" 
          : "cursor-pointer hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50"
        }
        ${isSelected ? "animate-pulse" : ""}
        ${isHighlighted 
          ? 'ring-4 ring-yellow-400 ring-opacity-100 scale-125 z-40 shadow-2xl shadow-yellow-500/50 animate-pulse bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-500' 
          : ''
        }
        ${className}
      `}
      title={baseTitle}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      draggable={draggable && !isUsedInAnswer}
      data-tile-index={index}
    >
      <div className="text-center w-full relative z-10">
        {(element === '+/-' || element === '×/÷' || element === '?') && 
         sourceType === 'answer' && choiceSelections[`${element}_${index}`] 
          ? getDisplayTextForChoiceToken(element, index, choiceSelections)
          : element
        }
      </div>
      
      {/* Clear button for answer tiles */}
      {sourceType === 'answer' && onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -top-1 -right-1 w-[calc(var(--tile-size)*0.25)] h-[calc(var(--tile-size)*0.25)] bg-red-500 text-white rounded-full text-[calc(var(--tile-size)*0.2)] hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
          title="Remove tile"
        >
          ×
        </button>
      )}
      
      {/* Point value */}
      <div className="absolute bottom-0.5 right-1 text-[calc(var(--tile-size)*0.15)] text-black font-bold opacity-70 select-none pointer-events-none">
        {AMATH_TOKENS[element as keyof typeof AMATH_TOKENS]?.point ?? ""}
      </div>
    </div>
  );
} 