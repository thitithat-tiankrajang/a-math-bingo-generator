// src/components/DisplayBox.tsx
import type { MathBingoResult } from "@/app/types/mathBingo";
import { useState, useEffect } from "react";
import { AMATH_TOKENS } from "@/app/lib/mathBingoLogic";

interface DisplayBoxProps {
  result: MathBingoResult | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

// ฟังก์ชันกำหนดสีของ element ตามประเภท
function getElementStyle(element: string): string {
  // ตัวเลขเบา (0-9)
  if (/^[0-9]$/.test(element)) {
    return "bg-green-100 text-green-900 border-2 border-green-300 shadow-sm";
  }

  // ตัวเลขหนัก (10-20)
  if (/^(1[0-9]|20)$/.test(element)) {
    return "bg-green-200 text-green-900 border-2 border-green-300 shadow-sm";
  }

  // เครื่องหมายคำนวณพื้นฐาน
  if (["+", "-", "×", "÷"].includes(element)) {
    return "bg-yellow-100 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // เครื่องหมายทางเลือก
  if (["+/-", "×/÷"].includes(element)) {
    return "bg-yellow-150 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // เครื่องหมาย =
  if (element === "=") {
    return "bg-yellow-200 text-yellow-900 border-2 border-yellow-300 shadow-sm";
  }

  // Blank ?
  if (element === "?") {
    return "bg-yellow-200 text-yellow-900 border-2 border-yellow-400 shadow-sm";
  }

  // default
  return "bg-green-50 text-green-900 border-2 border-green-100 shadow-sm";
}

// ฟังก์ชันกำหนดป้ายชื่อประเภท
function getElementTypeLabel(element: string): string {
  if (/^[0-9]$/.test(element)) return "Light number";
  if (/^(1[0-9]|20)$/.test(element)) return "Heavy number";
  if (["+", "-", "×", "÷"].includes(element)) return "Operator";
  if (["+/-", "×/÷"].includes(element)) return "Choice operator";
  if (element === "=") return "Equals";
  if (element === "?") return "Blank";
  return "Unknown";
}

export default function DisplayBox({
  result,
  onGenerate,
  isGenerating,
}: DisplayBoxProps) {
  const [showMoreEquations, setShowMoreEquations] = useState(false);
  // Summary/operator details toggle with localStorage persistence
  const [showSummary, setShowSummary] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('bingo_show_summary');
      return stored === 'true' ? true : false;
    }
    return false;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bingo_show_summary', showSummary ? 'true' : 'false');
    }
  }, [showSummary]);

  return (
    <div className="bg-green-100 rounded-lg shadow-lg p-6 border border-green-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-green-900">
            🎯 DS Bingo Problem
          </h2>
          {result && (
            <div className="text-sm text-green-800 bg-yellow-100 px-3 py-1 rounded-full">
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
              ${
                isGenerating
                  ? "bg-yellow-300 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 active:bg-green-700 hover:scale-105"
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
              <h3 className="text-lg font-semibold text-green-900 border-b pb-2">
                Problem Set
              </h3>
              {/* Tile rack: responsive layout */}
              <div
                className={
                  result.elements.length >= 15
                    ? 'hidden lg:grid grid-cols-15 gap-3 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative'
                    : 'flex flex-wrap gap-2 sm:gap-3 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative'
                }
                style={result.elements.length >= 15 ? { gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' } : {}}
              >
                {result.elements.map((element, index) => (
                  <div
                    key={index}
                    className={
                      result.elements.length >= 15
                        ? 'relative aspect-square min-w-[32px] w-10 lg:w-12 xl:w-14 flex items-center justify-center rounded text-xs lg:text-sm xl:text-base font-bold transform transition-all duration-200 hover:scale-105 hover:shadow-md ' + getElementStyle(element)
                        : 'relative aspect-square min-w-[48px] w-16 sm:w-14 md:w-16 flex items-center justify-center rounded text-lg sm:text-xl md:text-2xl font-bold transform transition-all duration-200 hover:scale-105 hover:shadow-md ' + getElementStyle(element)
                    }
                    title={getElementTypeLabel(element)}
                  >
                    <div className="text-center w-full relative z-10">
                      {element}
                    </div>
                    {/* แสดงลำดับที่ของเบี้ยที่มุมขวาบน (Tile index at top-right corner) */}
                    {/* <div className="absolute -top-2 -right-2 bg-white text-xs text-green-700 px-1 rounded-full border text-center min-w-[20px]">
                      {index + 1}
                    </div> */}
                    {/* แสดง point ที่มุมขวาล่าง */}
                    <div className="absolute bottom-0.5 right-1 text-xs text-black font-bold opacity-70 select-none pointer-events-none">
                      {AMATH_TOKENS[element as keyof typeof AMATH_TOKENS]?.point ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* แสดงตัวอย่างสมการ */}
            {result.sampleEquation && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-900 border-b pb-2">
                  Example Solution
                </h3>
                <div className="text-center bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-lg border border-green-200">
                  <p className="text-2xl font-mono font-bold text-green-900">
                    {result.sampleEquation}
                  </p>
                </div>
              </div>
            )}

            {/* แสดงสถิติ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* จำนวนสมการที่พบ */}
              {result.possibleEquations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {result.possibleEquations.length}
                  </div>
                  <div className="text-sm text-green-800">
                    Possible equations
                  </div>
                </div>
              )}

              {/* จำนวน tokens */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                <div className="text-2xl font-bold text-yellow-900">
                  {result.elements.length}
                </div>
                <div className="text-sm text-yellow-800">
                  Numbers and operators
                </div>
              </div>

              {/* ระดับความยาก */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-900">
                  {result.elements.length <= 8
                    ? "Easy"
                    : result.elements.length <= 12
                    ? "Medium"
                    : "Hard"}
                </div>
                <div className="text-sm text-green-800">Difficulty</div>
              </div>
            </div>

            {/* Summary & Operator Details Toggle */}
            {(() => {
              // Count types from result.elements
              const counts = {
                total: result.elements.length,
                light: 0,
                heavy: 0,
                zero: 0,
                operator: 0,
                equals: 0,
                blank: 0,
                plus: 0,
                minus: 0,
                multiply: 0,
                divide: 0,
              };
              result.elements.forEach((el) => {
                if (el === '0') counts.zero++;
                else if (/^[1-9]$/.test(el)) counts.light++;
                else if (/^(1[0-9]|20)$/.test(el)) counts.heavy++;
                else if (el === '+') { counts.operator++; counts.plus++; }
                else if (el === '-') { counts.operator++; counts.minus++; }
                else if (el === '×') { counts.operator++; counts.multiply++; }
                else if (el === '÷') { counts.operator++; counts.divide++; }
                else if (el === '=') counts.equals++;
                else if (el === '?') counts.blank++;
                // ignore choice tokens for now
              });
              const lightNumberCount = counts.light;
              return (
                <>
                  <div className="flex justify-end mt-4">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${showSummary ? 'bg-green-200 text-green-900 hover:bg-green-300' : 'bg-white text-green-700 hover:bg-green-100'}`}
                      onClick={() => setShowSummary((v) => !v)}
                    >
                      {showSummary ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  {showSummary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                      <h3 className="text-lg font-semibold text-green-900 mb-2 text-center">Summary</h3>
                      <div className="grid grid-cols-3 gap-4 text-base md:text-lg">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.total}</div>
                          <div className="text-gray-700 font-medium mt-1">Total tiles</div>
                        </div>
                        <div className={`text-center p-3 rounded-lg ${lightNumberCount >= 0 ? 'bg-white' : 'bg-red-50'}`}> 
                          <div className={`font-extrabold text-2xl md:text-3xl ${lightNumberCount >= 0 ? 'text-black' : 'text-red-600'}`}>{lightNumberCount}</div>
                          <div className="text-gray-700 font-medium mt-1">Light numbers (1-9)</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.heavy}</div>
                          <div className="text-gray-700 font-medium mt-1">Heavy numbers (10-20)</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.zero}</div>
                          <div className="text-gray-700 font-medium mt-1">Zeros</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.operator}</div>
                          <div className="text-gray-700 font-medium mt-1">Operators</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.equals}</div>
                          <div className="text-gray-700 font-medium mt-1">Equals (=)</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg col-span-3">
                          <div className="font-extrabold text-2xl md:text-3xl text-black">{counts.blank}</div>
                          <div className="text-gray-700 font-medium mt-1">Blank (?)</div>
                        </div>
                      </div>
                      {/* Operator Details if any operator present */}
                      {counts.operator > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h4 className="text-lg font-semibold text-green-900 mb-2 text-center">Operator Details</h4>
                          <div className="grid grid-cols-4 gap-3 text-base md:text-lg">
                            <div className="text-center p-2 bg-green-50 rounded-lg">
                              <div className="font-extrabold text-xl md:text-2xl text-green-700">{counts.plus}</div>
                              <div className="text-green-700 font-bold text-lg md:text-xl">+</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded-lg">
                              <div className="font-extrabold text-xl md:text-2xl text-red-700">{counts.minus}</div>
                              <div className="text-red-700 font-bold text-lg md:text-xl">−</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                              <div className="font-extrabold text-xl md:text-2xl text-blue-700">{counts.multiply}</div>
                              <div className="text-blue-700 font-bold text-lg md:text-xl">×</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded-lg">
                              <div className="font-extrabold text-xl md:text-2xl text-orange-700">{counts.divide}</div>
                              <div className="text-orange-700 font-bold text-lg md:text-xl">÷</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {/* แสดงสมการเพิ่มเติม (ถ้ามี) - ใช้ state แทน details */}
            {result.possibleEquations &&
              result.possibleEquations.length > 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-green-900">
                      Other solutions ({result.possibleEquations.length - 1}{" "}
                      equations)
                    </h3>
                    <button
                      onClick={() => setShowMoreEquations(!showMoreEquations)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${showSummary ? 'bg-green-200 text-green-900 hover:bg-green-300' : 'bg-white text-green-700 hover:bg-green-100'}`}
                    >
                      {showMoreEquations ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* แสดงสมการเพิ่มเติมด้วย smooth transition */}
                  <div
                    className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${
                    showMoreEquations
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }
                `}
                  >
                    <div className="grid gap-2 pt-2">
                      {result.possibleEquations
                        .slice(1, 6)
                        .map((equation, index) => (
                          <div 
                            key={index} 
                            className="bg-amber-100 p-3 rounded border border-amber-400 font-mono text-center text-black shadow-sm hover:bg-amber-200 transition-colors duration-150"
                          >
                            {equation}
                          </div>
                        ))}
                      {result.possibleEquations.length > 6 && (
                        <div className="text-center text-green-700 text-sm py-2">
                          and {result.possibleEquations.length - 6} more
                          equations...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-green-500 text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold mb-2">
              Start generating DS Bingo problems
            </h3>
            <p className="mb-4">Press &quot;Generate Problem&quot; to start</p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
              <p className="text-sm text-green-800 font-medium">DS Bingo</p>
              <p className="text-xs text-green-600 mt-1">
                Is a set of numbers and operators that can be arranged into at
                least one valid equation according to Math rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
