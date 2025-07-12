// src/components/DisplayBox.tsx
import type { MathBingoResult } from '@/app/types/mathBingo';
import { useState } from 'react';

interface DisplayBoxProps {
  result: MathBingoResult | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

// ฟังก์ชันกำหนดสีของ element ตามประเภท
function getElementStyle(element: string): string {
  // ตัวเลขเบา (0-9)
  if (/^[0-9]$/.test(element)) {
    return 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm';
  }
  
  // ตัวเลขหนัก (10-20)
  if (/^(1[0-9]|20)$/.test(element)) {
    return 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-sm';
  }
  
  // เครื่องหมายคำนวณพื้นฐาน
  if (['+', '-', '×', '÷'].includes(element)) {
    return 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-sm';
  }
  
  // เครื่องหมายทางเลือก
  if (['+/-', '×/÷'].includes(element)) {
    return 'bg-purple-100 text-purple-800 border-2 border-purple-300 shadow-sm';
  }
  
  // เครื่องหมาย =
  if (element === '=') {
    return 'bg-orange-100 text-orange-800 border-2 border-orange-300 shadow-sm';
  }
  
  // Wildcard ?
  if (element === '?') {
    return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 shadow-sm';
  }
  
  // default
  return 'bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm';
}

// ฟังก์ชันกำหนดป้ายชื่อประเภท
function getElementTypeLabel(element: string): string {
  if (/^[0-9]$/.test(element)) return 'Light number';
  if (/^(1[0-9]|20)$/.test(element)) return 'Heavy number';
  if (['+', '-', '×', '÷'].includes(element)) return 'Operator';
  if (['+/-', '×/÷'].includes(element)) return 'Choice operator';
  if (element === '=') return 'Equals';
  if (element === '?') return 'Wildcard';
  return 'Unknown';
}

export default function DisplayBox({ result, onGenerate, isGenerating }: DisplayBoxProps) {
  const [showMoreEquations, setShowMoreEquations] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">
            🎯 DS Bingo Problem
          </h2>
          {result && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
              {result.elements.length} tiles
            </div>
          )}
        </div>
        
        {/* ปุ่มสร้างโจทย์ที่มุมขวาบน */}
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`
              px-4 py-2 rounded-lg font-medium text-white text-sm
              transition-all duration-200 shadow-md hover:shadow-lg
              flex items-center gap-2 min-w-[120px] justify-center
              ${isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-105'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>🎲</span>
                <span>Generate Problem</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="min-h-32">
        {result ? (
          <div className="space-y-6">
            {/* แสดงชุดตัวเลขและเครื่องหมาย */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Problem Set
              </h3>
              <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {result.elements.map((element, index) => (
                  <div
                    key={index}
                    className={`
                      relative w-14 h-14 flex items-center justify-center
                      rounded-lg text-xl font-bold
                      transform transition-all duration-200 hover:scale-105 hover:shadow-md
                      ${getElementStyle(element)}
                    `}
                    title={getElementTypeLabel(element)}
                  >
                    <div className="text-center w-full">{element}</div>
                    <div className="absolute -top-2 -right-2 bg-white text-xs text-gray-500 px-1 rounded-full border text-center min-w-[20px]">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* แสดงตัวอย่างสมการ */}
            {result.sampleEquation && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Example Solution
                </h3>
                <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-2xl font-mono font-bold text-blue-800 mb-2">
                    {result.sampleEquation}
                  </p>
                  <p className="text-sm text-blue-600">
                    ✅ Mathematically valid equation
                  </p>
                </div>
              </div>
            )}
            
            {/* แสดงสถิติ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* จำนวนสมการที่พบ */}
              {result.possibleEquations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {result.possibleEquations.length}
                  </div>
                  <div className="text-sm text-green-600">
                    Possible equations
                  </div>
                </div>
              )}
              
              {/* จำนวน tokens */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {result.elements.length}
                </div>
                <div className="text-sm text-blue-600">
                  Numbers and operators
                </div>
              </div>
              
              {/* ระดับความยาก */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                <div className="text-2xl font-bold text-purple-800">
                  {result.elements.length <= 8 ? 'Easy' : 
                   result.elements.length <= 12 ? 'Medium' : 'Hard'}
                </div>
                <div className="text-sm text-purple-600">
                  Difficulty
                </div>
              </div>
            </div>
            
            {/* Legend สีต่าง ๆ */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Color Legend
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Light number (0-9)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
                  <span>Heavy number (10-20)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>Operator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                  <span>Choice operator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                  <span>Equals (=)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Wildcard ?</span>
                </div>
              </div>
            </div>
            
            {/* แสดงสมการเพิ่มเติม (ถ้ามี) - ใช้ state แทน details */}
            {result.possibleEquations && result.possibleEquations.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Other solutions ({result.possibleEquations.length - 1} equations)
                  </h3>
                  <button
                    onClick={() => setShowMoreEquations(!showMoreEquations)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${showMoreEquations 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {showMoreEquations ? '🔼 Hide' : '🔽 Show'}
                  </button>
                </div>
                
                {/* แสดงสมการเพิ่มเติมด้วย smooth transition */}
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${showMoreEquations ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}>
                  <div className="grid gap-2 pt-2">
                    {result.possibleEquations.slice(1, 6).map((equation, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 p-3 rounded border font-mono text-center hover:bg-gray-100 transition-colors duration-150"
                      >
                        {equation}
                      </div>
                    ))}
                    {result.possibleEquations.length > 6 && (
                      <div className="text-center text-gray-500 text-sm py-2">
                        and {result.possibleEquations.length - 6} more equations...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold mb-2">Start generating DS Bingo problems</h3>
            <p className="mb-4">Press &quot;Generate Problem&quot; to start</p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium">
                DS Bingo
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Is a set of numbers and operators that can be arranged into at least one valid equation according to Math rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}