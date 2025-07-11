// src/components/OptionBox.tsx
import type { MathBingoOptions } from '@/app/types/mathBingo';

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        ตัวเลือก
      </h2>
      
      <div className="space-y-4">
        {/* จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด (ขั้นต่ำ 8)
          </label>
          <input
            type="number"
            min="8"
            max="20"
            value={options.totalCount}
            onChange={(e) => handleChange('totalCount', Math.max(8, parseInt(e.target.value) || 8))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* จำนวนเครื่องหมายคำนวณ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนเครื่องหมายคำนวณ (+, -, *, /)
          </label>
          <input
            type="number"
            min="1"
            max={Math.max(1, options.totalCount - options.equalsCount - 2)}
            value={options.operatorCount}
            onChange={(e) => handleChange('operatorCount', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* จำนวนเครื่องหมาย = */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            จำนวนเครื่องหมาย =
          </label>
          <input
            type="number"
            min="1"
            max={Math.max(1, options.totalCount - options.operatorCount - 2)}
            value={options.equalsCount}
            onChange={(e) => handleChange('equalsCount', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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