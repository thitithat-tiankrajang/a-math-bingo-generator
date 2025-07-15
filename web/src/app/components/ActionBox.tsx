import React from 'react';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';
import Button from '../ui/Button';

export interface ActionBoxProps {
  onGenerate: () => void;
  isGenerating: boolean;
  options: EquationAnagramOptions;
  numQuestions: string;
  onNumQuestionsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumQuestionsBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onShowOptionModal: () => void;
  onPrintText: () => void;
  showSolution: boolean; // for text only
  onShowSolutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showExampleSolution: boolean; // for UI only
  onShowExampleSolutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ActionBox({ 
  onGenerate, 
  isGenerating, 
  onShowOptionModal, 
}: ActionBoxProps) {
  return (
    <div className="space-y-6">
      {/* Generate Problem Button */}
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
        Generate Problem
      </Button>

      {/* Settings for Print Button */}
      <Button
        onClick={onShowOptionModal}
        color="white"
        icon={
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        Settings for Print
      </Button>

      {/* Description */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-purple-900 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What is DS Bingo Problem?
          </h3>
          <p className="text-sm text-purple-800 leading-relaxed">
            A set of numbers and operators that can be arranged into at least one valid mathematical equation.
          </p>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-purple-700 font-medium mb-1">Example:</p>
            <p className="text-xs text-gray-700">
              <span className="font-mono bg-purple-100 px-2 py-1 rounded">1 2 3 4 5 + × =</span>
              <span className="mx-2">→</span>
              <span className="font-mono bg-green-100 px-2 py-1 rounded">4 × 2 + 5 = 13</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}