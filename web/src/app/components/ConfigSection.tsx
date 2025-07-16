import React from 'react';
import OptionPanel from './OptionPanel';
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
          <OptionPanel
            options={options}
            onOptionsChange={setOptions}
            numQuestions={numQuestions}
            onNumQuestionsChange={setNumQuestions}
            variant="display"
          />
      </div>
    </div>
  );
} 