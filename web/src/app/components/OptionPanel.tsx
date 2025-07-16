import React, { useState, useEffect, useId, useCallback } from 'react';
import { FaDice, FaBullseye } from 'react-icons/fa';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';
import InputNumberBox from '../ui/InputNumberBox';

interface OptionPanelProps {
  options: EquationAnagramOptions;
  onOptionsChange: (opts: EquationAnagramOptions) => void;
  numQuestions?: number;
  onNumQuestionsChange?: (n: number) => void;
  onRemove?: () => void;
  setLabel?: string;
  setIndex?: number;
  collapsible?: boolean; // allow collapse (for print/pdf)
  variant?: 'display' | 'pdftext';
}

export default function OptionPanel({
  options,
  onOptionsChange,
  numQuestions,
  onNumQuestionsChange,
  onRemove,
  setLabel,
  setIndex,
  collapsible = false,
  variant = 'display',
}: OptionPanelProps) {
  // Collapsible state for print/pdf modal
  const storageKey = setIndex !== undefined ? `bingo_option_set_show_${setIndex}` : undefined;
  const [showOptions, setShowOptions] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored === 'false') return false;
    }
    return true;
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      window.sessionStorage.setItem(storageKey, showOptions ? 'true' : 'false');
    }
  }, [showOptions, storageKey]);

  // OptionBox logic
  useEffect(() => {
    if (options.operatorMode === 'specific' && options.operatorCounts) {
      const total = (options.operatorCounts['+'] || 0) +
        (options.operatorCounts['-'] || 0) +
        (options.operatorCounts['×'] || 0) +
        (options.operatorCounts['÷'] || 0);
      if (total !== options.operatorCount) {
        onOptionsChange({
          ...options,
          operatorCount: total
        });
      }
    }
  }, [options, onOptionsChange]);

  const handleChange = (field: keyof EquationAnagramOptions, value: number | string) => {
    onOptionsChange({
      ...options,
      [field]: value
    });
  };

  const handleModeChange = (mode: 'random' | 'specific') => {
    if (mode === 'specific') {
      const baseCount = Math.floor(options.operatorCount / 4);
      const remainder = options.operatorCount % 4;
      onOptionsChange({
        ...options,
        operatorMode: mode,
        operatorCounts: {
          '+': baseCount + (remainder >= 1 ? 1 : 0),
          '-': baseCount + (remainder >= 2 ? 1 : 0),
          '×': baseCount + (remainder >= 3 ? 1 : 0),
          '÷': baseCount
        }
      });
    } else {
      onOptionsChange({
        ...options,
        operatorMode: mode,
        operatorCounts: undefined
      });
    }
  };

  const handleStep = useCallback((field: keyof EquationAnagramOptions, step: number, min: number, max: number) => {
    const current = options[field];
    if (typeof current === 'number') {
      const next = Math.max(min, Math.min(max, current + step));
      onOptionsChange({
        ...options,
        [field]: next
      });
    }
  }, [options, onOptionsChange]);

  const maxOperators = Math.max(1, options.totalCount - options.equalsCount - options.heavyNumberCount - 
    options.BlankCount - options.zeroCount - 1);

  const switchId = useId();

  // Color palette for set accent
  const accentColors = [
    'border-blue-500 bg-blue-500', // สีแรกเป็นฟ้า ไม่ใช่ gray
    'border-green-400 bg-green-400',
    'border-yellow-400 bg-yellow-400',
    'border-purple-400 bg-purple-400',
    'border-pink-400 bg-pink-400',
    'border-orange-400 bg-orange-400',
    'border-teal-400 bg-teal-400',
    'border-indigo-400 bg-indigo-400',
    'border-red-400 bg-red-400',
  ];
  const accent = setIndex !== undefined ? accentColors[setIndex % accentColors.length] : 'border-blue-500 bg-blue-500';

  // Style variants
  const panelClass =
    variant === 'pdftext'
      ? `bg-white border-l-8 ${accent.split(' ').join(' ')} border border-gray-200 rounded-xl p-4 transition-all duration-300 w-full relative mb-6${!showOptions ? ' mb-6' : ''}`
      : '';

  return (
    <div className={panelClass}>
      {/* Header/Collapse/Remove + Summary Row (inline) */}
      {(collapsible || setLabel || onRemove) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 md:gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            {setLabel && (
              <div className="flex items-center min-w-[80px] max-w-xs truncate">
                <div className={`w-8 h-8 ${accent.split(' ').join(' ')} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-white font-bold text-xs md:text-sm">{setLabel.replace('Set ', '')}</span>
                </div>
                <span className="font-semibold text-blue-700 text-base md:text-lg truncate">{setLabel}</span>
              </div>
            )}
            {/* Responsive summary row for pdftext mode */}
            {variant === 'pdftext' && (
              <div className="flex flex-wrap items-center gap-2 md:gap-4 overflow-x-auto text-xs md:text-sm font-medium text-gray-700 my-2">
                <span className="inline-flex items-center gap-1 bg-indigo-50 rounded px-2 py-1"><span className="font-bold">Tiles:</span> {options.totalCount}</span>
                <span className="inline-flex items-center gap-1 bg-green-50 rounded px-2 py-1"><span className="font-bold">Mode:</span> {options.operatorMode}</span>
                <span className="inline-flex items-center gap-1 bg-purple-50 rounded px-2 py-1"><span className="font-bold">Ops:</span> {options.operatorCount}</span>
                <span className="inline-flex items-center gap-1 bg-orange-50 rounded px-2 py-1"><span className="font-bold">=</span> {options.equalsCount}</span>
                <span className="inline-flex items-center gap-1 bg-red-50 rounded px-2 py-1"><span className="font-bold">Heavy:</span> {options.heavyNumberCount}</span>
                <span className="inline-flex items-center gap-1 bg-yellow-50 rounded px-2 py-1"><span className="font-bold">Blank:</span> {options.BlankCount}</span>
                <span className="inline-flex items-center gap-1 bg-gray-50 rounded px-2 py-1"><span className="font-bold">Zero:</span> {options.zeroCount}</span>
                {typeof numQuestions === 'number' && <span className="inline-flex items-center gap-1 bg-blue-50 rounded px-2 py-1"><span className="font-bold">Q:</span> {numQuestions}</span>}
                {options.operatorMode === 'specific' && options.operatorCounts && (
                  <span className="inline-flex items-center gap-1 bg-pink-50 rounded px-2 py-1 whitespace-nowrap overflow-x-auto">
                    <span className="font-bold">Dist:</span>
                    <span className="inline-flex items-center px-1 rounded bg-green-100 text-green-800">+{options.operatorCounts['+'] || 0}</span>
                    <span className="inline-flex items-center px-1 rounded bg-red-100 text-red-800">-{options.operatorCounts['-'] || 0}</span>
                    <span className="inline-flex items-center px-1 rounded bg-blue-100 text-blue-800">×{options.operatorCounts['×'] || 0}</span>
                    <span className="inline-flex items-center px-1 rounded bg-orange-100 text-orange-800">÷{options.operatorCounts['÷'] || 0}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            {collapsible && (
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all duration-200 ${showOptions ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => setShowOptions(v => !v)}
              >
                {showOptions ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Hide
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show
                  </span>
                )}
              </button>
            )}
            {onRemove && (
              <button 
                className="px-3 py-1 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-200" 
                onClick={onRemove}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Main Option UI */}
      {(!collapsible || showOptions) && (
        <>
          {/* Number of Questions Section - Always visible */}
          {typeof numQuestions === 'number' && onNumQuestionsChange && (
            <div className={`mb-6 ${variant === 'display' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4' : 'bg-blue-50 border border-blue-200 rounded-xl p-4'} w-full max-w-full overflow-x-auto`}>
              <div className="flex items-center justify-between flex-wrap min-w-0 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-blue-900 truncate">
                      Number of Questions
                    </label>
                    <span className="text-xs text-blue-700 break-words">
                      Generate multiple problems at once (1-100)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0 overflow-x-auto">
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md min-w-0"
                    onClick={() => onNumQuestionsChange(Math.max(1, numQuestions - 1))}
                    disabled={numQuestions <= 1}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={numQuestions}
                    onChange={val => typeof val === 'number' && onNumQuestionsChange ? onNumQuestionsChange(Math.max(1, Math.min(100, val))) : onNumQuestionsChange?.(1)}
                    min={1}
                    max={100}
                    className="w-16 h-10 sm:w-20 sm:h-12 text-center px-1 sm:px-2 py-1 sm:py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-lg sm:text-xl font-bold bg-white text-blue-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm min-w-0"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md min-w-0"
                    onClick={() => onNumQuestionsChange(Math.min(100, numQuestions + 1))}
                    disabled={numQuestions >= 100}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Only show the internal config header for pdftext mode */}
          {variant === 'pdftext' && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                <span className="text-yellow-500">⚙️</span>
                Configuration Options
              </h2>
            </div>
          )}
          
          {/* Rest of the original OptionPanel content */}
          <div className="w-full px-1 sm:px-0 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
              {/* Total number of tiles */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 col-span-1 sm:col-span-2 transition-all duration-200 hover:bg-gray-50 hover:shadow-md w-full max-w-full">
                <label className="block text-sm font-medium text-black mb-2 sm:mb-3 break-words">
                  Total number of tiles
                  <span className="block text-xs text-gray-600 mt-1 font-normal">
                    (Min 8, Max 15)
                  </span>
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('totalCount', -1, 8, 15)}
                    disabled={options.totalCount <= 8}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={options.totalCount}
                    onChange={val => typeof val === 'number' ? handleChange('totalCount', Math.max(8, Math.min(15, val))) : handleChange('totalCount', 8)}
                    min={8}
                    max={15}
                    className="w-16 h-10 sm:w-20 sm:h-12 text-center px-1 sm:px-2 py-1 sm:py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 text-lg sm:text-xl font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('totalCount', 1, 8, 15)}
                    disabled={options.totalCount >= 15}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Operators Section with animated card content */}
              <div className="col-span-1 sm:col-span-2 w-full max-w-full">
                <div className={
                  options.operatorMode === 'random'
                    ? "bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md w-full max-w-full"
                    : "bg-gray-50 border border-gray-300 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md space-y-2 sm:space-y-3 w-full max-w-full"
                }>
                  {/* Heading row with toggle and (if specific) total badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-black">
                      {options.operatorMode === 'random' ? 'Number of operators (Random)' : 'Specify operators'}
                    </span>
                    <div className="flex items-center gap-2 justify-end sm:justify-start flex-wrap min-w-0 overflow-x-auto w-full">
                      {/* Total badge (specific mode only) */}
                      <span className={`text-sm font-medium text-yellow-900 bg-white px-2 py-1 rounded transition-all duration-300 ${options.operatorMode === 'specific' ? 'opacity-100 scale-100 ml-0' : 'opacity-0 scale-90 ml-[-8px] pointer-events-none select-none'} min-w-0 truncate`}
                        style={{ minWidth: options.operatorMode === 'specific' ? 'auto' : 0 }}>
                        Total: {options.operatorCount}
                      </span>
                      {/* Toggle */}
                      <label htmlFor={switchId} className="flex items-center cursor-pointer select-none group ml-2 min-w-0">
                        <span className="mr-2 text-lg">
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
                          <div className={`block w-12 h-6 rounded-full transition-colors duration-200 border-2 ${options.operatorMode === 'specific' ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-300 border-gray-400'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${options.operatorMode === 'specific' ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="ml-2 text-sm font-semibold text-yellow-900 whitespace-nowrap">
                          {options.operatorMode === 'specific' ? 'Specific' : 'Random'}
                        </span>
                      </label>
                    </div>
                  </div>
                  {/* Animated card content */}
                  <div className="relative min-h-[60px] sm:min-h-[80px]">
                    <AnimatedCardContent 
                      mode={options.operatorMode} 
                      operatorCount={options.operatorCount} 
                      handleStep={handleStep} 
                      handleChange={handleChange} 
                      maxOperators={maxOperators} 
                      options={options} 
                      onOptionsChange={onOptionsChange}
                    />
                  </div>
                </div>
              </div>

              {/* Number of equals signs */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md w-full max-w-full">
                <label className="block text-sm font-medium text-black mb-2 sm:mb-3 break-words">
                  Number of <span className="font-bold">=</span> signs
                </label>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-200 hover:bg-orange-300 text-orange-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('equalsCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1))}
                    disabled={options.equalsCount <= 0}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={options.equalsCount}
                    onChange={val => typeof val === 'number' ? handleChange('equalsCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1), val))) : handleChange('equalsCount', 0)}
                    min={0}
                    max={Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1)}
                    className="w-12 h-8 sm:w-16 sm:h-10 text-center px-1 sm:px-2 py-1 sm:py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm sm:text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-200 hover:bg-orange-300 text-orange-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('equalsCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1))}
                    disabled={options.equalsCount >= Math.max(0, options.totalCount - options.operatorCount - options.heavyNumberCount - options.BlankCount - options.zeroCount - 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Number of heavy numbers */}
              <div className="bg-gray-50 border border-gray-300 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md w-full max-w-full">
                <label className="block text-sm font-medium text-black mb-2 sm:mb-3 break-words">
                  Number of heavy numbers
                  <span className="block text-xs text-gray-600 mt-1 font-normal">
                    (10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
                  </span>
                </label>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('heavyNumberCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1))}
                    disabled={options.heavyNumberCount <= 0}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={options.heavyNumberCount}
                    onChange={val => typeof val === 'number' ? handleChange('heavyNumberCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1), val))) : handleChange('heavyNumberCount', 0)}
                    min={0}
                    max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1)}
                    className="w-12 h-8 sm:w-16 sm:h-10 text-center px-1 sm:px-2 py-1 sm:py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-sm sm:text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('heavyNumberCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1))}
                    disabled={options.heavyNumberCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.BlankCount - options.zeroCount - 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Number of Blank */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md w-full max-w-full">
                <label className="block text-sm font-medium text-black mb-2 sm:mb-3 break-words">
                  Number of Blank
                  <span className="block text-xs text-gray-600 mt-1 font-normal">
                    (?) Can be any value
                  </span>
                </label>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('BlankCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
                    disabled={options.BlankCount <= 0}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={options.BlankCount}
                    onChange={val => typeof val === 'number' ? handleChange('BlankCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1), val))) : handleChange('BlankCount', 0)}
                    min={0}
                    max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
                    className="w-12 h-8 sm:w-16 sm:h-10 text-center px-1 sm:px-2 py-1 sm:py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 text-sm sm:text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-sm sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('BlankCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1))}
                    disabled={options.BlankCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.zeroCount - 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {/* Number of zeros */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md w-full max-w-full">
                <label className="block text-sm font-medium text-black mb-2 sm:mb-3 break-words">
                  Number of zeros
                  <span className="block text-xs text-gray-600 mt-1 font-normal">
                    (Zero - special rules apply)
                  </span>
                </label>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('zeroCount', -1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1))}
                    disabled={options.zeroCount <= 0}
                  >
                    −
                  </button>
                  <InputNumberBox
                    value={options.zeroCount}
                    onChange={val => typeof val === 'number' ? handleChange('zeroCount', Math.max(0, Math.min(Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1), val))) : handleChange('zeroCount', 0)}
                    min={0}
                    max={Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1)}
                    className="w-16 h-10 text-center px-2 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 text-lg font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
                  />
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => handleStep('zeroCount', 1, 0, Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1))}
                    disabled={options.zeroCount >= Math.max(0, options.totalCount - options.operatorCount - options.equalsCount - options.heavyNumberCount - options.BlankCount - 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// เพิ่ม helper สำหรับ operatorFixed
function getOperatorFixed(options: EquationAnagramOptions) {
  return options.operatorFixed ?? { '+': null, '-': null, '×': null, '÷': null };
}

function AnimatedCardContent({
  mode, operatorCount, handleStep, handleChange, maxOperators, options, onOptionsChange
}: {
  mode: 'random' | 'specific';
  operatorCount: number;
  handleStep: (field: keyof EquationAnagramOptions, step: number, min: number, max: number) => void;
  handleChange: (field: keyof EquationAnagramOptions, value: number | string) => void;
  maxOperators: number;
  options: EquationAnagramOptions;
  onOptionsChange: (opts: EquationAnagramOptions) => void;
}) {
  const [show, setShow] = useState<'random' | 'specific'>(mode);
  const [fade, setFade] = useState<'in' | 'out'>('in');
  const operatorFixed = getOperatorFixed(options);
  
  useEffect(() => {
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
              className="w-10 h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              onClick={() => handleStep('operatorCount', -1, 1, maxOperators)}
              disabled={options.operatorCount <= 1}
            >
              −
            </button>
            <InputNumberBox
              value={options.operatorCount}
              onChange={val => typeof val === 'number' ? handleChange('operatorCount', Math.max(1, Math.min(maxOperators, val))) : handleChange('operatorCount', 1)}
              min={1}
              max={maxOperators}
              className="w-20 h-12 text-center px-2 py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 text-xl font-bold bg-white text-green-900 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none shadow-sm"
            />
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              onClick={() => handleStep('operatorCount', 1, 1, maxOperators)}
              disabled={options.operatorCount >= maxOperators}
            >
              +
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mt-2 w-full min-w-0">
            {/* Plus + */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-200 group w-full min-w-0">
              <div className="flex items-center justify-between mb-3 flex-wrap min-w-0 w-full gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-green-800 min-w-0 truncate">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">+</div>
                  Addition
                </label>
                <label className="relative inline-flex items-center cursor-pointer min-w-0 flex-shrink flex-nowrap">
                  <input type="checkbox"
                    checked={typeof operatorFixed['+'] === 'number'}
                    onChange={e => {
                      const next = { ...operatorFixed, '+': e.target.checked ? (operatorFixed['+'] || 0) : null };
                      onOptionsChange({ ...options, operatorFixed: next });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-green-400 rounded-full transition-colors duration-200"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200"></div>
                  <span className="ml-2 text-xs font-medium text-green-700 truncate">Fixed</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-green-200 hover:bg-green-300 text-green-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['+'] || 0;
                    if (current > 0) {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '+': current - 1 } });
                    }
                  }}
                  disabled={typeof operatorFixed['+'] !== 'number' || (operatorFixed['+'] || 0) <= 0}
                >
                  −
                </button>
                <InputNumberBox
                  value={typeof operatorFixed['+'] === 'number' ? operatorFixed['+'] : ''}
                  onChange={val => {
                    if (typeof val === 'number') {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '+': val } });
                    } else {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '+': 0 } });
                    }
                  }}
                  min={0}
                  className="w-14 h-8 text-center px-2 py-1 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 text-sm font-bold bg-white text-green-900 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={typeof operatorFixed['+'] !== 'number'}
                  placeholder={typeof operatorFixed['+'] !== 'number' ? '?' : ''}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-green-200 hover:bg-green-300 text-green-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['+'] || 0;
                    onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '+': current + 1 } });
                  }}
                  disabled={typeof operatorFixed['+'] !== 'number'}
                >
                  +
                </button>
              </div>
            </div>
            {/* Minus - */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200 hover:border-red-300 hover:shadow-md transition-all duration-200 group w-full min-w-0">
              <div className="flex items-center justify-between mb-3 flex-wrap min-w-0 w-full gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-red-800 min-w-0 truncate">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">−</div>
                  Subtraction
                </label>
                <label className="relative inline-flex items-center cursor-pointer min-w-0 flex-shrink flex-nowrap">
                  <input type="checkbox"
                    checked={typeof operatorFixed['-'] === 'number'}
                    onChange={e => {
                      const next = { ...operatorFixed, '-': e.target.checked ? (operatorFixed['-'] || 0) : null };
                      onOptionsChange({ ...options, operatorFixed: next });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-red-400 rounded-full transition-colors duration-200"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200"></div>
                  <span className="ml-2 text-xs font-medium text-red-700 truncate">Fixed</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-red-200 hover:bg-red-300 text-red-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['-'] || 0;
                    if (current > 0) {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '-': current - 1 } });
                    }
                  }}
                  disabled={typeof operatorFixed['-'] !== 'number' || (operatorFixed['-'] || 0) <= 0}
                >
                  −
                </button>
                <InputNumberBox
                  value={typeof operatorFixed['-'] === 'number' ? operatorFixed['-'] : ''}
                  onChange={val => {
                    if (typeof val === 'number') {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '-': val } });
                    } else {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '-': 0 } });
                    }
                  }}
                  min={0}
                  className="w-14 h-8 text-center px-2 py-1 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 text-sm font-bold bg-white text-red-900 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={typeof operatorFixed['-'] !== 'number'}
                  placeholder={typeof operatorFixed['-'] !== 'number' ? '?' : ''}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-red-200 hover:bg-red-300 text-red-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['-'] || 0;
                    onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '-': current + 1 } });
                  }}
                  disabled={typeof operatorFixed['-'] !== 'number'}
                >
                  +
                </button>
              </div>
            </div>
            {/* Multiply × */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group w-full min-w-0">
              <div className="flex items-center justify-between mb-3 flex-wrap min-w-0 w-full gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 min-w-0 truncate">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">×</div>
                  Multiplication
                </label>
                <label className="relative inline-flex items-center cursor-pointer min-w-0 flex-shrink flex-nowrap">
                  <input type="checkbox"
                    checked={typeof operatorFixed['×'] === 'number'}
                    onChange={e => {
                      const next = { ...operatorFixed, '×': e.target.checked ? (operatorFixed['×'] || 0) : null };
                      onOptionsChange({ ...options, operatorFixed: next });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-blue-400 rounded-full transition-colors duration-200"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200"></div>
                  <span className="ml-2 text-xs font-medium text-blue-700 truncate">Fixed</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['×'] || 0;
                    if (current > 0) {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '×': current - 1 } });
                    }
                  }}
                  disabled={typeof operatorFixed['×'] !== 'number' || (operatorFixed['×'] || 0) <= 0}
                >
                  −
                </button>
                <InputNumberBox
                  value={typeof operatorFixed['×'] === 'number' ? operatorFixed['×'] : ''}
                  onChange={val => {
                    if (typeof val === 'number') {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '×': val } });
                    } else {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '×': 0 } });
                    }
                  }}
                  min={0}
                  className="w-14 h-8 text-center px-2 py-1 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm font-bold bg-white text-blue-900 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={typeof operatorFixed['×'] !== 'number'}
                  placeholder={typeof operatorFixed['×'] !== 'number' ? '?' : ''}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['×'] || 0;
                    onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '×': current + 1 } });
                  }}
                  disabled={typeof operatorFixed['×'] !== 'number'}
                >
                  +
                </button>
              </div>
            </div>
            {/* Divide ÷ */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 group w-full min-w-0">
              <div className="flex items-center justify-between mb-3 flex-wrap min-w-0 w-full gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-orange-800 min-w-0 truncate">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">÷</div>
                  Division
                </label>
                <label className="relative inline-flex items-center cursor-pointer min-w-0 flex-shrink flex-nowrap">
                  <input type="checkbox"
                    checked={typeof operatorFixed['÷'] === 'number'}
                    onChange={e => {
                      const next = { ...operatorFixed, '÷': e.target.checked ? (operatorFixed['÷'] || 0) : null };
                      onOptionsChange({ ...options, operatorFixed: next });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-orange-400 rounded-full transition-colors duration-200"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200"></div>
                  <span className="ml-2 text-xs font-medium text-orange-700 truncate">Fixed</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-orange-200 hover:bg-orange-300 text-orange-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['÷'] || 0;
                    if (current > 0) {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '÷': current - 1 } });
                    }
                  }}
                  disabled={typeof operatorFixed['÷'] !== 'number' || (operatorFixed['÷'] || 0) <= 0}
                >
                  −
                </button>
                <InputNumberBox
                  value={typeof operatorFixed['÷'] === 'number' ? operatorFixed['÷'] : ''}
                  onChange={val => {
                    if (typeof val === 'number') {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '÷': val } });
                    } else {
                      onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '÷': 0 } });
                    }
                  }}
                  min={0}
                  className="w-14 h-8 text-center px-2 py-1 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm font-bold bg-white text-orange-900 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={typeof operatorFixed['÷'] !== 'number'}
                  placeholder={typeof operatorFixed['÷'] !== 'number' ? '?' : ''}
                />
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-orange-200 hover:bg-orange-300 text-orange-800 font-bold text-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  onClick={() => {
                    const current = operatorFixed['÷'] || 0;
                    onOptionsChange({ ...options, operatorFixed: { ...operatorFixed, '÷': current + 1 } });
                  }}
                  disabled={typeof operatorFixed['÷'] !== 'number'}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {/* Warning if total is 0 */}
          {operatorCount === 0 && (
            <div className="text-xs text-red-600 text-center mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
              ⚠️ Please select at least 1 operator
            </div>
          )}
        </>
      )}
    </div>
  );
}