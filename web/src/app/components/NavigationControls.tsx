import React from 'react';
import ChildButton from '../ui/ChildButton';

interface NavigationControlsProps {
  currentIndex: number;
  total: number;
  showChoicePopup: boolean;
  setCurrentIndex?: (index: number) => void;
}

export default function NavigationControls({ 
  currentIndex, 
  total, 
  showChoicePopup, 
  setCurrentIndex 
}: NavigationControlsProps) {
  return (
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
    </div>
  );
}
