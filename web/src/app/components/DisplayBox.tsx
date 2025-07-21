// src/components/DisplayBox.tsx
import type { EquationAnagramResult } from "@/app/types/EquationAnagram";
import { useState } from "react";
import Button from "../ui/Button";
import ChildButton from "../ui/ChildButton";
import ChoiceSelectionPopup from "./ChoiceSelectionPopup";
import Tile from "./Tile";
import EmptySlot from "./EmptySlot";
import React from "react"; // Added missing import

interface DisplayBoxProps {
  result: EquationAnagramResult | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
  currentIndex?: number;
  total?: number;
  setCurrentIndex?: (idx: number) => void;
}



export default function DisplayBox({
  result,
  onGenerate,
  isGenerating,
  currentIndex = 0,
  total = 1,
  setCurrentIndex,
}: DisplayBoxProps) {
  const [showMoreEquations, setShowMoreEquations] = useState(false);
  // Local state for Example Solution toggle
  const [showExampleSolution, setShowExampleSolution] = useState(false);
  
  // Tile reordering state - now with empty slots
  const [rackTiles, setRackTiles] = useState<(string | null)[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Answer state - track individual tile pieces with unique IDs and their choices
  const [answerTiles, setAnswerTiles] = useState<({value: string, sourceIndex: number, tileId: string, choiceSelection?: string} | null)[]>([]);
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

  // Helper function to clean up all drag states
  const cleanupDragStates = () => {
    setTimeout(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setAnswerDraggedIndex(null);
      setAnswerDropTarget(null);
      setAnswerDragOverIndex(null);
    }, 0);
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
  const validateTileIntegrity = () => {
    if (!result) return;
    
    // Count tiles in rack (non-null values)
    const rackCount = rackTiles.filter(tile => tile !== null).length;
    
    // Count tiles in answer 
    const answerCount = answerTiles.filter(tile => tile !== null).length;
    
    // Total should equal original count
    const originalCount = result.elements.length;
    const currentTotal = rackCount + answerCount;
    
    if (currentTotal !== originalCount) {
      
      // Auto-fix by resetting
      setRackTiles([...result.elements]);
      setAnswerTiles(new Array(result.elements.length).fill(null));
      setUsedTileIndices(new Set());
      setAnswerFeedback({ type: 'error', message: '🔧 Tiles were automatically reset due to counting error.' });
    }
  };

  // Initialize rack tiles when result changes
  React.useEffect(() => {
    if (result) {
      setRackTiles([...result.elements]);
      setSelectedTileIndex(null);
      // Initialize answer boxes with same length as tiles
      setAnswerTiles(new Array(result.elements.length).fill(null));
      setAnswerFeedback(null);
      setUsedTileIndices(new Set());
      // Clean up all drag states manually
      setTimeout(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setAnswerDraggedIndex(null);
        setAnswerDropTarget(null);
        setAnswerDragOverIndex(null);
      }, 0);
    }
  }, [result]);

  // Add validation after each state change
  React.useEffect(() => {
    validateTileIntegrity();
  }, [rackTiles, answerTiles, result]);

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
    // Prevent clicking while dragging
    if (draggedIndex !== null) return;
    
    const clickedTile = rackTiles[clickedIndex];
    if (!clickedTile) return; // Can't select empty slots - this is the key fix
    
    if (selectedTileIndex === null) {
      // First click - select tile
      setSelectedTileIndex(clickedIndex);
      // Clear any feedback messages
      setAnswerFeedback(null);
    } else if (selectedTileIndex === clickedIndex) {
      // Click same tile - deselect
      setSelectedTileIndex(null);
    } else {
      // Second click - swap positions if clicking another tile with content
      const selectedTile = rackTiles[selectedTileIndex];
      if (selectedTile) {
        const newRackTiles = [...rackTiles];
        
        // Swap tiles
        newRackTiles[selectedTileIndex] = clickedTile;
        newRackTiles[clickedIndex] = selectedTile;
        
        setRackTiles(newRackTiles);
      }
      setSelectedTileIndex(null);
      
      // Clear any feedback messages
      setAnswerFeedback(null);
    }
  };

  // Handle answer box click when tile is selected
  const handleAnswerBoxClick = (answerIndex: number) => {
    if (selectedTileIndex === null) return;
    
    const draggedElement = rackTiles[selectedTileIndex];
    if (!draggedElement) return; // Skip if no element at this index
    
    const newAnswerTiles = [...answerTiles];
    const newRackTiles = [...rackTiles];
    const newUsedIndices = new Set(usedTileIndices);
    
    // Check if there's already a tile at the target position
    const existingTile = newAnswerTiles[answerIndex];
    
    if (existingTile) {
      // Swap: move existing tile back to its original rack position and place new tile
      newRackTiles[existingTile.sourceIndex] = existingTile.value;
      newUsedIndices.delete(existingTile.sourceIndex);
      newAnswerTiles[answerIndex] = { 
        value: draggedElement, 
        sourceIndex: selectedTileIndex,
        tileId: generateTileId(selectedTileIndex, draggedElement)
      };
      newRackTiles[selectedTileIndex] = null; // Create empty slot in rack
      newUsedIndices.add(selectedTileIndex);
    } else {
      // Empty slot - normal placement
      // Check if this tile is already used elsewhere in answer
      const currentIndex = newAnswerTiles.findIndex(tile => tile?.sourceIndex === selectedTileIndex);
      if (currentIndex !== -1) {
        // Remove from current position
        newAnswerTiles[currentIndex] = null;
      }
      
      // Place selected tile at new position
      newAnswerTiles[answerIndex] = { 
        value: draggedElement, 
        sourceIndex: selectedTileIndex,
        tileId: generateTileId(selectedTileIndex, draggedElement)
      };
      newRackTiles[selectedTileIndex] = null; // Remove from rack
      newUsedIndices.add(selectedTileIndex);
    }
    
    setRackTiles(newRackTiles);
    
    setAnswerTiles(newAnswerTiles);
    setUsedTileIndices(newUsedIndices);
    setSelectedTileIndex(null);
    
    // Clear feedback state
    setAnswerFeedback(null);
  };

    // Handle answer tile click for selection
  const handleAnswerTileClick = (answerIndex: number) => {
    const tile = answerTiles[answerIndex];
    if (!tile) return;
    
    if (selectedTileIndex === null) {
      // Select this answer tile (mark it as selected using its source index)
      setSelectedTileIndex(tile.sourceIndex);
      setAnswerFeedback(null);
    } else if (selectedTileIndex === tile.sourceIndex) {
      // Deselect if clicking the same tile
      setSelectedTileIndex(null);
    } else {
      // Different tile selected - handle movement/swap
      const selectedElement = rackTiles[selectedTileIndex];
      if (!selectedElement) return; // Skip if no element at this index
      
      const newAnswerTiles = [...answerTiles];
      const newUsedIndices = new Set(usedTileIndices);
      
      // Check if selected tile is from rack or answer
      const selectedTileCurrentAnswerIndex = newAnswerTiles.findIndex(t => t?.sourceIndex === selectedTileIndex);
      
      if (selectedTileCurrentAnswerIndex !== -1) {
        // Selected tile is from answer - swap positions (no rack changes needed)
        const tempTile = newAnswerTiles[answerIndex];
        newAnswerTiles[answerIndex] = newAnswerTiles[selectedTileCurrentAnswerIndex];
        newAnswerTiles[selectedTileCurrentAnswerIndex] = tempTile;
        // No rack tiles or usedTileIndices changes needed for answer-to-answer swap
      } else {
        // Selected tile is from rack - place it here and move existing tile back to rack (sync with drag & drop)
        const newRackTiles = [...rackTiles];
        newRackTiles[tile.sourceIndex] = tile.value;
        newUsedIndices.delete(tile.sourceIndex);
        newAnswerTiles[answerIndex] = { 
          value: selectedElement, 
          sourceIndex: selectedTileIndex,
          tileId: generateTileId(selectedTileIndex, selectedElement)
        };
        newRackTiles[selectedTileIndex] = null; // Create empty slot in rack
        newUsedIndices.add(selectedTileIndex);
        setRackTiles(newRackTiles);
      }
      
      setAnswerTiles(newAnswerTiles);
      setUsedTileIndices(newUsedIndices);
      setSelectedTileIndex(null);
      setAnswerFeedback(null);
    }
  };

  // Handle rack slot click for placing tiles back
  const handleRackSlotClick = (rackIndex: number) => {
    if (selectedTileIndex === null || rackTiles[rackIndex]) return; // Only allow placing in empty slots
    
    const newRackTiles = [...rackTiles];
    const newAnswerTiles = [...answerTiles];
    const newUsedIndices = new Set(usedTileIndices);
    
    // Check if selected tile is from answer
    const selectedTileInAnswer = newAnswerTiles.find(tile => tile?.sourceIndex === selectedTileIndex);
    
    if (selectedTileInAnswer) {
      // Move tile from answer back to rack
      const answerIndex = newAnswerTiles.findIndex(tile => tile?.sourceIndex === selectedTileIndex);
      if (answerIndex !== -1) {
        newAnswerTiles[answerIndex] = null;
        newRackTiles[rackIndex] = selectedTileInAnswer.value;
        newUsedIndices.delete(selectedTileIndex);
      }
    } else if (rackTiles[selectedTileIndex]) {
      // Move tile within rack
      const selectedElement = rackTiles[selectedTileIndex];
      newRackTiles[selectedTileIndex] = null;
      newRackTiles[rackIndex] = selectedElement;
    }
    
    setRackTiles(newRackTiles);
    setAnswerTiles(newAnswerTiles);
    setUsedTileIndices(newUsedIndices);
    setSelectedTileIndex(null);
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

  // Drag and Drop handlers with improved stability
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'tile', index }));
    
    // Set dragged index immediately for visual feedback
    setTimeout(() => setDraggedIndex(index), 0);
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
      setSelectedTileIndex(null);
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
      const currentIndex = newAnswerTiles.findIndex(tile => tile?.sourceIndex === draggedIndex);
      if (currentIndex !== -1) {
        // Remove from current position
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
    const newRackTiles = [...rackTiles];
    const tileToRemove = newAnswerTiles[index];
    newAnswerTiles[index] = null;
    
    if (tileToRemove) {
      // Return tile to its original rack position, creating visible empty slot effect
      newRackTiles[tileToRemove.sourceIndex] = tileToRemove.value;
      setUsedTileIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(tileToRemove.sourceIndex);
        return newSet;
      });
    }
    
    setAnswerTiles(newAnswerTiles);
    setRackTiles(newRackTiles);
    
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
      if (tile && (tile.value === '+/-' || tile.value === '×/÷' || tile.value === '?')) {
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
    setTimeout(() => setAnswerDraggedIndex(index), 0);
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
    setTimeout(() => {
      nextChoiceStep();
    }, 300);
  };

  // Finalize equation with user choices
  const finalizeEquation = () => {
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
          message: `🎉 Excellent! "${finalEquation}" is correct!`
        });
      } else {
        setAnswerFeedback({
          type: 'error',
          message: `❌ Incorrect. "${finalEquation}" is not a valid equation.`
        });
      }
    } catch {
      setAnswerFeedback({
        type: 'error',
        message: '⚠️ Error checking equation. Please try again.'
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

  return (
    <div className="bg-green-100 rounded-lg shadow-lg p-6 border border-green-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-green-900">
            🎯 DASC Bingo Problem
          </h2>
          {result && (
            <div className="text-sm text-green-800 bg-yellow-100 px-3 py-1 rounded-full">
              {result.elements.length} tiles
            </div>
          )}
        </div>
      </div>

      <div className="min-h-32">
        {result ? (
          <div className="space-y-6">
            {/* แสดงชุดตัวเลขและเครื่องหมาย */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-900 border-b pb-2">
                  Problem Set
                </h3>
              </div>
              
              {/* Tile rack: single row responsive layout with visible empty slots */}
              <div
                className={`flex gap-1 sm:gap-2 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative overflow-x-auto ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}
                onDragOver={handleRackDragOver}
                onDragLeave={handleRackDragLeave}
                onDrop={handleRackDrop}
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
                          onClick={() => handleTileClick(index)}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          draggable={true}
                        />
                      ) : (
                        <EmptySlot
                          key={`rack-empty-${index}`}
                          index={index}
                          slotType="rack"
                          isDragOver={isDragOver}
                          onClick={() => {
                            if (selectedTileIndex !== null && rackTiles[selectedTileIndex]) {
                              handleRackSlotClick(index);
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
                            handleRackSlotDrop(e, index);
                          }}
                        />
                      );
                })}
              </div>
            </div>

            {/* Navigation for multiple problems - always show */}
            <div className={`flex justify-center items-center mb-4 relative ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
              <div className="flex items-center gap-4">
                <ChildButton
                  onClick={() => setCurrentIndex?.(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  ← Prev
                </ChildButton>
                <span className="text-green-900 font-medium bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                  {currentIndex + 1} / {total}
                </span>
                <ChildButton
                  onClick={() => setCurrentIndex?.(Math.min(total - 1, currentIndex + 1))}
                  disabled={currentIndex === total - 1}
                >
                  Next →
                </ChildButton>
              </div>
              
              {/* Reset button */}
              <ChildButton
                onClick={resetOrder}
                className="absolute right-0"
              >
                Reset
              </ChildButton>
            </div>

            {/* Answer Row */}
            <div className="space-y-4" id="answer-section">
              <div className={`flex items-center justify-between ${showChoicePopup ? '' : ''}`}>
                <h3 className="text-lg font-semibold text-purple-900 border-b pb-2">
                  Your Answer
                </h3>
                <div className="flex items-center gap-2">
                  <ChildButton
                    onClick={clearAllAnswers}
                    className="text-xs px-3 py-1"
                  >
                    Clear All
                  </ChildButton>
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
                        handleAnswerDragStart(e, index);
                      } : undefined}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if this is internal drag (from answer to answer)
                        if (answerDraggedIndex !== null) {
                          // Internal drag (within answer area)
                          handleAnswerInternalDragOver(e, index);
                        } else {
                          // External drag (from rack to answer)
                          if (tile) {
                            handleAnswerInternalDragOver(e, index);
                          } else {
                            handleAnswerDragOver(e, index);
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if this is internal drag
                        if (answerDraggedIndex !== null) {
                          handleAnswerInternalDragLeave();
                        } else {
                          if (tile) {
                            handleAnswerInternalDragLeave();
                          } else {
                            handleAnswerDragLeave();
                          }
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if this is internal drag
                        if (answerDraggedIndex !== null) {
                          // Internal drop (within answer area)
                          handleAnswerInternalDrop(e, index);
                        } else {
                          // External drop (from rack to answer)
                          if (tile) {
                            handleAnswerInternalDrop(e, index);
                          } else {
                            handleAnswerDrop(e, index);
                          }
                        }
                      }}
                      onDragEnd={() => {
                        handleAnswerDragEnd();
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
                          onClick={() => handleAnswerTileClick(index)}
                          onClear={() => clearAnswerBox(index)}
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
                              handleAnswerBoxClick(index);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Check if this is internal drag (from answer to answer)
                            if (answerDraggedIndex !== null) {
                              handleAnswerInternalDragOver(e, index);
                            } else {
                              handleAnswerDragOver(e, index);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Check if this is internal drag
                            if (answerDraggedIndex !== null) {
                              handleAnswerInternalDragLeave();
                            } else {
                              handleAnswerDragLeave();
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Check if this is internal drag
                            if (answerDraggedIndex !== null) {
                              handleAnswerInternalDrop(e, index);
                            } else {
                              handleAnswerDrop(e, index);
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
                    onClick={submitAnswer}
                    disabled={isCheckingAnswer || answerTiles.every(tile => tile === null)}
                    className={`px-6 py-3 text-lg font-bold border-2 transition-all duration-200 ${
                      isCheckingAnswer || answerTiles.every(tile => tile === null)
                    }`}
                  >
                    {isCheckingAnswer ? 'Selecting...' : 'Select Operator'}
                  </ChildButton>
                  
                  {/* Show Check Equation button - always visible but disabled when not ready */}
                  <ChildButton
                    onClick={validateEquationWithChoices}
                    disabled={isCheckingAnswer || !hasAllChoicesSelected()}
                    className={`px-6 py-3 text-lg font-bold border-2 transition-all duration-200 ${
                      isCheckingAnswer || !hasAllChoicesSelected()
                    }`}
                  >
                    {isCheckingAnswer ? 'Checking...' : 'Check Equation'}
                  </ChildButton>
                  
                  <div className="text-sm text-gray-600">
                    Answer: {answerTiles.filter(tile => tile !== null).length} | 
                    Rack: {rackTiles.filter(tile => tile !== null).length} | 
                    Total: {answerTiles.filter(tile => tile !== null).length + rackTiles.filter(tile => tile !== null).length} / {result?.elements.length || 0}
                  </div>
                </div>
                
                {/* Feedback */}
                {answerFeedback && (
                  <div className={`
                    p-4 rounded-lg border-2 text-center font-medium
                    ${answerFeedback.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                    }
                  `}>
                    {answerFeedback.message}
                  </div>
                )}
              </div>
            </div>

            {/* Choice Selection Popup */}
            <ChoiceSelectionPopup
              isVisible={showChoicePopup}
              choiceTokens={choiceTokens.map(t => t.token)}
              currentChoiceStep={currentChoiceStep}
              onChoiceSelection={handleChoiceSelection}
              onReset={resetChoiceProcess}
            />



            {/* ปุ่มสร้างโจทย์ตรงกลางใต้ tile rack */}
            {onGenerate && (
              <div className={`flex justify-center mt-2 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
                <Button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    color="green"
                    loading={isGenerating}
                    loadingText="Generating problem..."
                    icon={
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    }
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Problem</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Example Solution Section - only show when result exists */}
            {result.sampleEquation && (
              <div className={`space-y-3 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Example Solution
                    </h3>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Primary
                    </div>
                  </div>
                  {/* Toggle for Example Solution */}
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-900 text-sm">
                      Show solutions
                    </span>
                    <label className="flex items-center cursor-pointer select-none group ml-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showExampleSolution}
                          onChange={(e) =>
                            setShowExampleSolution(e.target.checked)
                          }
                          className="sr-only"
                          aria-label="Toggle solution visibility"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors duration-200 border-2 ${
                            showExampleSolution
                              ? "bg-yellow-400 border-yellow-500"
                              : "bg-gray-300 border-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                            showExampleSolution ? "translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-semibold text-yellow-900 whitespace-nowrap">
                        {showExampleSolution ? "ON" : "OFF"}
                      </span>
                    </label>
                  </div>
                </div>
                {showExampleSolution && (
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-6 rounded-xl border-2 border-green-200 shadow-sm transition-all duration-300">
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                        {result.sampleEquation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* แสดงสถิติ */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
              {/* จำนวนสมการที่พอ */}
              {result.possibleEquations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center hover:bg-green-100 transition-colors duration-200">
                  <div className="text-2xl font-bold text-green-900">
                    {result.possibleEquations.length}
                  </div>
                  <div className="text-sm text-green-800">
                    Possible equations
                  </div>
                </div>
              )}

              {/* จำนวน tokens */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center hover:bg-yellow-100 transition-colors duration-200">
                <div className="text-2xl font-bold text-yellow-900">
                  {result.elements.length}
                </div>
                <div className="text-sm text-yellow-800">
                  Numbers and operators
                </div>
              </div>

              {/* ระดับความยาก */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center hover:bg-green-100 transition-colors duration-200">
                <div className="text-2xl font-bold text-green-900">
                  {result.elements.length <= 8
                    ? "Easy"
                    : result.elements.length <= 12
                    ? "Medium"
                    : "Hard"}
                </div>
                <div className="text-sm text-green-800">Difficulty</div>
              </div>
            </div>

            {/* Other Solutions Section */}
            {showExampleSolution &&
              result.possibleEquations &&
              result.possibleEquations.length > 1 && (
                <div className={`space-y-4 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Other Solutions
                      </h3>
                      <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                        {result.possibleEquations.length - 1} equations
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMoreEquations(!showMoreEquations)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300 flex items-center gap-2 ${
                        showMoreEquations
                          ? "bg-amber-200 text-amber-900 hover:bg-amber-300"
                          : "bg-white text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      <span>{showMoreEquations ? "Hide" : "Show"}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showMoreEquations ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Show additional equations with smooth transition */}
                  <div
                    className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${
                    showMoreEquations
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }
                `}
                  >
                    <div className="grid gap-3 pt-2">
                      {result.possibleEquations
                        .slice(1, 6)
                        .map((equation, index) => (
                          <div
                            key={index}
                            className="bg-amber-50 p-4 rounded-lg border border-amber-200 font-mono text-center text-gray-900 shadow-sm hover:bg-amber-100 transition-all duration-200 hover:shadow-md"
                          >
                            <span className="text-lg font-semibold">
                              {equation}
                            </span>
                          </div>
                        ))}
                      {result.possibleEquations.length > 6 && (
                        <div className="text-center text-amber-700 text-sm py-3 bg-amber-50 rounded-lg border border-amber-200">
                          and {result.possibleEquations.length - 6} more
                          equations...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-green-500 text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Start generating DS Bingo problems
            </h3>
            <p className="mb-4 text-gray-700">
              Press &quot;Generate Problem&quot; to begin
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
              <p className="text-sm text-green-800 font-medium">DS Bingo</p>
              <p className="text-xs text-green-600 mt-1">
                Is a set of numbers and operators that can be arranged into at
                least one valid equation according to mathematical rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}