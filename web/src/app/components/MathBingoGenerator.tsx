// src/components/MathBingoGenerator.tsx
'use client';

import { useState } from 'react';
import DisplayBox from './DisplayBox';
import OptionBox from './OptionBox';
import ActionBox from './ActionBox';
import { generateMathBingo } from '@/app/lib/mathBingoLogic';
import type { MathBingoOptions, MathBingoResult } from '@/app/types/mathBingo';

export default function MathBingoGenerator() {
  const [options, setOptions] = useState<MathBingoOptions>({
    totalCount: 8,
    operatorMode: 'random',
    operatorCount: 2,
    equalsCount: 1,
    heavyNumberCount: 0,
    BlankCount: 0,
    zeroCount: 0
  });

  const [result, setResult] = useState<MathBingoResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(3);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showSolution, setShowSolution] = useState(true); // for text generation only
  const [showExampleSolution, setShowExampleSolution] = useState(true); // for DisplayBox only
  const [questionText, setQuestionText] = useState('');
  const [solutionText, setSolutionText] = useState('');

  const handleOptionsChange = (newOptions: MathBingoOptions) => {
    setOptions(newOptions);
  };

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumQuestions(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedResult = await generateMathBingo(options);
      setResult(generatedResult);
    } catch (error) {
      console.error('Error generating math bingo:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintText = async () => {
    setIsGenerating(true);
    try {
      const questions: string[] = [];
      const solutions: string[] = [];
      for (let i = 0; i < numQuestions; i++) {
        const generated = await generateMathBingo(options);
        questions.push(`${i + 1}) ${generated.elements.join(', ')}`);
        if (showSolution && generated.sampleEquation) {
          solutions.push(`${i + 1}) ${generated.sampleEquation}`);
        } else {
          solutions.push(`${i + 1}) -`);
        }
      }
      setQuestionText(questions.join('\n'));
      setSolutionText(solutions.join('\n'));
      setShowOptionModal(true);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowOptionModal = () => {
    setShowOptionModal(true);
  };

  const handleCloseOptionModal = () => {
    setShowOptionModal(false);
  };

  const handleShowSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSolution(e.target.checked);
  };

  const handleShowExampleSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowExampleSolution(e.target.checked);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Math Bingo Generator
          </h1>
          <p className="text-gray-700 text-lg">Create engaging math problems for learning and fun!</p>
        </div>

        <div className="space-y-6">
          {/* Display Box */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <DisplayBox 
              result={result}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Option Box */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
                </div>
                <OptionBox 
                  options={options} 
                  onOptionsChange={handleOptionsChange}
                />
              </div>
            </div>

            {/* Action Box */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded-full mr-3"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
                </div>
                <ActionBox 
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  options={options}
                  numQuestions={numQuestions}
                  onNumQuestionsChange={handleNumQuestionsChange}
                  onShowOptionModal={handleShowOptionModal}
                  onPrintText={handlePrintText}
                  showSolution={showSolution}
                  onShowSolutionChange={handleShowSolutionChange}
                  showExampleSolution={showExampleSolution}
                  onShowExampleSolutionChange={handleShowExampleSolutionChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseOptionModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Generated Problems
              </h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
                onClick={handleCloseOptionModal}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: side-by-side */}
            <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <CopyBox label="โจทย์" text={questionText} />
              <CopyBox label="เฉลย" text={solutionText} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// New CopyBox component
function CopyBox({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-xl border border-gray-200 p-4 relative min-w-[220px] max-w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{label}</span>
        <button
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center gap-1 ${copied ? 'bg-green-500 text-white border-green-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              คัดลอกแล้ว
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              คัดลอก
            </>
          )}
        </button>
      </div>
      <textarea
        className="w-full h-64 p-2 border border-gray-200 rounded-lg bg-gray-100 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
        value={text}
        readOnly
        placeholder={label}
      />
      <div className="absolute bottom-2 right-4 text-xs text-gray-500">
        {text.split('\n').length} ข้อ
      </div>
    </div>
  );
}