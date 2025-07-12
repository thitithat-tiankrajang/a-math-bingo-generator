// src/components/OptionBox.tsx
import type { MathBingoOptions } from '@/app/types/mathBingo';
import { useCallback } from 'react';

interface OptionBoxProps {
  options: MathBingoOptions;
  onOptionsChange: (options: MathBingoOptions) => void;
}

export default function OptionBox({ options, onOptionsChange }: OptionBoxProps) {
  const handleChange = (field: keyof MathBingoOptions, value: number) => {
    onOptionsChange({
      ...options,
      [field]: value
    });
  };

  const handleStep = useCallback((field: keyof MathBingoOptions, step: number, min: number, max: number) => {
    const next = Math.max(min, Math.min(max, options[field] + step));
    onOptionsChange({
      ...options,
      [field]: next
    });
  }, [options, onOptionsChange]);

  // คำนวณจำนวนเลขเบาที่เหลือ
  const lightNumberCount = options.totalCount - options.operatorCount - options.equalsCount - 
                          options.heavyNumberCount - options.wildcardCount - options.zeroCount;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-300 max-w-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <span className="text-blue-600">⚙️</span>
        Options
      </h2>
      
      <div className="space-y-4">
        {/* Total number of tiles */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total number of tiles
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (Min 8, Max 20)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('totalCount', -1, 8, 20)}
              disabled={options.totalCount <= 8}
            >
              −
            </button>
            <input
              type="number"
              min="8"
              max="20"
              value={options.totalCount}
              onChange={(e) => handleChange('totalCount', Math.max(8, Math.min(20, parseInt(e.target.value) || 8)))}
              className="w-16 h-10 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('totalCount', 1, 8, 20)}
              disabled={options.totalCount >= 20}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of operators */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of operators
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (+, −, ×, ÷)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', -1, 1, Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.operatorCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1)}
              value={options.operatorCount}
              onChange={(e) => handleChange('operatorCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1), parseInt(e.target.value) || 1)))}
              className="w-16 h-10 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', 1, 1, Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.operatorCount >= Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of equals signs */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of <span className="font-bold">=</span> signs
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', -1, 1, Math.max(1, options.totalCount - options.operatorCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.equalsCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.operatorCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1)}
              value={options.equalsCount}
              onChange={(e) => handleChange('equalsCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.operatorCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1), parseInt(e.target.value) || 1)))}
              className="w-16 h-10 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', 1, 1, Math.max(1, options.totalCount - options.operatorCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.equalsCount >= Math.max(1, options.totalCount - options.operatorCount - options.heavyNumberCount - options.wildcardCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of heavy numbers */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of heavy numbers
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('heavyNumberCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.heavyNumberCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.wildcardCount - options.zeroCount - 1)}
              value={options.heavyNumberCount}
              onChange={(e) => handleChange('heavyNumberCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.wildcardCount - options.zeroCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('heavyNumberCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.wildcardCount - options.zeroCount - 1))}
              disabled={options.heavyNumberCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.wildcardCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of Blank */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Blank
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (?) Can be any value
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('wildcardCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
              disabled={options.wildcardCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
              value={options.wildcardCount}
              onChange={(e) => handleChange('wildcardCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('wildcardCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
              disabled={options.wildcardCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of zeros */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of zeros
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (Zero - special rules apply)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('zeroCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - 1))}
              disabled={options.zeroCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - 1)}
              value={options.zeroCount}
              onChange={(e) => handleChange('zeroCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('zeroCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - 1))}
              disabled={options.zeroCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.wildcardCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Show remaining light numbers */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
          <p className="text-xs font-medium text-gray-700 mb-1">Number of light numbers (1-9)</p>
          <div className={`rounded-md p-2 border inline-block min-w-[48px] ${
            lightNumberCount >= 0 ? 'bg-white border-green-100' : 'bg-red-50 border-red-200'
          }`}>
            <span className={`text-lg font-bold ${
              lightNumberCount >= 0 ? 'text-black' : 'text-red-600'
            }`}>
              {lightNumberCount}
            </span>
            <span className="text-xs text-gray-500 ml-1">tiles</span>
          </div>
          {lightNumberCount < 0 && (
            <p className="text-xs text-red-600 mt-1">⚠️ Not enough tiles</p>
          )}
        </div>
      </div>

      {/* summary */}
      <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-2 text-center">Summary</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.totalCount}</div>
            <div className="text-gray-600">Total tiles</div>
          </div>
          <div className={`text-center p-2 rounded ${
            lightNumberCount >= 0 ? 'bg-white' : 'bg-red-50'
          }`}>
            <div className={`font-bold ${
              lightNumberCount >= 0 ? 'text-black' : 'text-red-600'
            }`}>
              {lightNumberCount}
            </div>
            <div className="text-gray-600">Light numbers (1-9)</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.heavyNumberCount}</div>
            <div className="text-gray-600">Heavy numbers (10-20)</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.zeroCount}</div>
            <div className="text-gray-600">Zeros</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.operatorCount}</div>
            <div className="text-gray-600">Operators</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.equalsCount}</div>
            <div className="text-gray-600">Equals (=)</div>
          </div>
          <div className="text-center p-2 bg-white rounded col-span-3">
            <div className="font-bold text-black">{options.wildcardCount}</div>
            <div className="text-gray-600">Blank (?)</div>
          </div>
        </div>
      </div>
    </div>
  );
}