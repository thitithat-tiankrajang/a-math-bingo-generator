import React from 'react';
import DisplayBox from './DisplayBox';
import type { EquationAnagramResult } from '@/app/types/EquationAnagram';
import type { LockedPos } from '@/app/lib/assignmentService';

// ✅ Support result with lock positions from DB
type DisplayResult = EquationAnagramResult & {
  lockPositions?: number[];
  solutionTokens?: string[];
  listPosLock?: LockedPos[] | null;
};

interface DisplaySectionProps {
  results: DisplayResult[];
  onGenerate?: () => void;
  isGenerating: boolean;
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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

export default function DisplaySection({ 
  results, 
  onGenerate, 
  isGenerating, 
  currentIndex, 
  setCurrentIndex, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  assignmentMode = false,
  onValidEquation,
  activeAssignment,
  onSubmitAnswer
}: DisplaySectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <DisplayBox 
        result={results.length > 0 ? results[currentIndex] : null}
        onGenerate={assignmentMode ? undefined : onGenerate}
        isGenerating={isGenerating}
        currentIndex={currentIndex}
        total={results.length}
        setCurrentIndex={setCurrentIndex}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        assignmentMode={assignmentMode}
        onValidEquation={onValidEquation}
        activeAssignment={activeAssignment}
        onSubmitAnswer={onSubmitAnswer}
      />
    </div>
  );
} 