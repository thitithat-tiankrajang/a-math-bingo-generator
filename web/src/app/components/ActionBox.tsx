import React from 'react';
import type { MathBingoOptions } from '@/app/types/mathBingo';

export interface ActionBoxProps {
  onGenerate: () => void;
  isGenerating: boolean;
  options: MathBingoOptions;
  numQuestions: number;
  onNumQuestionsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowOptionModal: () => void;
  onPrintText: () => void;
}

export default function ActionBox({ onGenerate, isGenerating, numQuestions, onNumQuestionsChange, onShowOptionModal, onPrintText }: ActionBoxProps) {
  return (
    <div className="bg-green-100 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-green-900">
        Actions
      </h2>
      <div className="space-y-4">
        {/* ปุ่ม generate ปัญหา */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white text-lg transition-colors duration-200 ${isGenerating ? 'bg-yellow-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:bg-green-700'}`}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating problem...</span>
            </div>
          ) : (
            'Generate Problem'
          )}
        </button>
        {/* ปุ่มเพิ่ม (Add) */}
        <button
          onClick={onShowOptionModal}
          className="w-full py-2 px-4 rounded-lg font-medium text-green-900 border border-green-400 bg-white hover:bg-green-50 transition-colors duration-200"
        >
          เพิ่ม (ดู/ปรับ Option)
        </button>
        {/* input จำนวนข้อ */}
        <div className="flex items-center gap-2">
          <label htmlFor="numQuestions" className="text-green-900 font-medium">จำนวนข้อ:</label>
          <input
            id="numQuestions"
            type="number"
            min={1}
            max={20}
            value={numQuestions}
            onChange={onNumQuestionsChange}
            className="w-16 px-2 py-1 border border-green-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        {/* ปุ่ม Print Text */}
        <button
          onClick={onPrintText}
          disabled={isGenerating}
          className="w-full py-2 px-4 rounded-lg font-medium text-white text-lg transition-colors duration-200 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700"
        >
          Print Text
        </button>
        {/* คำอธิบาย */}
        <div className="text-sm text-green-800 space-y-2">
          <p>
            <strong>DS Bingo Problem</strong> is a set of numbers and operators that can be arranged into at least one valid equation.
          </p>
          <p className="text-xs text-yellow-900">
            Example: 1 2 3 4 5 + × = can be arranged as 4×2+5=13
          </p>
        </div>
      </div>
    </div>
  );
}