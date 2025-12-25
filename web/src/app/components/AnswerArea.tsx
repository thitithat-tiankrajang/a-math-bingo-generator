import React, { useEffect, useMemo, useState } from 'react';
import Tile from './Tile';
import EmptySlot from './EmptySlot';
import ChildButton from '../ui/ChildButton';
import { SelectedTile } from '../types/TileSelection';
import type { TilePiece } from '@/app/types/TilePiece';

interface AnswerAreaProps {
  answerTiles: (TilePiece | null)[];
  selectedTile: SelectedTile
  answerDragOverIndex: number | null;
  answerDropTarget: number | null;
  answerDraggedIndex: number | null;
  currentHighlightIndex: number | null;
  isCheckingAnswer: boolean;
  showChoicePopup: boolean;
  hasAllChoicesSelected: () => boolean;
  onAnswerTileClick: (index: number) => void;
  onAnswerBoxClick: (index: number) => void;
  onClearAnswerBox?: (index: number) => void;
  onSubmitAnswer: () => void;
  onValidateEquationWithChoices: () => void;
  onResetOrder: () => void;
  onClearAllAnswers: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSaveProblemImage?: () => void;
  // Drag handlers
  onAnswerDragStart: (e: React.DragEvent, index: number) => void;
  onAnswerInternalDragOver: (e: React.DragEvent, index: number) => void;
  onAnswerInternalDragLeave: () => void;
  onAnswerInternalDrop: (e: React.DragEvent, index: number) => void;
  onAnswerDragOver: (e: React.DragEvent, index: number) => void;
  onAnswerDragLeave: () => void;
  onAnswerDrop: (e: React.DragEvent, index: number) => void;
  onAnswerDragEnd: () => void;
  setAnswerDropTarget: (index: number | null) => void;
  // Stats
  rackTilesCount: number;
  totalTilesCount: number;
  // Lock mode props
  lockMode?: boolean;
  scrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  maxAnswerLength?: number;
  lockPositions?: number[]; // Original lock positions from result
}

