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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-300 max-w-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <span className="text-blue-600">⚙️</span>
        ตัวเลือก
      </h2>
      
      <div className="space-y-4">
        {/* จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (ขั้นต่ำ 8 ชุด, สูงสุด 20 ชุด)
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

        {/* จำนวนเครื่องหมายคำนวณ */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนเครื่องหมายคำนวณ
            <span className="block text-xs text-gray-500 mt-1 font-normal">
              (+, −, ×, ÷)
            </span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', -1, 1, Math.max(1, options.totalCount - options.equalsCount - 2))}
              disabled={options.operatorCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.equalsCount - 2)}
              value={options.operatorCount}
              onChange={(e) => handleChange('operatorCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.equalsCount - 2), parseInt(e.target.value) || 1)))}
              className="w-16 h-10 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('operatorCount', 1, 1, Math.max(1, options.totalCount - options.equalsCount - 2))}
              disabled={options.operatorCount >= Math.max(1, options.totalCount - options.equalsCount - 2)}
            >
              +
            </button>
          </div>
        </div>

        {/* จำนวนเครื่องหมาย = */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนเครื่องหมาย <span className="font-bold">=</span>
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', -1, 1, Math.max(1, options.totalCount - options.operatorCount - 2))}
              disabled={options.equalsCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(1, options.totalCount - options.operatorCount - 2)}
              value={options.equalsCount}
              onChange={(e) => handleChange('equalsCount', Math.max(1, Math.min(Math.max(1, options.totalCount - options.operatorCount - 2), parseInt(e.target.value) || 1)))}
              className="w-16 h-10 text-center px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 text-lg font-bold bg-white text-black"
            />
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              onClick={() => handleStep('equalsCount', 1, 1, Math.max(1, options.totalCount - options.operatorCount - 2))}
              disabled={options.equalsCount >= Math.max(1, options.totalCount - options.operatorCount - 2)}
            >
              +
            </button>
          </div>
        </div>

        {/* แสดงจำนวนตัวเลขที่เหลือ */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-xs font-medium text-gray-700 mb-1">จำนวนตัวเลข</p>
          <div className="bg-white rounded-md p-2 border border-teal-100 inline-block min-w-[48px]">
            <span className="text-lg font-bold text-black">{options.totalCount - options.operatorCount - options.equalsCount}</span>
            <span className="text-xs text-gray-500 ml-1">ตัว</span>
          </div>
        </div>
      </div>

      {/* summary ข้อมูล */}
      <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-2 text-center">สรุปการตั้งค่า</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.totalCount}</div>
            <div className="text-gray-600">ชุดทั้งหมด</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.totalCount - options.operatorCount - options.equalsCount}</div>
            <div className="text-gray-600">ตัวเลข</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.operatorCount}</div>
            <div className="text-gray-600">เครื่องหมายคำนวณ</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-black">{options.equalsCount}</div>
            <div className="text-gray-600">เครื่องหมาย =</div>
          </div>
        </div>
      </div>
    </div>
  );
}