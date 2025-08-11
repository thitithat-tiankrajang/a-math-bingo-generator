import React from 'react';
import Tile from './Tile';
import EmptySlot from './EmptySlot';
import ChildButton from '../ui/ChildButton';

interface AnswerTile {
  value: string;
  sourceIndex: number;
  tileId: string;
  choiceSelection?: string;
}

interface AnswerAreaProps {
  answerTiles: (AnswerTile | null)[];
  selectedTileIndex: number | null;
  answerDragOverIndex: number | null;
  answerDropTarget: number | null;
  answerDraggedIndex: number | null;
  currentHighlightIndex: number | null;
  choiceSelections: {[key: string]: string};
  isCheckingAnswer: boolean;
  showChoicePopup: boolean;
  hasAllChoicesSelected: () => boolean;
  onAnswerTileClick: (index: number) => void;
  onAnswerBoxClick: (index: number) => void;
  onClearAnswerBox: (index: number) => void;
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
}

export default function AnswerArea({
  answerTiles,
  selectedTileIndex,
  answerDragOverIndex,
  answerDropTarget,
  answerDraggedIndex,
  currentHighlightIndex,
  isCheckingAnswer,
  showChoicePopup,
  hasAllChoicesSelected,
  onAnswerTileClick,
  onAnswerBoxClick,
  onClearAnswerBox,
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
}: AnswerAreaProps) {
  return (
    <div className="space-y-4" id="answer-section">
      <div className={`flex items-center justify-between ${showChoicePopup ? '' : ''}`}>
        <h3 className="text-lg font-semibold text-purple-900 border-b pb-2">
          Your Answer
        </h3>
        <div className="flex items-center gap-2">
          {/* Save Image Button */}
          {onSaveProblemImage && (
            <ChildButton onClick={onSaveProblemImage} className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600">
              💾 Save Image
            </ChildButton>
          )}
          {/* Reset button */}
          <ChildButton
            onClick={onResetOrder}
            className="text-xs px-3 py-1"
          >
            Reset
          </ChildButton>
          <ChildButton
            onClick={onClearAllAnswers}
            className="text-xs px-3 py-1"
          >
            Clear All
          </ChildButton>
          {/* Undo/Redo Buttons */}
          {onUndo && (
            <ChildButton 
              onClick={onUndo} 
              disabled={!canUndo} 
              className="text-xs px-3 py-1">
              Undo
            </ChildButton>
          )}
          {onRedo && (
            <ChildButton 
              onClick={onRedo} 
              disabled={!canRedo} 
              className="text-xs px-3 py-1">
              Redo
            </ChildButton>
          )}
        </div>
      </div>
      
      {/* Answer Boxes - single row */}
      <div 
        className={`flex gap-1 sm:gap-2 justify-center p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-lg border-2 border-purple-300 min-h-[100px] relative overflow-x-auto ${showChoicePopup ? 'z-30' : ''}`}
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
        {answerTiles.map((tile, index) => {
          const isDragOver = answerDragOverIndex === index;
          const isHighlighted = currentHighlightIndex === index;
          const isDropTarget = answerDropTarget === index;
          const isDragging = answerDraggedIndex === index;
          
          return (
            <div
              key={index}
              data-answer-box
              draggable={tile !== null}
              onDragStart={tile ? (e) => {
                onAnswerDragStart(e, index);
              } : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if this is internal drag (from answer to answer)
                if (answerDraggedIndex !== null) {
                  // Internal drag (within answer area)
                  onAnswerInternalDragOver(e, index);
                } else {
                  // External drag (from rack to answer)
                  if (tile) {
                    onAnswerInternalDragOver(e, index);
                  } else {
                    onAnswerDragOver(e, index);
                  }
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if this is internal drag
                if (answerDraggedIndex !== null) {
                  onAnswerInternalDragLeave();
                } else {
                  if (tile) {
                    onAnswerInternalDragLeave();
                  } else {
                    onAnswerDragLeave();
                  }
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if this is internal drag
                if (answerDraggedIndex !== null) {
                  // Internal drop (within answer area)
                  onAnswerInternalDrop(e, index);
                } else {
                  // External drop (from rack to answer)
                  if (tile) {
                    onAnswerInternalDrop(e, index);
                  } else {
                    onAnswerDrop(e, index);
                  }
                }
              }}
              onDragEnd={() => {
                onAnswerDragEnd();
              }}
            >
              {tile ? (
                <Tile
                  element={tile.value}
                  index={index}
                  sourceType="answer"
                  isSelected={selectedTileIndex === tile.sourceIndex}
                  isDragging={isDragging}
                  isDragOver={isDragOver || (isDropTarget && answerDraggedIndex !== null)}
                  isHighlighted={isHighlighted}
                  choiceSelections={{[`${tile.value}_${index}`]: tile.choiceSelection || ''}}
                  onClick={() => onAnswerTileClick(index)}
                  onClear={() => onClearAnswerBox(index)}
                  className={`
                    ${isDragOver 
                      ? 'ring-4 ring-purple-500 ring-opacity-80 scale-105 bg-purple-300 shadow-lg' 
                      : ''
                    }
                    ${isDropTarget && answerDraggedIndex !== null && answerDraggedIndex !== index
                      ? 'ring-4 ring-blue-500 ring-opacity-90 bg-gradient-to-br from-blue-200 to-blue-300 border-blue-600 scale-110 z-10 shadow-xl'
                      : ''
                    }
                    ${isDragging
                      ? 'opacity-60 scale-95 shadow-2xl border-2 border-red-500 z-20 rotate-2'
                      : ''
                    }
                  `}
                />
              ) : (
                <EmptySlot
                  index={index}
                  slotType="answer"
                  isDragOver={isDragOver}
                  isDropTarget={isDropTarget && answerDraggedIndex !== null}
                  onClick={() => {
                    if (selectedTileIndex !== null) {
                      onAnswerBoxClick(index);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Check if this is internal drag (from answer to answer)
                    if (answerDraggedIndex !== null) {
                      onAnswerInternalDragOver(e, index);
                    } else {
                      onAnswerDragOver(e, index);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Check if this is internal drag
                    if (answerDraggedIndex !== null) {
                      onAnswerInternalDragLeave();
                    } else {
                      onAnswerDragLeave();
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Check if this is internal drag
                    if (answerDraggedIndex !== null) {
                      onAnswerInternalDrop(e, index);
                    } else {
                      onAnswerDrop(e, index);
                    }
                  }}
                  className={`
                    ${isDragOver 
                      ? 'ring-4 ring-purple-500 ring-opacity-80 scale-105 bg-purple-300 shadow-lg' 
                      : ''
                    }
                    ${isDragOver
                      ? 'border-green-400 bg-gradient-to-br from-green-100 to-green-200'
                      : ''
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Submit Section */}
      <div className={`flex flex-col items-center gap-3 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
        <div className="flex items-center gap-4">
          <ChildButton
            onClick={onSubmitAnswer}
            disabled={isCheckingAnswer || answerTiles.every(tile => tile === null)}
            className={`px-6 py-3 text-lg font-bold border-2 transition-all duration-200 ${
              isCheckingAnswer || answerTiles.every(tile => tile === null)
            }`}
          >
            {isCheckingAnswer ? 'Selecting...' : 'Select Operator'}
          </ChildButton>
          
          {/* Show Check Equation button - always visible but disabled when not ready */}
          <ChildButton
            onClick={onValidateEquationWithChoices}
            disabled={isCheckingAnswer || !hasAllChoicesSelected()}
            className={`px-6 py-3 text-lg font-bold border-2 transition-all duration-200 ${
              isCheckingAnswer || !hasAllChoicesSelected()
            }`}
          >
            {isCheckingAnswer ? 'Checking...' : 'Check Equation'}
          </ChildButton>
          
          <div className="text-sm text-gray-600">
            Answer: {answerTiles.filter(tile => tile !== null).length} | 
            Rack: {rackTilesCount} | 
            Total: {answerTiles.filter(tile => tile !== null).length + rackTilesCount} / {totalTilesCount}
          </div>
        </div>
      </div>
    </div>
  );
}