export default function AnswerArea({
  answerTiles,
  selectedTile,
  answerDragOverIndex,
  answerDropTarget,
  answerDraggedIndex,
  currentHighlightIndex,
  isCheckingAnswer,
  showChoicePopup,
  hasAllChoicesSelected,
  onAnswerTileClick,
  onAnswerBoxClick,
  onSubmitAnswer,
  onValidateEquationWithChoices,
  onResetOrder,
  onClearAllAnswers,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveProblemImage,
  onAnswerDragStart,
  onAnswerInternalDragOver,
  onAnswerInternalDragLeave,
  onAnswerInternalDrop,
  onAnswerDragOver,
  onAnswerDragLeave,
  onAnswerDrop,
  onAnswerDragEnd,
  setAnswerDropTarget,
  rackTilesCount,
  totalTilesCount,
  lockMode = false,
  scrollOffset = 0,
  onScrollOffsetChange,
  maxAnswerLength = 15,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lockPositions = [], // ✅ Not used - AnswerArea uses answerTiles.isLocked instead (values from DB)
}: AnswerAreaProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { scrollOffset, onScrollOffsetChange, maxAnswerLength };
  // Simple lock mode: show exactly totalTiles slots, lock positions according to lockPositions
  // - answerTiles has length = totalCount (number of generated tiles)
  // - Show exactly totalTiles slots (no scrolling, no empty slots)
  // - Lock positions are direct: slotIndex = tileIndex (from lockPositions)
  
  // ✅ Lock by POSITION (slotIndex) not by tile identity
  // Map: slotIndex -> tileIndex (original index in answerTiles array)
  // In lock mode, slotIndex = tileIndex directly (no offset)
  const [lockedSlotToTileIndex, setLockedSlotToTileIndex] = useState<Record<number, number>>({});
  
  // Create slots array - exactly totalTiles slots
  const slots = useMemo(() => {
    // Simple mode: show all tiles in order, lock positions according to lockPositions
    return answerTiles.map((tile, index) => ({
      tile,
      actualIndex: index,
      isVisible: true,
      slotIndex: index,
    }));
  }, [answerTiles]);

  const handleAnswerClick = (index: number, isLocked: boolean) => {
    if (isLocked) return;
  
    // ถ้ากำลังเลือก tile จาก rack -> คลิกที่ answer = วาง
    if (selectedTile?.source === 'rack') {
      onAnswerBoxClick(index);
      return;
    }
  
    // ไม่ได้เลือกจาก rack -> ใช้ behavior เดิม (select/swap ใน answer)
    onAnswerTileClick(index);
  };
  
  
  
  // ✅ Initialize locked positions based on answerTiles (which already have isLocked flag from DisplayBox)
  // DisplayBox sets isLocked=true and value from DB (listPosLock) on answerTiles
  // So we can use answerTiles directly to determine locked positions
  useEffect(() => {
    if (!lockMode) {
      setLockedSlotToTileIndex({});
      return;
    }
  
    // ✅ Build lock mapping from answerTiles that have isLocked=true
    // This ensures we use the exact values from DB (listPosLock)
    const next: Record<number, number> = {};
    
    answerTiles.forEach((tile, index) => {
      if (tile?.isLocked) {
        // Direct mapping: slotIndex = tileIndex
        next[index] = index;
      }
    });
  
    setLockedSlotToTileIndex(next);
    console.log("🔒 AnswerArea: Initialized locked positions from answerTiles:", {
      lockedCount: Object.keys(next).length,
      lockedIndices: Object.keys(next).map(Number),
      answerTilesLocked: answerTiles.filter(t => t?.isLocked).map((t, i) => ({ index: i, value: t?.value }))
    });
  }, [lockMode, answerTiles]);
  
  return (
    <div className="space-y-4" id="answer-section">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${showChoicePopup ? '' : ''}`}>
        <h3 className="text-lg font-semibold text-[var(--brand-dark)] border-b-2 border-[var(--brand-secondary)] pb-2">
          ✏️ Your Answer
        </h3>
        <div className="flex items-center gap-2">
          {/* Save Image Button */}
          {onSaveProblemImage && (
            <ChildButton 
              onClick={onSaveProblemImage} 
              className="px-3 py-1 text-xs bg-[var(--brand)] text-[var(--color-on-brand)] hover:bg-[var(--brand-medium)] rounded-lg shadow-sm font-medium border border-[var(--brand-secondary)]"
            >
              💾 Save Image
            </ChildButton>
          )}
          {/* Reset button */}
          <ChildButton
            onClick={onResetOrder}
            className="text-xs px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg border border-amber-300 font-medium"
          >
            🔄 Reset
          </ChildButton>
          <ChildButton
            onClick={onClearAllAnswers}
            className="text-xs px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg border border-red-300 font-medium"
          >
            🗑️ Clear All
          </ChildButton>
          {/* Undo/Redo Buttons */}
          {onUndo && (
            <ChildButton 
              onClick={onUndo} 
              disabled={!canUndo} 
              className="text-xs px-3 py-1 bg-[var(--brand-secondary)] text-[var(--color-on-brand)] hover:bg-[var(--brand)] rounded-lg border border-[var(--brand)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↶ Undo
            </ChildButton>
          )}
          {onRedo && (
            <ChildButton 
              onClick={onRedo} 
              disabled={!canRedo} 
              className="text-xs px-3 py-1 bg-[var(--brand-secondary)] text-[var(--color-on-brand)] hover:bg-[var(--brand)] rounded-lg border border-[var(--brand)] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↷ Redo
            </ChildButton>
          )}
        </div>
      </div>
      
      
      {/* Answer Boxes - single row with responsive tile size - no scrolling needed */}
      <div 
        className={`
          flex items-center justify-center gap-[var(--tile-gap)] p-4 sm:p-6 
          bg-gradient-to-br from-[var(--brand-secondary-light)] to-[var(--brand-accent-light)] 
          rounded-xl shadow-lg border-2 border-[var(--brand-secondary)] 
          min-h-[calc(var(--tile-size)+1rem)] relative flex-wrap
          ${showChoicePopup ? 'z-30' : ''}
        `}
        data-answer-container
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          // Only clear if leaving the container entirely
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setAnswerDropTarget(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          // Reset drop target when dropping on container
          setAnswerDropTarget(null);
        }}
      >
        {slots.map((slot, slotIndex) => {
  const { tile, actualIndex, isVisible } = slot;

  if (!isVisible && actualIndex === -1) return null;

  // locked by position
  const isLocked = lockMode && lockedSlotToTileIndex[slotIndex] === actualIndex;

   // ✅ locked: never show selection/highlight effects
  const isDragOver = !isLocked && answerDragOverIndex === actualIndex;
  const isHighlighted = !isLocked && currentHighlightIndex === actualIndex;
  const isDropTarget = !isLocked && answerDropTarget === actualIndex;

  // isDragging จะคงไว้ก็ได้ แต่ถ้าต้องการตัดด้วยก็ทำ !isLocked เช่นกัน
  const isDragging = answerDraggedIndex === actualIndex;

  // ✅ when locked -> treat like "background", so no interactions
  const canInteract = !!tile && !isLocked && isVisible;
  const selectedAnswerIndex = selectedTile?.source === 'answer' ? selectedTile.index : null;
  return (
    <div
      key={lockMode ? `slot-${slotIndex}` : actualIndex}
      data-answer-box
      draggable={canInteract}
      onDragStart={
        canInteract
          ? (e) => onAnswerDragStart(e, actualIndex)
          : undefined
      }
      onDragOver={(e) => {
        if (!isVisible || actualIndex === -1) return;

        // ✅ ignore ALL drag hover when locked
        if (isLocked) return;

        e.preventDefault();
        e.stopPropagation();

        if (answerDraggedIndex !== null) {
          onAnswerInternalDragOver(e, actualIndex);
        } else {
          if (tile) onAnswerInternalDragOver(e, actualIndex);
          else onAnswerDragOver(e, actualIndex);
        }
      }}
      onDragLeave={(e) => {
        if (!isVisible || actualIndex === -1) return;

        if (isLocked) return;

        e.preventDefault();
        e.stopPropagation();

        if (answerDraggedIndex !== null) onAnswerInternalDragLeave();
        else {
          if (tile) onAnswerInternalDragLeave();
          else onAnswerDragLeave();
        }
      }}
      onDrop={(e) => {
        if (!isVisible || actualIndex === -1) return;

        // ✅ locked: don't accept drops / swaps
        if (isLocked) return;

        e.preventDefault();
        e.stopPropagation();

        if (answerDraggedIndex !== null) {
          onAnswerInternalDrop(e, actualIndex);
        } else {
          if (tile) onAnswerInternalDrop(e, actualIndex);
          else onAnswerDrop(e, actualIndex);
        }
      }}
      onDragEnd={canInteract ? onAnswerDragEnd : undefined}
      // ✅ locked should not be clickable/selectable
      onClick={isLocked ? undefined : undefined}
      className={isLocked ? 'cursor-default' : undefined}
    >
      {tile ? (
        isLocked ? (
          // ✅ Render as "background" (not Tile component)
          <div
            className={`
              relative aspect-square
              min-w-[var(--tile-size)] w-[var(--tile-size)] h-[var(--tile-size)]
              text-[calc(var(--tile-size)*0.35)]
              flex items-center justify-center
              rounded
              font-bold
              flex-shrink-0
              border-4 border-gray-300
              bg-gray-100
              text-gray-600
              select-none
              pointer-events-none
            `}
            aria-label={`locked-${tile.value}`}
          >
            {tile.value}
          </div>
        ) : (
          <Tile
            element={tile.value}
            tileId={tile.tileId}
            index={actualIndex}
            sourceType="answer"
            isSelected={!isLocked && selectedAnswerIndex === actualIndex}
            isDragging={isDragging}
            isDragOver={isDragOver || (isDropTarget && answerDraggedIndex !== null)}
            isHighlighted={isHighlighted}
            choiceSelection={tile.choiceSelection}
            onClick={() => handleAnswerClick(actualIndex, isLocked)}
            className={`
              ${isDragOver ? 'ring-4 ring-purple-500 ring-opacity-80 scale-105 bg-purple-300 shadow-lg' : ''}
              ${isDropTarget && answerDraggedIndex !== null && answerDraggedIndex !== actualIndex
                ? 'ring-4 ring-blue-500 ring-opacity-90 bg-gradient-to-br from-blue-200 to-blue-300 border-blue-600 scale-110 z-10 shadow-xl'
                : ''
              }
              ${isDragging ? 'opacity-60 scale-95 shadow-2xl border-2 border-red-500 z-20 rotate-2' : ''}
            `}
          />
        )
      ) : (
        <EmptySlot
          index={actualIndex}
          slotType="answer"
          isDragOver={isDragOver}
          isDropTarget={isDropTarget && answerDraggedIndex !== null}
          onClick={() => handleAnswerClick(actualIndex, isLocked)}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (answerDraggedIndex !== null) onAnswerInternalDragOver(e, actualIndex);
            else onAnswerDragOver(e, actualIndex);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (answerDraggedIndex !== null) onAnswerInternalDragLeave();
            else onAnswerDragLeave();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (answerDraggedIndex !== null) onAnswerInternalDrop(e, actualIndex);
            else onAnswerDrop(e, actualIndex);
          }}
          className={`
            ${isDragOver ? 'ring-4 ring-purple-500 ring-opacity-80 scale-105 bg-purple-300 shadow-lg' : ''}
            ${isDragOver ? 'border-green-400 bg-gradient-to-br from-green-100 to-green-200' : ''}
          `}
        />
      )}
    </div>
  );
})}

      </div>
      
      {/* Submit Section */}
      <div className={`flex flex-col items-center gap-3 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <ChildButton
            onClick={onSubmitAnswer}
            disabled={isCheckingAnswer || answerTiles.every(tile => tile === null)}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-bold border-2 rounded-lg transition-all duration-200 ${
              isCheckingAnswer || answerTiles.every(tile => tile === null)
                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                : 'bg-[var(--brand)] text-[var(--color-on-brand)] border-[var(--brand-secondary)] hover:bg-[var(--brand-medium)] shadow-md'
            }`}
          >
            {isCheckingAnswer ? '🔄 Selecting...' : '🎯 Select Operator'}
          </ChildButton>
          
          {/* Show Check Equation button - always visible but disabled when not ready */}
          <ChildButton
            onClick={onValidateEquationWithChoices}
            disabled={isCheckingAnswer || !hasAllChoicesSelected()}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-bold border-2 rounded-lg transition-all duration-200 ${
              isCheckingAnswer || !hasAllChoicesSelected()
                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                : 'bg-[var(--brand-accent)] text-[var(--color-on-brand)] border-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)] shadow-md'
            }`}
          >
            {isCheckingAnswer ? '⏳ Checking...' : '✅ Check Equation'}
          </ChildButton>
          
          <div className="text-xs sm:text-sm text-[var(--brand-medium)] font-medium bg-[var(--brand-accent-light)] px-2 sm:px-3 py-1 rounded-full border border-[var(--brand-secondary)]">
            📊 Answer: {answerTiles.filter(tile => tile !== null).length} | 
            🎲 Rack: {rackTilesCount} | 
            🎯 Total: {answerTiles.filter(tile => tile !== null).length + rackTilesCount} / {totalTilesCount}
          </div>
        </div>
      </div>
    </div>
  );
}
