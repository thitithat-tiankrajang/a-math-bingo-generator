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

  const handleOptionsChange = (newOptions: MathBingoOptions) => {
    setOptions(newOptions);
  };

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)));
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
      const lines: string[] = [];
      for (let i = 0; i < numQuestions; i++) {
        const generated = await generateMathBingo(options);
        lines.push(`${i + 1}) ${generated.elements.join(', ')}`);
      }
      setPrintText(lines.join('\n'));
      setShowOptionModal(true);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowOptionModal = () => {
    setPrintText('');
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
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-semibold text-gray-900">
                {printText ? 'Generated Problems' : 'Current Configuration'}
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
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {printText ? (
                <CopyTextArea printText={printText} />
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

// Enhanced CopyTextArea component
function CopyTextArea({ printText }: { printText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(printText);
      } else {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = printText;
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
    <div className="space-y-4">
      {/* Text Area */}
      <div className="relative">
        <textarea 
          className="w-full h-64 p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
          value={printText} 
          readOnly 
          placeholder="Generated problems will appear here..."
        />
        <div className="absolute top-3 right-3 text-xs text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-300">
          {printText.split('\n').length} problems
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            copied 
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105'
          }`}
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </span>
          )}
        </button>
        
        <button 
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400"
          onClick={() => {
            const doc = new jsPDF();
            const lines = printText.split('\n');
            let y = 10;
            lines.forEach(line => {
              doc.text(line, 10, y);
              y += 10;
              if (y > 280) {
                doc.addPage();
                y = 10;
              }
            });
            doc.save('math-problems.pdf');
          }}
        >
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </span>
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> You can copy these problems to your clipboard or download them as a text file for later use.
        </p>
      </div>
    </div>
  );
}