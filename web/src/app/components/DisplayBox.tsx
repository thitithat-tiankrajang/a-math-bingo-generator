// src/components/DisplayBox.tsx
import type { EquationAnagramResult } from "@/app/types/EquationAnagram";
import { useState, useRef } from "react";
import ChoiceSelectionPopup from "./ChoiceSelectionPopup";
import React from "react";
import html2canvas from "html2canvas";
import { Target } from 'lucide-react';
import EmptyState from './EmptyState';
import TileRack from './TileRack';
import AnswerArea from './AnswerArea';
import NavigationControls from './NavigationControls';
import ProblemStats from './ProblemStats';
import ExampleSolution from './ExampleSolution';
import AnswerFeedback from './AnswerFeedback';
import GenerateButton from './GenerateButton';
import {sortTokenStringsByAmathOrder} from "@/app/lib/tokenSort";
import type { SelectedTile } from "@/app/types/TileSelection";

type DisplayResult = EquationAnagramResult & {
  lockPositions?: number[];
  solutionTokens?: string[];
  listPosLock?: Array<{ pos: number; value: string }> | null; // ✅ Support LockedPos format from DB (read-only, for DisplayBox to use)
};
interface DisplayBoxProps {
  result: DisplayResult | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
  currentIndex?: number;
  total?: number;
  setCurrentIndex?: (idx: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  assignmentMode?: boolean;
  onValidEquation?: (equation: string) => void;
  activeAssignment?: {
    id: string;
    studentProgress?: {
      answers?: Array<{
        questionNumber: number;
        questionText: string;
        answerText: string;
        answeredAt: string;
      }>;
    };
  } | null;
  onSubmitAnswer?: (questionText: string, answerText: string) => Promise<void>;
}

export default function DisplayBox({
  result,
  onGenerate,
  isGenerating,
  currentIndex = 0,
  total = 1,
  setCurrentIndex,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  assignmentMode = false,
  onValidEquation,
  activeAssignment,
  onSubmitAnswer,
}: DisplayBoxProps) {
  // =================== FULLSCREEN FEATURE ===================
  const displayBoxRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);
  const enterFullscreen = () => {
    const el = displayBoxRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };
  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
  };
  // Assignment submission state
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  
  // Tile reordering state - now with empty slots
  const [rackTiles, setRackTiles] = useState<(string | null)[]>([]);
  const [selectedTile, setSelectedTile] = useState<SelectedTile>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Answer state - track individual tile pieces with unique IDs and their choices
  const [answerTiles, setAnswerTiles] = useState<({value: string, sourceIndex: number, tileId: string, choiceSelection?: string, isLocked?: boolean} | null)[]>([]);
  const [answerDragOverIndex, setAnswerDragOverIndex] = useState<number | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [usedTileIndices, setUsedTileIndices] = useState<Set<number>>(new Set());
  
  // Choice selection popup state
  const [showChoicePopup, setShowChoicePopup] = useState(false);
  const [choiceSelections, setChoiceSelections] = useState<{[key: string]: string}>({});
  const [currentChoiceStep, setCurrentChoiceStep] = useState(0);
  const [choiceTokens, setChoiceTokens] = useState<{token: string, index: number, tileId: string}[]>([]);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState<number | null>(null);

  // Answer area drag and drop
  const [answerDraggedIndex, setAnswerDraggedIndex] = useState<number | null>(null);
  const [answerDropTarget, setAnswerDropTarget] = useState<number | null>(null);

  // Track if we're in initialization phase
  const [isInitializing, setIsInitializing] = React.useState(false);

  // Ref for problem set container
  const problemSetRef = useRef<HTMLDivElement>(null);

  // Helper function to clean up all drag states
  const cleanupDragStates = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setAnswerDraggedIndex(null);
    setAnswerDropTarget(null);
    setAnswerDragOverIndex(null);
  };

  // Helper function to generate unique tile ID
  const generateTileId = (sourceIndex: number, value: string) => {
    return `tile_${sourceIndex}_${value}_${Date.now()}`;
  };

  // Update focused tile position in CSS variables
  const updateFocusedTilePosition = (answerIndex: number) => {
    // Find the answer box element
    const answerContainer = document.querySelector('[data-answer-container]');
    if (!answerContainer) return;

    const answerBoxes = answerContainer.querySelectorAll('[data-answer-box]');
    const targetBox = answerBoxes[answerIndex] as HTMLElement;
    
    if (targetBox) {
      const rect = targetBox.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Update CSS variables for positioning
      document.documentElement.style.setProperty('--focused-tile-x', `${centerX}px`);
      document.documentElement.style.setProperty('--focused-tile-y', `${centerY}px`);
    }
  };

  // Debugging function to validate tile integrity
  const validateTileIntegrity = React.useCallback(() => {
    if (!result) return;
    
    // ✅ Skip validation during initialization or if result is changing
    if (isInitializing) return;
    
    // Count tiles in rack (non-null values)
    const rackCount = rackTiles.filter(tile => tile !== null).length;
    
    // Count tiles in answer 
    const answerCount = answerTiles.filter(tile => tile !== null).length;
    
    // ✅ In lock mode, use solutionTokens length if available, otherwise use elements length
    const originalCount = (result.solutionTokens && result.solutionTokens.length > 0)
      ? result.solutionTokens.length
      : result.elements.length;
    
    const currentTotal = rackCount + answerCount;
    
    if (currentTotal !== originalCount) {
      console.warn(`⚠️ Tile count mismatch: Original=${originalCount}, Current=${currentTotal} (Rack=${rackCount}, Answer=${answerCount})`);
      console.warn(`   Result elements: ${result.elements.length}, SolutionTokens: ${result.solutionTokens?.length || 0}`);
      
      // Only auto-fix if the difference is significant (more than 2 tiles missing/extra)
      // ✅ Increased threshold to prevent false positives during state transitions
      const difference = Math.abs(currentTotal - originalCount);
      if (difference > 2) {
        console.error('❌ Critical tile count error - auto-resetting');
        // ✅ Use solutionTokens if available for lock mode, otherwise use elements
        const sourceElements = (result.solutionTokens && result.solutionTokens.length > 0)
          ? result.solutionTokens
          : result.elements;
        setRackTiles([...sourceElements]);
        setAnswerTiles(new Array(sourceElements.length).fill(null));
        setUsedTileIndices(new Set());
        setAnswerFeedback({ type: 'error', message: '🔧 Tiles were automatically reset due to counting error.' });
      }
    }
  }, [result, rackTiles, answerTiles, isInitializing]);

  // Scroll offset state for lock mode
  const MAX_ANSWER_LENGTH = 15;

  // Initialize rack tiles when result changes
  React.useEffect(() => {
    if (!result) return;
  
    setIsInitializing(true);
  
    const lockPositions = result.lockPositions ?? [];
    const hasLock = lockPositions.length > 0;
  
    if (hasLock) {
      // ✅ ใช้ sourceTokens เป็นตัวอ้างอิง: ถ้ามี solutionTokens ใช้เลย ไม่งั้น fallback เป็น elements
      const sourceTokens = (result.solutionTokens && result.solutionTokens.length > 0)
        ? result.solutionTokens
        : result.elements;
  
      const rackElements: (string | null)[] = [];
      // ✅ Use sourceTokens length for answerElements array size (lock positions reference solutionTokens indices)
      const answerElements: ({value: string, sourceIndex: number, tileId: string, choiceSelection?: string, isLocked?: boolean} | null)[]
        = new Array(sourceTokens.length).fill(null);
  
      sourceTokens.forEach((token, index) => {
        if (lockPositions.includes(index)) {
          answerElements[index] = {
            value: token,
            sourceIndex: index,
            tileId: generateTileId(index, token),
            isLocked: true,
          };
        } else {
          rackElements.push(token);
        }
      });
  
      // ✅ ทำให้ rack มี 8 ช่องเสมอ
      while (rackElements.length < 8) rackElements.push(null);
      if (rackElements.length > 8) rackElements.length = 8;
  
      // ✅ sort เฉพาะตัวที่ไม่ null แล้วค่อย pad null กลับ
      const nonNull = rackElements.filter((t): t is string => t !== null);
      const sortedNonNull = sortTokenStringsByAmathOrder(nonNull);
      const paddedRack: (string | null)[] = [...sortedNonNull];
      while (paddedRack.length < 8) paddedRack.push(null);
  
      setRackTiles(paddedRack);
      setAnswerTiles(answerElements);
  
      // ✅ mark indices ที่ล็อกเป็น used
      setUsedTileIndices(new Set(lockPositions));
    } else {
      // Normal mode
      setRackTiles([...result.elements]);
      setAnswerTiles(new Array(result.elements.length).fill(null));
      setUsedTileIndices(new Set());
    }
  
    setSelectedTile(null);
    setAnswerFeedback(null);
  
    // Clean up drag states
    setTimeout(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setAnswerDraggedIndex(null);
      setAnswerDropTarget(null);
      setAnswerDragOverIndex(null);
      setIsInitializing(false);
    }, 200);
  }, [result]);

  // Add validation after each state change (but not during initialization)
  React.useEffect(() => {
    // Only validate if we have a result, states are properly initialized, and not initializing
    if (result && rackTiles.length > 0 && answerTiles.length > 0 && !isInitializing) {
      // Delay validation to ensure all states are updated
      const timeoutId = setTimeout(() => {
        validateTileIntegrity();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rackTiles, answerTiles, result, isInitializing, validateTileIntegrity]);

  // Clean up CSS variables when popup is closed
  React.useEffect(() => {
    if (!showChoicePopup) {
      document.documentElement.style.removeProperty('--focused-tile-x');
      document.documentElement.style.removeProperty('--focused-tile-y');
    }
  }, [showChoicePopup]);

  // ป้องกันการ scroll เมื่อ popup เปิด
  React.useEffect(() => {
    if (showChoicePopup) {
      // บันทึกตำแหน่ง scroll ปัจจุบัน
      const scrollY = window.scrollY;
      
      // ป้องกันการ scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // คืนค่าการ scroll เมื่อปิด popup
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [showChoicePopup]);

  // Handle tile click for reordering or placing in answer - only select actual tiles
  const handleTileClick = (clickedIndex: number) => {
    if (draggedIndex !== null) return;
  
    const clickedTile = rackTiles[clickedIndex];
    if (!clickedTile) return;
  
    // ถ้ายังไม่เลือกอะไร หรือเลือกจาก answer อยู่ -> เลือก rack ตัวนี้
    if (selectedTile === null || selectedTile.source !== 'rack') {
      setSelectedTile({ source: 'rack', index: clickedIndex });
      setAnswerFeedback(null);
      return;
    }
  
    // ตอนนี้ selectedTile เป็น rack แน่นอน
    const selectedIndex = selectedTile.index;
  
    if (selectedIndex === clickedIndex) {
      setSelectedTile(null);
      return;
    }
  
    // swap rack <-> rack
    const selectedValue = rackTiles[selectedIndex];
    if (!selectedValue) {
      setSelectedTile(null);
      return;
    }
  
    const newRack = [...rackTiles];
    newRack[selectedIndex] = clickedTile;
    newRack[clickedIndex] = selectedValue;
  
    setRackTiles(newRack);
    setSelectedTile(null);
    setAnswerFeedback(null);
  };
  

  // Handle answer box click when tile is selected
  const handleAnswerBoxClick = (answerIndex: number) => {
    if (!selectedTile || selectedTile.source !== 'rack') return;
  
    const rackIndex = selectedTile.index;
    const draggedElement = rackTiles[rackIndex];
    if (!draggedElement) return;
  
    const newAnswerTiles = [...answerTiles];
    const newRackTiles = [...rackTiles];
    const newUsedIndices = new Set(usedTileIndices);
  
    const existingTile = newAnswerTiles[answerIndex];
  
    // ห้ามทับ locked
    if (existingTile?.isLocked) return;
  
    if (existingTile) {
      // เอา existing กลับ rack ช่องว่าง
      const emptyRackIndex = newRackTiles.findIndex(t => t === null);
      if (emptyRackIndex !== -1) newRackTiles[emptyRackIndex] = existingTile.value;
  
      newUsedIndices.delete(existingTile.sourceIndex);
  
      // วางตัวใหม่ลง answer
      newAnswerTiles[answerIndex] = {
        value: draggedElement,
        sourceIndex: rackIndex,
        tileId: generateTileId(rackIndex, draggedElement),
      };
  
      newRackTiles[rackIndex] = null;
      newUsedIndices.add(rackIndex);
    } else {
      // ถ้าตัวเดียวกันอยู่ที่ช่องอื่นใน answer ให้ย้าย
      const currentIndex = newAnswerTiles.findIndex(
        (t) => !!t && !t.isLocked && t.sourceIndex === rackIndex
      );
      if (currentIndex !== -1) newAnswerTiles[currentIndex] = null;
      
  
      newAnswerTiles[answerIndex] = {
        value: draggedElement,
        sourceIndex: rackIndex,
        tileId: generateTileId(rackIndex, draggedElement),
      };
  
      newRackTiles[rackIndex] = null;
      newUsedIndices.add(rackIndex);
    }
  
    setRackTiles(newRackTiles);
    setAnswerTiles(newAnswerTiles);
    setUsedTileIndices(newUsedIndices);
    setSelectedTile(null);
    setAnswerFeedback(null);
  };
  

  // Handle answer tile click for selection
  const handleAnswerTileClick = (answerIndex: number) => {
    const tile = answerTiles[answerIndex];
    if (!tile) return;
    if (tile.isLocked) return;
  
    // ถ้ายังไม่เลือกอะไร หรือเลือกจาก rack -> เลือก answer ตัวนี้
    if (selectedTile === null || selectedTile.source !== 'answer') {
      setSelectedTile({ source: 'answer', index: answerIndex });
      setAnswerFeedback(null);
      return;
    }
  
    // ตอนนี้ selectedTile เป็น answer แน่นอน
    const selectedAnswerIndex = selectedTile.index;
  
    if (selectedAnswerIndex === answerIndex) {
      setSelectedTile(null);
      return;
    }
  
    // ✅ swap answer <-> answer (ง่ายและตรงที่สุด)
    const newAnswer = [...answerTiles];
    const temp = newAnswer[answerIndex];
    newAnswer[answerIndex] = newAnswer[selectedAnswerIndex];
    newAnswer[selectedAnswerIndex] = temp;
  
    setAnswerTiles(newAnswer);
    setSelectedTile(null);
    setAnswerFeedback(null);
  };
  

  // Handle rack slot click for placing tiles back
  const handleRackSlotClick = (rackIndex: number) => {
    if (!selectedTile) return;
    if (rackTiles[rackIndex]) return; // วางได้เฉพาะช่องว่าง
  
    const newRack = [...rackTiles];
    const newAnswer = [...answerTiles];
    const newUsed = new Set(usedTileIndices);
  
    if (selectedTile.source === 'answer') {
      const ansIndex = selectedTile.index;
      const moving = newAnswer[ansIndex];
      if (!moving || moving.isLocked) return;
  
      newAnswer[ansIndex] = null;
      newRack[rackIndex] = moving.value;
      newUsed.delete(moving.sourceIndex);
  
      setRackTiles(newRack);
      setAnswerTiles(newAnswer);
      setUsedTileIndices(newUsed);
      setSelectedTile(null);
      setAnswerFeedback(null);
      return;
    }
  
    // source === 'rack' -> move tile within rack into empty slot
    const from = selectedTile.index;
    const val = newRack[from];
    if (!val) return;
  
    newRack[from] = null;
    newRack[rackIndex] = val;
  
    setRackTiles(newRack);
    setSelectedTile(null);
    setAnswerFeedback(null);
  };
  

  // Handle drag drop to rack slots
  const handleRackSlotDrop = (e: React.DragEvent, rackIndex: number) => {
    e.preventDefault();
    
    if (rackTiles[rackIndex]) return; // Only allow dropping in empty slots
    
    const newRackTiles = [...rackTiles];
    const newAnswerTiles = [...answerTiles];
    const newUsedIndices = new Set(usedTileIndices);
    
    // Check if dragged from answer (answerDraggedIndex) or rack (draggedIndex)
    if (answerDraggedIndex !== null) {
      // Dragged from answer to rack
      const answerTile = answerTiles[answerDraggedIndex];
      if (answerTile) {
        newAnswerTiles[answerDraggedIndex] = null;
        newRackTiles[rackIndex] = answerTile.value;
        newUsedIndices.delete(answerTile.sourceIndex);
      }
    } else if (draggedIndex !== null) {
      // Dragged from rack to rack (rearrange)
      const draggedElement = rackTiles[draggedIndex];
      if (draggedElement) {
        newRackTiles[draggedIndex] = null;
        newRackTiles[rackIndex] = draggedElement;
      }
    }
    
    setRackTiles(newRackTiles);
    setAnswerTiles(newAnswerTiles);
    setUsedTileIndices(newUsedIndices);
    
    // Clean up drag states
    setTimeout(() => {
      setDraggedIndex(null);
      setAnswerDraggedIndex(null);
      setDragOverIndex(null);
    }, 0);
  };

  // All the remaining drag handlers and functions stay the same...
  // [The rest of the functions from the original DisplayBox remain unchanged]

  // Drag and Drop handlers with improved stability
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'tile', index }));
    
    // Set dragged index immediately for visual feedback
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    // Clean up all drag-related states
    cleanupDragStates();
  };

  const handleRackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null) return;

    // Get rack container and mouse position
    const rackContainer = e.currentTarget as HTMLElement;
    const rect = rackContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get all tile elements
    const tiles = rackContainer.querySelectorAll('[data-tile-index]');
    let closestIndex = 0;
    let minDistance = Infinity;
    
    tiles.forEach((tile, index) => {
      if (index === draggedIndex) return; // Skip the dragged tile
      
      const tileRect = tile.getBoundingClientRect();
      const tileCenterX = tileRect.left + tileRect.width / 2 - rect.left;
      const tileCenterY = tileRect.top + tileRect.height / 2 - rect.top;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - tileCenterX, 2) + Math.pow(mouseY - tileCenterY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    // Only update if different to prevent unnecessary re-renders
    if (closestIndex !== dragOverIndex) {
      setDragOverIndex(closestIndex);
    }
  };

  const handleRackDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the rack container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleRackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedIndex === null || dragOverIndex === null) {
      setTimeout(() => setDragOverIndex(null), 0);
      return;
    }

    // Prevent dropping on the same position
    if (draggedIndex === dragOverIndex) {
      setTimeout(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
      }, 0);
      return;
    }

    // Same logic as click - insert at new position
    const newElements = [...rackTiles];
    const draggedElement = newElements[draggedIndex];
    
    // Remove dragged element
    newElements.splice(draggedIndex, 1);
    
    // Adjust insert index if dragging from left to right
    const insertIndex = dragOverIndex;
    newElements.splice(insertIndex, 0, draggedElement);
    
    setRackTiles(newElements);
    
    // Clean up states
    setTimeout(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }, 0);
  };

  // Reset to original order and clear choices
  const resetOrder = () => {
    if (result) {
      setRackTiles([...result.elements]);
      setSelectedTile(null);
      setAnswerFeedback(null);
      // Clear all choice selections when resetting
      clearAllChoiceSelections();
      // Reset answer tiles and used indices
      setAnswerTiles(new Array(result.elements.length).fill(null));
      setUsedTileIndices(new Set());
      // Clean up all drag states
      cleanupDragStates();
    }
  };

  // Answer box handlers
  const handleAnswerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setAnswerDragOverIndex(index);
  };

  const handleAnswerDragLeave = () => {
    setAnswerDragOverIndex(null);
  };

  const handleAnswerDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) {
      setTimeout(() => setAnswerDragOverIndex(null), 0);
      return;
    }

    const draggedElement = rackTiles[draggedIndex];
    if (!draggedElement) return;
    const newAnswerTiles = [...answerTiles];
    const newUsedIndices = new Set(usedTileIndices);
    
    // Check if there's already a tile at the drop position
    const existingTile = newAnswerTiles[dropIndex];
    
    if (existingTile) {
      // Swap: move existing tile back to its original rack position and place new tile (same as click)
      const newRackTiles = [...rackTiles];
      newRackTiles[existingTile.sourceIndex] = existingTile.value;
      newUsedIndices.delete(existingTile.sourceIndex);
      newAnswerTiles[dropIndex] = { 
        value: draggedElement, 
        sourceIndex: draggedIndex,
        tileId: generateTileId(draggedIndex, draggedElement)
      };
      newRackTiles[draggedIndex] = null; // Create empty slot in rack
      newUsedIndices.add(draggedIndex);
      setRackTiles(newRackTiles);
    } else {
      // Empty slot - normal placement (same as click)
      const newRackTiles = [...rackTiles];
      // Check if this tile is already used elsewhere in answer
      const currentIndex = newAnswerTiles.findIndex(
        (tile) => !!tile && !tile.isLocked && tile.sourceIndex === draggedIndex
      );
      if (currentIndex !== -1) {
        newAnswerTiles[currentIndex] = null;
      }
      
      
      // Place dragged tile at new position
      newAnswerTiles[dropIndex] = { 
        value: draggedElement, 
        sourceIndex: draggedIndex,
        tileId: generateTileId(draggedIndex, draggedElement)
      };
      newRackTiles[draggedIndex] = null; // Create empty slot in rack
      newUsedIndices.add(draggedIndex);
      setRackTiles(newRackTiles);
    }
    
    setAnswerTiles(newAnswerTiles);
    setUsedTileIndices(newUsedIndices);
    
    // Clear feedback state
    setAnswerFeedback(null);
    
    // Clean up drag states
    setTimeout(() => {
      setAnswerDragOverIndex(null);
      setDraggedIndex(null);
    }, 0);
  };

  // Clear answer box and return tile to rack
  const clearAnswerBox = (index: number) => {
    const newAnswerTiles = [...answerTiles];
    const tileToRemove = newAnswerTiles[index];
    
    // Don't allow clearing locked tiles
    if (tileToRemove?.isLocked) return;
    
    newAnswerTiles[index] = null;
    
    if (tileToRemove) {
      const newRackTiles = [...rackTiles];
      // Find an empty slot in rack to return the tile
      const emptyRackIndex = newRackTiles.findIndex(t => t === null);
      if (emptyRackIndex !== -1) {
        newRackTiles[emptyRackIndex] = tileToRemove.value;
      }
      setRackTiles(newRackTiles);
      setUsedTileIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(tileToRemove.sourceIndex);
        return newSet;
      });
    }
    
    setAnswerTiles(newAnswerTiles);
    
    // Clear feedback when modifying answer
    setAnswerFeedback(null);
  };

  // Clear all answer boxes and restore rack to original state
  const clearAllAnswers = () => {
    if (result) {
      // Restore rack to original layout with all tiles
      setRackTiles([...result.elements]);
    }
    setAnswerTiles(new Array(rackTiles.length).fill(null));
    setAnswerFeedback(null);
    setUsedTileIndices(new Set());
    
    // Clean up any remaining drag states
    cleanupDragStates();
  };

  // Check if equation has choice tokens or blanks
  const hasChoiceTokens = (equation: string) => {
    return equation.includes('+/-') || equation.includes('×/÷') || equation.includes('?');
  };

  // Extract unique choice tokens from equation with their positions and tileIds
  const extractChoiceTokensWithPositions = () => {
    const tokens: {token: string, index: number, tileId: string}[] = [];
    
    answerTiles.forEach((tile, index) => {
      if (tile && !tile.isLocked && (tile.value === '+/-' || tile.value === '×/÷' || tile.value === '?')) {
        tokens.push({ 
          token: tile.value, 
          index,
          tileId: tile.tileId
        });
      }
    });
    
    return tokens;
  };

  // Move to next choice step
  const nextChoiceStep = () => {
    if (currentChoiceStep < choiceTokens.length - 1) {
      const nextStep = currentChoiceStep + 1;
      setCurrentChoiceStep(nextStep);
      
      // Update highlight to next choice token
      const nextTokenData = choiceTokens[nextStep];
      setCurrentHighlightIndex(nextTokenData.index);
      
      // Update focused tile position for popup repositioning
      setTimeout(() => updateFocusedTilePosition(nextTokenData.index), 50);
    } else {
      // All choices made, close popup
      setCurrentHighlightIndex(null);
      setShowChoicePopup(false);
    }
  };

  // Reset choice process (but keep selections)
  const resetChoiceProcess = () => {
    setShowChoicePopup(false);
    setCurrentChoiceStep(0);
    setChoiceTokens([]);
    setIsCheckingAnswer(false);
    setCurrentHighlightIndex(null);
  };

  // Clear all choice selections (for reset button or select operator button)
  const clearAllChoiceSelections = () => {
    setChoiceSelections({});
    resetChoiceProcess();
  };

  // Answer area internal drag handlers (for reordering within answer)
  const handleAnswerDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'answer-tile', index }));
    
    // Set dragged index with timeout for better state management
    setAnswerDraggedIndex(index);
  };

  const handleAnswerInternalDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (answerDraggedIndex !== null && answerDraggedIndex !== index) {
      setAnswerDropTarget(index);
    }
  };

  const handleAnswerInternalDragLeave = () => {
    // Don't clear drop target immediately to prevent flickering
    setTimeout(() => {
      setAnswerDropTarget(null);
    }, 50);
  };

  const handleAnswerInternalDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (answerDraggedIndex === null || answerDraggedIndex === dropIndex) {
      setTimeout(() => {
        setAnswerDraggedIndex(null);
        setAnswerDropTarget(null);
      }, 0);
      return;
    }

    const newAnswerTiles = [...answerTiles];
    const draggedTile = newAnswerTiles[answerDraggedIndex];
    const targetTile = newAnswerTiles[dropIndex];

    if (!draggedTile) {
      setTimeout(() => {
        setAnswerDraggedIndex(null);
        setAnswerDropTarget(null);
      }, 0);
      return;
    }
    
    if (targetTile) {
      // Swap tiles (both positions have tiles)
      newAnswerTiles[answerDraggedIndex] = targetTile;
      newAnswerTiles[dropIndex] = draggedTile;
    } else {
      // Move tile to empty slot (move operation)
      newAnswerTiles[answerDraggedIndex] = null; // Clear original position
      newAnswerTiles[dropIndex] = draggedTile;   // Place in new position
    }

    setAnswerTiles(newAnswerTiles);
    
    // Clean up states
    setTimeout(() => {
      setAnswerDraggedIndex(null);
      setAnswerDropTarget(null);
    }, 0);
  };

  const handleAnswerDragEnd = () => {
    setAnswerDraggedIndex(null);
    setAnswerDropTarget(null);
  };

  // Handle choice selection
  const handleChoiceSelection = (token: string, choice: string) => {
    // สร้าง key ที่ unique สำหรับแต่ละ tile ตาม tileId
    const currentTokenData = choiceTokens[currentChoiceStep];
    const uniqueKey = `${token}_${currentTokenData.tileId}`;
    
    setChoiceSelections(prev => ({
      ...prev,
      [uniqueKey]: choice
    }));
    
    // Update the specific tile with its choice
    setAnswerTiles(prev => prev.map(tile => 
      tile && tile.tileId === currentTokenData.tileId 
        ? { ...tile, choiceSelection: choice }
        : tile
    ));
    
    // Auto move to next step after selection
    nextChoiceStep();
  };

  // Finalize equation with user choices
  const finalizeEquation = () => {
    // Always use answerTiles length (which equals totalCount in lock mode)
    return answerTiles.map(tile => {
      if (!tile) return '';
      
      // If tile has a choice selection, use that value
      if (tile.choiceSelection) {
        return tile.choiceSelection;
      }
      
      // Otherwise use the original value
      return tile.value;
    }).join('');
  };

  // Check if we have enough choices to validate equation
  const hasAllChoicesSelected = () => {
    return answerTiles.every(tile => {
      if (!tile) return true; // Empty slots don't need choices
      
      // Locked tiles don't need choice selection
      if (tile.isLocked) return true;
      
      // If it's a choice token, it must have a choice selection
      if (tile.value === '+/-' || tile.value === '×/÷' || tile.value === '?') {
        return tile.choiceSelection !== undefined;
      }
      
      // Non-choice tokens are always considered "selected"
      return true;
    });
  };

  // Validate equation with all choices selected
  const validateEquationWithChoices = async () => {
    setIsCheckingAnswer(true);
    setAnswerFeedback(null);

    const finalEquation = finalizeEquation();
    
    try {
      const { isValidEquationByRules } = await import('@/app/lib/equationAnagramLogic');
      const isValid = isValidEquationByRules(finalEquation);
      
      if (isValid) {
        setAnswerFeedback({
          type: 'success',
          message: `Excellent! "${finalEquation}" is correct!`
        });
        
        // Call callback for assignment mode
        if (assignmentMode && onValidEquation) {
          onValidEquation(finalEquation);
        }
      } else {
        setAnswerFeedback({
          type: 'error',
          message: `Incorrect. "${finalEquation}" is not a valid equation.`
        });
      }
    } catch {
      setAnswerFeedback({
        type: 'error',
        message: 'Error checking equation. Please try again.'
      });
    }
    
    setIsCheckingAnswer(false);
  };

  // Submit answer for checking (Select Operator)
  const submitAnswer = async () => {
    setIsCheckingAnswer(true);
    setAnswerFeedback(null);

    // Clear previous choice selections when starting new selection
    clearAllChoiceSelections();

    // Check if all tiles are used - compare against original tile count
    const usedTiles = answerTiles.filter(tile => tile !== null);
    const originalTileCount = result?.elements.length || 0;
    
    if (usedTiles.length !== originalTileCount) {
      setAnswerFeedback({
        type: 'error',
        message: `Please use all ${originalTileCount} tiles. You have used ${usedTiles.length} tiles.`
      });
      setIsCheckingAnswer(false);
      return;
    }

    // Create equation string from answer first to check for choice tokens
    const equation = answerTiles.map(tile => tile?.value).join('');
    
    // Check if equation has choice tokens or blanks first (before strict tile validation)
    if (hasChoiceTokens(equation)) {
      const tokens = extractChoiceTokensWithPositions();
      setChoiceTokens(tokens);
      setCurrentChoiceStep(0);
      
      // Highlight first choice token
      if (tokens.length > 0) {
        setCurrentHighlightIndex(tokens[0].index);
        // Update focused tile position for popup positioning
        setTimeout(() => updateFocusedTilePosition(tokens[0].index), 50);
      }
      
      setShowChoicePopup(true);
      setIsCheckingAnswer(false);
      return;
    }

    // Only do strict tile validation if no choice tokens
    const sortedUsedValues = [...usedTiles].map(tile => tile.value).sort();
    const sortedOriginalValues = [...(result?.elements || [])].sort();
    
    const allTilesUsed = sortedUsedValues.length === sortedOriginalValues.length && 
      sortedUsedValues.every((value, index) => value === sortedOriginalValues[index]);

    if (!allTilesUsed) {
      setAnswerFeedback({
        type: 'error',
        message: 'You must use each tile exactly once.'
      });
      setIsCheckingAnswer(false);
      return;
    }
    
    // No choices needed, validate directly
    try {
      const { isValidEquationByRules } = await import('@/app/lib/equationAnagramLogic');
      const isValid = isValidEquationByRules(equation);
      
      if (isValid) {
        setAnswerFeedback({
          type: 'success',
          message: `Correct! "${equation}" is a valid equation.`
        });
        
        // Call callback for assignment mode
        if (assignmentMode && onValidEquation) {
          onValidEquation(equation);
        }
      } else {
        setAnswerFeedback({
          type: 'error',
          message: `Incorrect. "${equation}" is not a valid equation.`
        });
      }
    } catch {
      setAnswerFeedback({
        type: 'error',
        message: 'Error checking equation. Please try again.'
      });
    }

    setIsCheckingAnswer(false);
  };

  const displayElements = result ? rackTiles : [];

  // Save problem set as image
  const saveProblemImage = async () => {
    if (!problemSetRef.current || !result) return;

    try {
      // Create a clean container from scratch
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0px';
      tempContainer.style.background = '#dcfce7'; // light green background like in image
      tempContainer.style.padding = '16px';
      tempContainer.style.borderRadius = '8px';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempContainer.style.width = 'auto';
      tempContainer.style.minWidth = '800px';
      
             // Create title section
       const titleSection = document.createElement('div');
       titleSection.style.marginBottom = '16px';
       titleSection.style.display = 'flex';
       titleSection.style.alignItems = 'center';
       titleSection.style.justifyContent = 'space-between';
       
       const title = document.createElement('h3');
       title.style.fontSize = '24px';
       title.style.fontWeight = 'bold';
       title.style.color = '#166534';
       title.style.margin = '0';
       title.style.borderBottom = '2px solid #166534';
       title.style.paddingBottom = '8px';
       title.textContent = 'DASC Bingo Problem';
       
       const tileCountBox = document.createElement('div');
      //  tileCountBox.style.backgroundColor = '#fef3c7';
        tileCountBox.style.color = '#166534';
        tileCountBox.style.borderRadius = '16px';
        tileCountBox.style.fontSize = '14px';
        tileCountBox.style.fontWeight = '500';
        tileCountBox.style.display = 'flex';
        tileCountBox.style.alignItems = 'center';
        tileCountBox.style.justifyContent = 'center';
        tileCountBox.style.minWidth = '80px';
        tileCountBox.style.height = '32px'; // ✅ เพิ่มความสูงให้กล่อง
        tileCountBox.style.boxSizing = 'border-box'; // ✅ ป้องกัน padding overflow
        tileCountBox.textContent = `${result.elements.length} tiles`;
        
        titleSection.appendChild(title);
        titleSection.appendChild(tileCountBox);
      
        // Create tiles container
        const tilesContainer = document.createElement('div');
        tilesContainer.style.display = 'flex';
        tilesContainer.style.gap = '8px';
        tilesContainer.style.justifyContent = 'center';
        tilesContainer.style.alignItems = 'center';
        tilesContainer.style.padding = '12px';
        tilesContainer.style.background = '#fef3c7'; // amber background
        tilesContainer.style.borderRadius = '8px';
        tilesContainer.style.border = '2px solid #f59e0b';
      
             // Create tiles based on elements
       result.elements.forEach((element) => {
         const tile = document.createElement('div');
         tile.style.width = '80px';
         tile.style.height = '80px';
         tile.style.display = 'flex';
         tile.style.flexDirection = 'column';
         tile.style.alignItems = 'center';
         tile.style.justifyContent = 'center';
         tile.style.borderRadius = '12px';
         tile.style.border = '3px solid';
         tile.style.position = 'relative';
         
         // Determine tile color based on element type
         const isNumber = !isNaN(Number(element)) || element === '0';
         const isOperator = ['+', '-', '×', '÷', '+/-', '×/÷'].includes(element);
         const isEquals = element === '=';
         const isBlank = element === '?';
         
         if (isNumber) {
           tile.style.backgroundColor = '#bbf7d0'; // green-200
           tile.style.borderColor = '#16a34a'; // green-600
           tile.style.color = '#166534'; // green-800
         } else if (isOperator || isEquals || isBlank) {
           tile.style.backgroundColor = '#fde68a'; // yellow-200
           tile.style.borderColor = '#d97706'; // yellow-600
           tile.style.color = '#92400e'; // yellow-800
         }
         
         // Add main element (centered)
          const mainText = document.createElement('div');
          mainText.textContent = element;
          mainText.style.position = 'absolute';
          mainText.style.top = '-10px';
          mainText.style.left = '0';
          mainText.style.width = '100%';
          mainText.style.height = '100%';
          mainText.style.display = 'flex';
          mainText.style.alignItems = 'center';
          mainText.style.justifyContent = 'center';

          mainText.style.fontSize = '26px';
          mainText.style.fontWeight = '500';
          mainText.style.textAlign = 'center';
          tile.appendChild(mainText);
          
         // Get point value from AMATH_TOKENS
         const getPointValue = (token: string): number => {
           const tokenInfo = {
             '0': 1, '1': 1, '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 2, '8': 2, '9': 2,
             '10': 3, '11': 4, '12': 3, '13': 6, '14': 4, '15': 4, '16': 4, '17': 6, '18': 4, '19': 7, '20': 5,
             '+': 2, '-': 2, '×': 2, '÷': 2, '+/-': 1, '×/÷': 1, '=': 1, '?': 0
           };
           return tokenInfo[token as keyof typeof tokenInfo] || 0;
         };
         
         const pointValue = getPointValue(element);
         
         // Add point value in bottom right
         const pointNumber = document.createElement('div');
         pointNumber.textContent = pointValue.toString();
         pointNumber.style.position = 'absolute';
         pointNumber.style.bottom = '6px';
         pointNumber.style.right = '6px';
         pointNumber.style.fontSize = '14px';
         pointNumber.style.fontWeight = '500';
         pointNumber.style.opacity = '0.8';
         tile.appendChild(pointNumber);
         
         tilesContainer.appendChild(tile);
       });
      
      // Assemble the image content
      tempContainer.appendChild(titleSection);
      tempContainer.appendChild(tilesContainer);
      
      document.body.appendChild(tempContainer);
      
      // Generate image with better quality
      const canvas = await html2canvas(tempContainer, {
        useCORS: true,
        allowTaint: true
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `dasc-bingo-problem-${currentIndex + 1}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error saving image:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Render content (used in both normal and fullscreen modes)
  const renderContent = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[var(--brand-dark)]">
            <Target className="inline mr-2" size={24} />
            🎯 DASC Bingo Problem
          </h2>
          {result && (
            <div className="text-sm text-[var(--brand-dark)] bg-[var(--brand-accent-light)] px-3 py-1 rounded-full font-medium border border-[var(--brand-secondary)]">
              🎲 {result.elements.length} tiles
            </div>
          )}
        </div>
      </div>

      <div className="min-h-32">
        {result ? (
          <div className="space-y-6">
            {/* Tile Rack Section */}
            <div ref={problemSetRef}>
              <TileRack
                displayElements={displayElements}
                selectedTile={selectedTile}
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                usedTileIndices={usedTileIndices}
                choiceSelections={choiceSelections}
                showChoicePopup={showChoicePopup}
                onTileClick={handleTileClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onRackSlotClick={handleRackSlotClick}
                onRackDragOver={handleRackDragOver}
                onRackDragLeave={handleRackDragLeave}
                onRackDrop={handleRackDrop}
                onRackSlotDrop={handleRackSlotDrop}
                setDragOverIndex={setDragOverIndex}
              />
            </div>

            {/* Navigation Controls */}
            <NavigationControls
              currentIndex={currentIndex}
              total={total}
              showChoicePopup={showChoicePopup}
              setCurrentIndex={setCurrentIndex}
            />

            {/* Answer Area */}
            <AnswerArea
              answerTiles={answerTiles}
              selectedTile={selectedTile}
              answerDragOverIndex={answerDragOverIndex}
              answerDropTarget={answerDropTarget}
              answerDraggedIndex={answerDraggedIndex}
              currentHighlightIndex={currentHighlightIndex}
              choiceSelections={choiceSelections}
              isCheckingAnswer={isCheckingAnswer}
              showChoicePopup={showChoicePopup}
              hasAllChoicesSelected={hasAllChoicesSelected}
              onAnswerTileClick={handleAnswerTileClick}
              onAnswerBoxClick={handleAnswerBoxClick}
              onClearAnswerBox={clearAnswerBox}
              onSubmitAnswer={submitAnswer}
              onValidateEquationWithChoices={validateEquationWithChoices}
              onResetOrder={resetOrder}
              onClearAllAnswers={clearAllAnswers}
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onSaveProblemImage={saveProblemImage}
              onAnswerDragStart={handleAnswerDragStart}
              onAnswerInternalDragOver={handleAnswerInternalDragOver}
              onAnswerInternalDragLeave={handleAnswerInternalDragLeave}
              onAnswerInternalDrop={handleAnswerInternalDrop}
              onAnswerDragOver={handleAnswerDragOver}
              onAnswerDragLeave={handleAnswerDragLeave}
              onAnswerDrop={handleAnswerDrop}
              onAnswerDragEnd={handleAnswerDragEnd}
              setAnswerDropTarget={setAnswerDropTarget}
              rackTilesCount={rackTiles.filter(tile => tile !== null).length}
              totalTilesCount={result?.elements.length || 0}
              lockMode={!!result?.lockPositions && result.lockPositions.length > 0}
              scrollOffset={0}
              onScrollOffsetChange={() => {}}
              maxAnswerLength={MAX_ANSWER_LENGTH}
              lockPositions={result?.lockPositions || []}
            />

            {/* Answer Feedback */}
            <AnswerFeedback
              answerFeedback={answerFeedback}
              assignmentMode={assignmentMode}
              onSubmitAnswer={onSubmitAnswer}
              isSubmittingAnswer={isSubmittingAnswer}
              activeAssignment={activeAssignment}
              finalizeEquation={finalizeEquation}
              answerTiles={answerTiles}
              onValidEquation={onValidEquation}
              setAnswerFeedback={setAnswerFeedback}
              setIsSubmittingAnswer={setIsSubmittingAnswer}
            />

            {/* Choice Selection Popup */}
            <ChoiceSelectionPopup
              isVisible={showChoicePopup}
              choiceTokens={choiceTokens.map(t => t.token)}
              currentChoiceStep={currentChoiceStep}
              onChoiceSelection={handleChoiceSelection}
              onReset={resetChoiceProcess}
            />

            {/* Generate Button */}
            <GenerateButton
              onGenerate={onGenerate}
              isGenerating={isGenerating}
              showChoicePopup={showChoicePopup}
            />

            {/* Example Solution */}
            <ExampleSolution
              result={result}
              showChoicePopup={showChoicePopup}
            />

            {/* Problem Statistics */}
            <ProblemStats
              result={result}
              showChoicePopup={showChoicePopup}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );

  return (
    <div ref={displayBoxRef} className={`bg-white rounded-lg shadow-xl border-2 border-[var(--brand-secondary)] relative transition-all ${isFullscreen ? 'z-[1000] fixed inset-0 !rounded-none !shadow-none bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto' : 'p-6'}`}>
      {/* FULLSCREEN MODE */}
      {isFullscreen ? (
        <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-7xl">
            {/* Exit Full Screen Button (fixed top right) */}
            <button onClick={exitFullscreen} title="ออกจากโหมดเต็มจอ"
              className="fixed right-4 top-4 z-[1020] px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow-2xl hover:bg-red-700 transition-all hover:scale-105 flex items-center gap-2 border-2 border-white/20">
              <span className="text-lg">✕</span> <span className="hidden sm:inline">ปิดเต็มจอ</span>
            </button>
            
            {/* Content wrapper with nice spacing and borders */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border-4 border-[var(--brand-secondary)] mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL MODE */
        <>
          {/* Full Screen Button (absolute top right) */}
          <button onClick={enterFullscreen} title="ขยายเต็มจอ"
            className="absolute right-4 top-4 z-[1010] px-3 py-2 rounded-lg bg-[var(--brand-secondary)] text-white text-sm font-semibold shadow hover:bg-[var(--brand-dark)] transition-all hover:scale-105 flex items-center gap-1.5">
            <span className="text-base">⛶</span> <span className="hidden sm:inline">Full screen</span>
          </button>
          {renderContent()}
        </>
      )}
    </div>
  );
}
