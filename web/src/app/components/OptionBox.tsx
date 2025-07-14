// src/components/OptionBox.tsx
import type { MathBingoOptions } from '@/app/types/mathBingo';
import { useId, useCallback, useEffect, useState } from 'react';
import { FaDice, FaBullseye } from 'react-icons/fa';

interface OptionBoxProps {
  options: MathBingoOptions;
  onOptionsChange: (options: MathBingoOptions) => void;
}

export default function OptionBox({ options, onOptionsChange }: OptionBoxProps) {
  // Update operatorCount when specific operators change
  useEffect(() => {
    if (options.operatorMode === 'specific' && options.specificOperators) {
      const total = (options.specificOperators.plus || 0) +
                   (options.specificOperators.minus || 0) +
                   (options.specificOperators.multiply || 0) +
                   (options.specificOperators.divide || 0);
      if (total !== options.operatorCount) {
        onOptionsChange({
          ...options,
          operatorCount: total
        });
      }
    }
  }, [options, onOptionsChange]);

  const handleChange = (field: keyof MathBingoOptions, value: number | string) => {
    onOptionsChange({
      ...options,
      [field]: value
    });
  };

  const handleModeChange = (mode: 'random' | 'specific') => {
    if (mode === 'specific') {
      // Initialize specific operators with current operatorCount distributed
      const baseCount = Math.floor(options.operatorCount / 4);
      const remainder = options.operatorCount % 4;
      onOptionsChange({
        ...options,
        operatorMode: mode,
        specificOperators: {
          plus: baseCount + (remainder >= 1 ? 1 : 0),
          minus: baseCount + (remainder >= 2 ? 1 : 0),
          multiply: baseCount + (remainder >= 3 ? 1 : 0),
          divide: baseCount
        }
      });
    } else {
      onOptionsChange({
        ...options,
        operatorMode: mode,
        specificOperators: undefined
      });
    }
  };

  const handleSpecificOperatorChange = useCallback(
    (operator: keyof NonNullable<MathBingoOptions['specificOperators']>, value: number) => {
      const newSpecificOperators = {
        ...options.specificOperators,
        [operator]: value
      };
      onOptionsChange({
        ...options,
        specificOperators: newSpecificOperators
      });
    },
    [options, onOptionsChange]
  );

  const handleStep = useCallback((field: keyof MathBingoOptions, step: number, min: number, max: number) => {
    const current = options[field];
    if (typeof current === 'number') {
      const next = Math.max(min, Math.min(max, current + step));
      onOptionsChange({
        ...options,
        [field]: next
      });
    }
  }, [options, onOptionsChange]);

  const handleSpecificStep = useCallback((operator: keyof NonNullable<MathBingoOptions['specificOperators']>, step: number) => {
    if (!options.specificOperators) return;
    const current = options.specificOperators[operator] || 0;
    const otherOperators = Object.entries(options.specificOperators)
      .filter(([key]) => key !== operator)
      .reduce((sum, [, value]) => sum + (value || 0), 0);
    
    const maxForThis = Math.max(0, options.totalCount - options.equalsCount - options.heavyNumberCount - 
                                   options.BlankCount - options.zeroCount - otherOperators - 1);
    const next = Math.max(0, Math.min(maxForThis, current + step));
    
    handleSpecificOperatorChange(operator, next);
  }, [options, handleSpecificOperatorChange]);

  // const lightNumberCount = options.totalCount - options.operatorCount - options.equalsCount - 
  //                         options.heavyNumberCount - options.BlankCount - options.zeroCount;

  const maxOperators = Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - 
                                   options.BlankCount - options.zeroCount - 1);

  // Move useId to top-level
  const switchId = useId();

  return (
    <div className="bg-green-100 rounded-lg shadow-md border border-green-200 p-6 transition-all duration-300 max-w-full">
      <h2 className="text-lg font-semibold mb-4 text-green-900 flex items-center gap-2">
        <span className="text-yellow-500">⚙️</span>
        Options
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total number of tiles */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 col-span-1 lg:col-span-2">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Total number of tiles
            <span className="block text-xs text-yellow-900 mt-1 font-normal">
              (Min 8, Max 15)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('totalCount', -1, 8, 15)}
              disabled={options.totalCount <= 8}
            >
              −
            </button>
            <input
              type="number"
              min="8"
              max="15"
              value={options.totalCount}
              onChange={(e) => handleChange('totalCount', Math.max(8, Math.min(15, parseInt(e.target.value) || 8)))}
              className="w-16 h-10 text-center px-2 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('totalCount', 1, 8, 15)}
              disabled={options.totalCount >= 15}
            >
              +
            </button>
          </div>
        </div>

        {/* Operators Section with animated card content */}
        <div className="col-span-1 lg:col-span-2">
          <div className={options.operatorMode === 'random' ? "bg-gray-50 rounded-lg p-4 border border-gray-200" : "bg-yellow-50 rounded-lg p-4 border border-yellow-200 space-y-3"}>
            {/* Heading row with toggle and (if specific) total badge */}
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span className="text-sm font-medium text-green-900 truncate">
                {options.operatorMode === 'random' ? 'Number of operators (Random)' : 'Specify operators'}
              </span>
              <div className="flex items-center gap-2">
                {/* Total badge (specific mode only) */}
                <span className={`text-sm font-medium text-yellow-900 bg-white px-2 py-1 rounded transition-all duration-300 ${options.operatorMode === 'specific' ? 'opacity-100 scale-100 ml-0' : 'opacity-0 scale-90 ml-[-8px] pointer-events-none select-none'}`}
                  style={{ minWidth: options.operatorMode === 'specific' ? 'auto' : 0 }}>
                  Total: {options.operatorCount}
                </span>
                {/* Toggle */}
                <label htmlFor={switchId} className="flex items-center cursor-pointer select-none group ml-2">
                  <span className="mr-1 text-base">
                    {options.operatorMode === 'specific' ? <FaBullseye className="text-yellow-500" /> : <FaDice className="text-yellow-500" />}
                  </span>
                  <div className="relative">
                    <input
                      id={switchId}
                      type="checkbox"
                      checked={options.operatorMode === 'specific'}
                      onChange={e => handleModeChange(e.target.checked ? 'specific' : 'random')}
                      className="sr-only"
                      aria-label="Toggle operator mode"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors duration-200 border-2 ${options.operatorMode === 'specific' ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-300 border-gray-400'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${options.operatorMode === 'specific' ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-2 text-xs font-semibold text-yellow-900 whitespace-nowrap">
                    {options.operatorMode === 'specific' ? 'Specific' : 'Random'}
                  </span>
                </label>
              </div>
            </div>
            {/* Animated card content */}
            <div className="relative min-h-[80px]">
              <AnimatedCardContent mode={options.operatorMode} operatorCount={options.operatorCount} handleStep={handleStep} handleChange={handleChange} maxOperators={maxOperators} options={options} handleSpecificOperatorChange={handleSpecificOperatorChange} handleSpecificStep={handleSpecificStep} />
            </div>
          </div>
        </div>

        {/* Number of equals signs */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Number of <span className="font-bold">=</span> signs
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1))}
              disabled={options.equalsCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1)}
              value={options.equalsCount}
              onChange={(e) => handleChange('equalsCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1))}
              disabled={options.equalsCount >= Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of heavy numbers */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Number of heavy numbers
            <span className="block text-xs text-yellow-900 mt-1 font-normal">
              (10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('heavyNumberCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1))}
              disabled={options.heavyNumberCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1)}
              value={options.heavyNumberCount}
              onChange={(e) => handleChange('heavyNumberCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('heavyNumberCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1))}
              disabled={options.heavyNumberCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of Blank */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Number of Blank
            <span className="block text-xs text-yellow-900 mt-1 font-normal">
              (?) Can be any value
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('BlankCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
              disabled={options.BlankCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
              value={options.BlankCount}
              onChange={(e) => handleChange('BlankCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('BlankCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
              disabled={options.BlankCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Number of zeros */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label className="block text-sm font-medium text-green-900 mb-2">
            Number of zeros
            <span className="block text-xs text-yellow-900 mt-1 font-normal">
              (Zero - special rules apply)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('zeroCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1))}
              disabled={options.zeroCount <= 0}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1)}
              value={options.zeroCount}
              onChange={(e) => handleChange('zeroCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1), parseInt(e.target.value) || 0)))}
              className="w-16 h-10 text-center px-2 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('zeroCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1))}
              disabled={options.zeroCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// AnimatedCardContent component for smooth transitions
import React from 'react';
type AnimatedCardContentProps = {
  mode: 'random' | 'specific';
  operatorCount: number;
  handleStep: (field: keyof MathBingoOptions, step: number, min: number, max: number) => void;
  handleChange: (field: keyof MathBingoOptions, value: number | string) => void;
  maxOperators: number;
  options: MathBingoOptions;
  handleSpecificOperatorChange: (operator: keyof NonNullable<MathBingoOptions['specificOperators']>, value: number) => void;
  handleSpecificStep: (operator: keyof NonNullable<MathBingoOptions['specificOperators']>, step: number) => void;
};

function AnimatedCardContent({ mode, operatorCount, handleStep, handleChange, maxOperators, options, handleSpecificOperatorChange, handleSpecificStep }: AnimatedCardContentProps) {
  const [show, setShow] = useState<'random' | 'specific'>(mode);
  const [fade, setFade] = useState<'in' | 'out'>('in');
  React.useEffect(() => {
    if (mode !== show) {
      setFade('out');
      const timeout = setTimeout(() => {
        setShow(mode);
        setFade('in');
      }, 180);
      return () => clearTimeout(timeout);
    }
  }, [mode, show]);
  return (
    <div className={`transition-all duration-400 ease-in-out ${fade === 'out' ? 'opacity-0 translate-y-4 scale-95 pointer-events-none absolute inset-0' : 'opacity-100 translate-y-0 scale-100 relative'}`}>
      {show === 'random' ? (
        <>
          <span className="block text-xs text-yellow-900 mt-1 font-normal mb-2">
            Will randomly select from: +, −, ×, ÷
          </span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', -1, 1, maxOperators)}
              disabled={options.operatorCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={maxOperators}
              value={options.operatorCount}
              onChange={(e) => handleChange('operatorCount', Math.max(1, Math.min(maxOperators, parseInt(e.target.value) || 1)))}
              className="w-16 h-10 text-center px-2 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              readOnly
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', 1, 1, maxOperators)}
              disabled={options.operatorCount >= maxOperators}
            >
              +
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Plus + */}
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <label className="block text-xs font-medium text-green-900 mb-2">
                Addition (+)
              </label>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 text-green-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('plus', -1)}
                  disabled={(options.specificOperators?.plus || 0) <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={options.specificOperators?.plus || 0}
                  onChange={(e) => handleSpecificOperatorChange('plus', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 h-8 text-center px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-200 text-sm font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  readOnly
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 text-green-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('plus', 1)}
                >
                  +
                </button>
              </div>
            </div>
            {/* Minus - */}
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <label className="block text-xs font-medium text-green-900 mb-2">
                Subtraction (−)
              </label>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('minus', -1)}
                  disabled={(options.specificOperators?.minus || 0) <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={options.specificOperators?.minus || 0}
                  onChange={(e) => handleSpecificOperatorChange('minus', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 h-8 text-center px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200 text-sm font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  readOnly
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('minus', 1)}
                >
                  +
                </button>
              </div>
            </div>
            {/* Multiply × */}
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <label className="block text-xs font-medium text-green-900 mb-2">
                Multiplication (×)
              </label>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('multiply', -1)}
                  disabled={(options.specificOperators?.multiply || 0) <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={options.specificOperators?.multiply || 0}
                  onChange={(e) => handleSpecificOperatorChange('multiply', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 h-8 text-center px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  readOnly
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('multiply', 1)}
                >
                  +
                </button>
              </div>
            </div>
            {/* Divide ÷ */}
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <label className="block text-xs font-medium text-green-900 mb-2">
                Division (÷)
              </label>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('divide', -1)}
                  disabled={(options.specificOperators?.divide || 0) <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={options.specificOperators?.divide || 0}
                  onChange={(e) => handleSpecificOperatorChange('divide', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 h-8 text-center px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  readOnly
                />
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  onClick={() => handleSpecificStep('divide', 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {/* Warning if total is 0 */}
          {operatorCount === 0 && (
            <div className="text-xs text-red-600 text-center mt-2">
              ⚠️ Please select at least 1 operator
            </div>
          )}
        </>
      )}
    </div>
  );
}