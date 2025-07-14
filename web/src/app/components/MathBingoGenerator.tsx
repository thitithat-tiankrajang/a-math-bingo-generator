// src/components/MathBingoGenerator.tsx
'use client';

import { useState } from 'react';
import DisplayBox from './DisplayBox';
import OptionBox from './OptionBox';
import ActionBox from './ActionBox';
import { generateMathBingo } from '@/app/lib/mathBingoLogic';
import type { MathBingoOptions, MathBingoResult } from '@/app/types/mathBingo';
import jsPDF from 'jspdf';

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
  const [printText, setPrintText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [showSolution, setShowSolution] = useState(true);
  const [showExampleSolution, setShowExampleSolution] = useState(true);
  const handleShowSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => setShowSolution(e.target.checked);
  const handleShowExampleSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => setShowExampleSolution(e.target.checked);

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
      const problemLines: string[] = [];
      const solutionLines: string[] = [];
      
      for (let i = 0; i < numQuestions; i++) {
        const generated = await generateMathBingo(options);
        problemLines.push(`${i + 1}) ${generated.elements.join(', ')}`);
        solutionLines.push(`${i + 1}) ${generated.sampleEquation || '-'}`);
      }
      
      setPrintText(problemLines.join('\n'));
      setSolutionText(solutionLines.join('\n'));
      setShowOptionModal(true);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowOptionModal = () => {
    setPrintText('');
    setSolutionText('');
    setShowOptionModal(true);
  };

  const handleCloseOptionModal = () => {
    setShowOptionModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              DS Math Bingo Generator
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
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-semibold text-gray-900">
                {printText ? 'Generated Problems & Solutions' : 'Current Configuration'}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {printText ? (
                <SplitTextAreas problemText={printText} solutionText={solutionText} />
              ) : (
                <div>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {JSON.stringify(options, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> These are your current settings. You can modify them in the Configuration panel.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Split Text Areas component
function SplitTextAreas({ problemText, solutionText }: { problemText: string; solutionText: string }) {
  const [problemCopied, setProblemCopied] = useState(false);
  const [solutionCopied, setSolutionCopied] = useState(false);

  const handleCopyProblem = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(problemText);
      } else {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = problemText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setProblemCopied(true);
      setTimeout(() => setProblemCopied(false), 2000);
    } catch {
      setProblemCopied(false);
    }
  };

  const handleCopySolution = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(solutionText);
      } else {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = solutionText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setSolutionCopied(true);
      setTimeout(() => setSolutionCopied(false), 2000);
    } catch {
      setSolutionCopied(false);
    }
  };

  const handlePrintProblemPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Math Problems', 10, 20);
    doc.setFontSize(12);
    
    const lines = problemText.split('\n');
    let y = 35;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('math-problems.pdf');
  };

  const handlePrintSolutionPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Math Solutions', 10, 20);
    doc.setFontSize(12);
    
    const lines = solutionText.split('\n');
    let y = 35;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save('math-solutions.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Split Text Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problems Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-2"></div>
              Problems
            </h4>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                problemCopied 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              }`}
              onClick={handleCopyProblem}
              disabled={problemCopied}
            >
              {problemCopied ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
          
          <div className="relative">
            <textarea 
              className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              value={problemText} 
              readOnly 
              placeholder="Problems will appear here..."
            />
            <div className="absolute top-3 right-3 text-xs text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-300">
              {problemText.split('\n').length} problems
            </div>
          </div>

          <button 
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            onClick={handlePrintProblemPDF}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Problems PDF
            </span>
          </button>
        </div>

        {/* Solutions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-2"></div>
              Solutions
            </h4>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                solutionCopied 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
              }`}
              onClick={handleCopySolution}
              disabled={solutionCopied}
            >
              {solutionCopied ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
          
          <div className="relative">
            <textarea 
              className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
              value={solutionText} 
              readOnly 
              placeholder="Solutions will appear here..."
            />
            <div className="absolute top-3 right-3 text-xs text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-300">
              {solutionText.split('\n').length} solutions
            </div>
          </div>

          <button 
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
            onClick={handlePrintSolutionPDF}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Solutions PDF
            </span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> You can copy problems and solutions separately to your clipboard or download them as separate PDF files. This makes it easy to distribute problems to students while keeping solutions for yourself.
        </p>
      </div>
    </div>
  );
}