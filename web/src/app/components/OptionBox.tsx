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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        ตัวเลือก
      </h2>
      
      <div className="space-y-4">
        {/* จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 mb-1 pl-1">
            จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด <span className="text-xs text-gray-400">(ขั้นต่ำ 8)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('totalCount', -1, 8, 20)}
              disabled={options.totalCount <= 8}
            >-</button>
            <input
              type="number"
              min="8"
              max="20"
              value={options.totalCount}
              onChange={(e) => handleChange('totalCount', Math.max(8, Math.min(20, parseInt(e.target.value) || 8)))}
              className="w-20 text-center px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder:text-gray-300 text-base shadow-sm"
            />
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('totalCount', 1, 8, 20)}
              disabled={options.totalCount >= 20}
            >+</button>
          </div>
        </div>

        {/* จำนวนเครื่องหมายคำนวณ */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 mb-1 pl-1">
            จำนวนเครื่องหมายคำนวณ <span className="text-xs text-gray-400">(+, -, ×, ÷)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('operatorCount', -1, 1, Math.max(1, options.totalCount - options.equalsCount - 2))}
              disabled={options.operatorCount <= 1}
            >-</button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.equalsCount - 2)}
              value={options.operatorCount}
              onChange={(e) => handleChange('operatorCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.equalsCount - 2), parseInt(e.target.value) || 1)))}
              className="w-20 text-center px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder:text-gray-300 text-base shadow-sm"
            />
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('operatorCount', 1, 1, Math.max(1, options.totalCount - options.equalsCount - 2))}
              disabled={options.operatorCount >= Math.max(1, options.totalCount - options.equalsCount - 2)}
            >+</button>
          </div>
        </div>

        {/* จำนวนเครื่องหมาย = */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 mb-1 pl-1">
            จำนวนเครื่องหมาย <span className="text-xs text-gray-400">=</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('equalsCount', -1, 1, Math.max(1, options.totalCount - options.operatorCount - 2))}
              disabled={options.equalsCount <= 1}
            >-</button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.operatorCount - 2)}
              value={options.equalsCount}
              onChange={(e) => handleChange('equalsCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.operatorCount - 2), parseInt(e.target.value) || 1)))}
              className="w-20 text-center px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition placeholder:text-gray-300 text-base shadow-sm"
            />
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold disabled:opacity-50"
              onClick={() => handleStep('equalsCount', 1, 1, Math.max(1, options.totalCount - options.operatorCount - 2))}
              disabled={options.equalsCount >= Math.max(1, options.totalCount - options.operatorCount - 2)}
            >+</button>
          </div>
        </div>

        {/* แสดงจำนวนตัวเลขที่เหลือ */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            จำนวนตัวเลข: {options.totalCount - options.operatorCount - options.equalsCount} ตัว
          </p>
        </div>
      </div>
    </div>
  );
}