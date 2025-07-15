import React from 'react';
import OptionBox from './OptionBox';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';

interface ConfigSectionProps {
  options: EquationAnagramOptions;
  setOptions: (opts: EquationAnagramOptions) => void;
  numQuestions: number;
  setNumQuestions: (n: number) => void;
}

export default function ConfigSection({ options, setOptions, numQuestions, setNumQuestions }: ConfigSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
      </div>
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-xl p-4 mb-2 bg-gray-50 relative">
          <OptionBox 
            options={options} 
            onOptionsChange={setOptions}
          />
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={100}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              value={numQuestions}
              onChange={e => {
                let num = parseInt(e.target.value, 10);
                if (isNaN(num) || num < 1) num = 1;
                if (num > 100) num = 100;
                setNumQuestions(num);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 