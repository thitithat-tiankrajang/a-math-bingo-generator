import React from 'react';
import type { MathBingoOptions } from '@/app/types/mathBingo';
import Button from '../ui/Button';

export interface ActionBoxProps {
  onGenerate: () => void;
  isGenerating: boolean;
  options: MathBingoOptions;
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
  numQuestions, 
  onNumQuestionsChange, 
  onNumQuestionsBlur,
  onShowOptionModal, 
  onPrintText, 
  showSolution, 
  onShowSolutionChange 
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

      {/* View/Edit Options Button */}
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
        View/Edit Options
      </Button>

      {/* Number of Questions */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Questions
        </label>
        <div className="flex items-center space-x-3">
          <input
            id="numQuestions"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numQuestions}
            onChange={onNumQuestionsChange}
            onBlur={onNumQuestionsBlur}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
          />
          <span className="text-sm text-gray-500 font-medium">questions</span>
        </div>
      </div>

      {/* Show Solution Toggle */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              id="showSolution"
              type="checkbox"
              checked={showSolution}
              onChange={onShowSolutionChange}
              className="sr-only"
            />
            <label 
              htmlFor="showSolution" 
              className={`flex items-center justify-center w-12 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                showSolution ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                showSolution ? 'translate-x-3' : '-translate-x-3'
              }`}></div>
            </label>
          </div>
          <div className="flex-1">
            <label htmlFor="showSolution" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
              Include Solutions in Text Output
            </label>
            <p className="text-xs text-blue-700 mt-1">
              When enabled, solutions will be generated alongside problems
            </p>
          </div>
        </div>
      </div>

      {/* Print Text Button */}
      <Button
        onClick={onPrintText}
        disabled={isGenerating}
        color="orange"
        icon={
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }
      >
        Generate Text Output
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