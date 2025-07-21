import React from 'react';
import DisplayBox from './DisplayBox';
import type { EquationAnagramResult } from '@/app/types/EquationAnagram';

interface DisplaySectionProps {
  results: EquationAnagramResult[];
  onGenerate: () => void;
  isGenerating: boolean;
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function DisplaySection({ results, onGenerate, isGenerating, currentIndex, setCurrentIndex, onUndo, onRedo, canUndo, canRedo }: DisplaySectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <DisplayBox 
        result={results.length > 0 ? results[currentIndex] : null}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        currentIndex={currentIndex}
        total={results.length}
        setCurrentIndex={setCurrentIndex}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
} 