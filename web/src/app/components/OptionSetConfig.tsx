import React, { useState, useEffect } from 'react';
import OptionBox from './OptionBox';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';

interface OptionSetConfigProps {
  options: EquationAnagramOptions;
  onOptionsChange: (opts: EquationAnagramOptions) => void;
  numQuestions: number;
  onNumQuestionsChange: (n: number) => void;
  onRemove?: () => void;
  setLabel?: string;
  setIndex?: number; // for localStorage key
}

function OptionSummary({ options, numQuestions }: { options: EquationAnagramOptions, numQuestions: number }) {
  return (
    <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200">
      <div><span className="font-semibold">Total Tiles:</span> {options.totalCount}</div>
      <div><span className="font-semibold">Mode:</span> {options.operatorMode}</div>
      <div><span className="font-semibold">Operators:</span> {options.operatorCount}</div>
      <div><span className="font-semibold">Equals:</span> {options.equalsCount}</div>
      <div><span className="font-semibold">Heavy:</span> {options.heavyNumberCount}</div>
      <div><span className="font-semibold">Blank:</span> {options.BlankCount}</div>
      <div><span className="font-semibold">Zero:</span> {options.zeroCount}</div>
      <div><span className="font-semibold">Number of Questions:</span> {numQuestions}</div>
      {options.operatorMode === 'specific' && options.specificOperators && (
        <div className="col-span-2 md:col-span-4 flex flex-wrap gap-2 mt-1">
          <span className="font-semibold">Operator Counts:</span>
          <span>+ {options.specificOperators.plus || 0}</span>
          <span>- {options.specificOperators.minus || 0}</span>
          <span>× {options.specificOperators.multiply || 0}</span>
          <span>÷ {options.specificOperators.divide || 0}</span>
        </div>
      )}
    </div>
  );
}

export default function OptionSetConfig({ options, onOptionsChange, numQuestions, onNumQuestionsChange, onRemove, setLabel, setIndex }: OptionSetConfigProps) {
  const storageKey = setIndex !== undefined ? `bingo_option_set_show_${setIndex}` : undefined;
  const [showOptions, setShowOptions] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === 'false') return false;
    }
    return true;
  });
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.setItem(storageKey, showOptions ? 'true' : 'false');
    }
  }, [showOptions, storageKey]);
  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-2 bg-gray-50 relative">
      <div className="flex items-center mb-2">
        {setLabel && <span className="font-semibold text-blue-700 mr-2">{setLabel}</span>}
        <button
          className={`ml-auto mr-2 px-2 py-1 rounded text-xs font-medium border transition-all duration-200 ${showOptions ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-white border-gray-300 text-gray-700'}`}
          onClick={() => setShowOptions(v => !v)}
        >
          {showOptions ? 'Hide Options' : 'Show Options'}
        </button>
        {onRemove && (
          <button className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <OptionSummary options={options} numQuestions={numQuestions} />
      {showOptions && (
        <>
          <OptionBox 
            options={options}
            onOptionsChange={onOptionsChange}
            numQuestions={numQuestions}
            onNumQuestionsChange={onNumQuestionsChange}
          />
        </>
      )}
    </div>
  );
} 