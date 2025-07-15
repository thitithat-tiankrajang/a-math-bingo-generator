import React from 'react';
import ActionBox from './ActionBox';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';

interface ActionSectionProps {
  onGenerate: () => void;
  isGenerating: boolean;
  options: EquationAnagramOptions;
  numQuestions: string;
  onNumQuestionsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumQuestionsBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onShowOptionModal: () => void;
  onPrintText: () => void;
  showSolution: boolean;
  onShowSolutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showExampleSolution: boolean;
  onShowExampleSolutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ActionSection(props: ActionSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
      </div>
      <ActionBox {...props} />
    </div>
  );
} 