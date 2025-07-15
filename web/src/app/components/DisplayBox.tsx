// src/components/DisplayBox.tsx
import type { EquationAnagramResult } from "@/app/types/EquationAnagram";
import { useState, useEffect } from "react";
import { AMATH_TOKENS } from "@/app/lib/equationAnagramLogic";
import Button from "../ui/Button";

interface DisplayBoxProps {
  result: EquationAnagramResult | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
  currentIndex?: number;
  total?: number;
  setCurrentIndex?: (idx: number) => void;
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
  currentIndex = 0,
  total = 1,
  setCurrentIndex,
}: DisplayBoxProps) {
  const [showMoreEquations, setShowMoreEquations] = useState(false);
  // Summary/operator details toggle with localStorage persistence
  const [showSummary, setShowSummary] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("bingo_show_summary");
      return stored === "true" ? true : false;
    }
    return false;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "bingo_show_summary",
        showSummary ? "true" : "false"
      );
    }
  }, [showSummary]);
  // Local state for Example Solution toggle
  const [showExampleSolution, setShowExampleSolution] = useState(false);

  return (
    <div className="bg-green-100 rounded-lg shadow-lg p-6 border border-green-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-green-900">
            🎯 DASC Bingo Problem
          </h2>
          {result && (
            <div className="text-sm text-green-800 bg-yellow-100 px-3 py-1 rounded-full">
              {result.elements.length} tiles
            </div>
          )}
        </div>
        {/* Navigation for multiple problems */}
        {total > 1 && setCurrentIndex && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-white border border-gray-300 text-green-900 font-semibold disabled:opacity-50"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Prev
            </button>
            <span className="text-green-900 font-medium">
              {currentIndex + 1} / {total}
            </span>
            <button
              className="px-3 py-1 rounded bg-white border border-gray-300 text-green-900 font-semibold disabled:opacity-50"
              onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
            >
              Next
            </button>
          </div>
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
                    ? "hidden lg:grid grid-cols-15 gap-3 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative"
                    : "flex flex-wrap gap-2 sm:gap-3 justify-center p-3 bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 relative"
                }
                style={
                  result.elements.length >= 15
                    ? { gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }
                    : {}
                }
              >
                {result.elements.map((element, index) => (
                  <div
                    key={index}
                    className={
                      result.elements.length >= 15
                        ? "relative aspect-square min-w-[32px] w-10 lg:w-12 xl:w-14 flex items-center justify-center rounded text-xs lg:text-sm xl:text-base font-bold transform transition-all duration-200 hover:scale-105 hover:shadow-md " +
                          getElementStyle(element)
                        : "relative aspect-square min-w-[48px] w-16 sm:w-14 md:w-16 flex items-center justify-center rounded text-lg sm:text-xl md:text-2xl font-bold transform transition-all duration-200 hover:scale-105 hover:shadow-md " +
                          getElementStyle(element)
                    }
                    title={getElementTypeLabel(element)}
                  >
                    <div className="text-center w-full relative z-10">
                      {element}
                    </div>
                    {/* แสดง point ที่มุมขวาล่าง */}
                    <div className="absolute bottom-0.5 right-1 text-xs text-black font-bold opacity-70 select-none pointer-events-none">
                      {AMATH_TOKENS[element as keyof typeof AMATH_TOKENS]
                        ?.point ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ปุ่มสร้างโจทย์ตรงกลางใต้ tile rack */}
            {onGenerate && (
              <div className="flex justify-center mt-2">
                <Button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    color="green"
                    loading={isGenerating}
                    loadingText="Generating problem..."
                    icon={
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    }
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Problem</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Example Solution Section - only show when result exists */}
            {result.sampleEquation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Example Solution
                    </h3>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Primary
                    </div>
                  </div>
                  {/* Toggle for Example Solution */}
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-900 text-sm">
                      Show solutions
                    </span>
                    <label className="flex items-center cursor-pointer select-none group ml-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showExampleSolution}
                          onChange={(e) =>
                            setShowExampleSolution(e.target.checked)
                          }
                          className="sr-only"
                          aria-label="Toggle solution visibility"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors duration-200 border-2 ${
                            showExampleSolution
                              ? "bg-yellow-400 border-yellow-500"
                              : "bg-gray-300 border-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                            showExampleSolution ? "translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-semibold text-yellow-900 whitespace-nowrap">
                        {showExampleSolution ? "ON" : "OFF"}
                      </span>
                    </label>
                  </div>
                </div>
                {showExampleSolution && (
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-6 rounded-xl border-2 border-green-200 shadow-sm transition-all duration-300">
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                        {result.sampleEquation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* แสดงสถิติ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* จำนวนสมการที่พอ */}
              {result.possibleEquations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center hover:bg-green-100 transition-colors duration-200">
                  <div className="text-2xl font-bold text-green-900">
                    {result.possibleEquations.length}
                  </div>
                  <div className="text-sm text-green-800">
                    Possible equations
                  </div>
                </div>
              )}

              {/* จำนวน tokens */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center hover:bg-yellow-100 transition-colors duration-200">
                <div className="text-2xl font-bold text-yellow-900">
                  {result.elements.length}
                </div>
                <div className="text-sm text-yellow-800">
                  Numbers and operators
                </div>
              </div>

              {/* ระดับความยาก */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center hover:bg-green-100 transition-colors duration-200">
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
                if (el === "0") counts.zero++;
                else if (/^[1-9]$/.test(el)) counts.light++;
                else if (/^(1[0-9]|20)$/.test(el)) counts.heavy++;
                else if (el === "+") {
                  counts.operator++;
                  counts.plus++;
                } else if (el === "-") {
                  counts.operator++;
                  counts.minus++;
                } else if (el === "×") {
                  counts.operator++;
                  counts.multiply++;
                } else if (el === "÷") {
                  counts.operator++;
                  counts.divide++;
                } else if (el === "=") counts.equals++;
                else if (el === "?") counts.blank++;
                // ignore choice tokens for now
              });
              const lightNumberCount = counts.light;
              return (
                <>
                  <div className="flex justify-end mt-4">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${
                        showSummary
                          ? "bg-green-200 text-green-900 hover:bg-green-300"
                          : "bg-white text-green-700 hover:bg-green-100"
                      }`}
                      onClick={() => setShowSummary((v) => !v)}
                    >
                      {showSummary ? "Hide Details" : "Show Details"}
                    </button>
                  </div>
                  {showSummary && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Summary Details
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-base md:text-lg">
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.total}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Total tiles
                          </div>
                        </div>
                        <div
                          className={`text-center p-3 rounded-lg shadow-sm ${
                            lightNumberCount >= 0 ? "bg-white" : "bg-red-50"
                          }`}
                        >
                          <div
                            className={`font-extrabold text-2xl md:text-3xl ${
                              lightNumberCount >= 0
                                ? "text-gray-900"
                                : "text-red-600"
                            }`}
                          >
                            {lightNumberCount}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Light numbers (1-9)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.heavy}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Heavy numbers (10-20)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.zero}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Zeros
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.operator}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Operators
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.equals}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Equals (=)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow-sm col-span-3">
                          <div className="font-extrabold text-2xl md:text-3xl text-gray-900">
                            {counts.blank}
                          </div>
                          <div className="text-gray-700 font-medium mt-1">
                            Blank (?)
                          </div>
                        </div>
                      </div>
                      {/* Operator Details if any operator present */}
                      {counts.operator > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                            Operator Details
                          </h4>
                          <div className="grid grid-cols-4 gap-3 text-base md:text-lg">
                            <div className="text-center p-3 bg-green-50 rounded-lg shadow-sm border border-green-200">
                              <div className="font-extrabold text-xl md:text-2xl text-green-700">
                                {counts.plus}
                              </div>
                              <div className="text-green-700 font-bold text-lg md:text-xl">
                                +
                              </div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg shadow-sm border border-red-200">
                              <div className="font-extrabold text-xl md:text-2xl text-red-700">
                                {counts.minus}
                              </div>
                              <div className="text-red-700 font-bold text-lg md:text-xl">
                                −
                              </div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
                              <div className="font-extrabold text-xl md:text-2xl text-blue-700">
                                {counts.multiply}
                              </div>
                              <div className="text-blue-700 font-bold text-lg md:text-xl">
                                ×
                              </div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg shadow-sm border border-orange-200">
                              <div className="font-extrabold text-xl md:text-2xl text-orange-700">
                                {counts.divide}
                              </div>
                              <div className="text-orange-700 font-bold text-lg md:text-xl">
                                ÷
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Other Solutions Section */}
            {showExampleSolution &&
              result.possibleEquations &&
              result.possibleEquations.length > 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Other Solutions
                      </h3>
                      <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                        {result.possibleEquations.length - 1} equations
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMoreEquations(!showMoreEquations)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300 flex items-center gap-2 ${
                        showMoreEquations
                          ? "bg-amber-200 text-amber-900 hover:bg-amber-300"
                          : "bg-white text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      <span>{showMoreEquations ? "Hide" : "Show"}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showMoreEquations ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Show additional equations with smooth transition */}
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
                    <div className="grid gap-3 pt-2">
                      {result.possibleEquations
                        .slice(1, 6)
                        .map((equation, index) => (
                          <div
                            key={index}
                            className="bg-amber-50 p-4 rounded-lg border border-amber-200 font-mono text-center text-gray-900 shadow-sm hover:bg-amber-100 transition-all duration-200 hover:shadow-md"
                          >
                            <span className="text-lg font-semibold">
                              {equation}
                            </span>
                          </div>
                        ))}
                      {result.possibleEquations.length > 6 && (
                        <div className="text-center text-amber-700 text-sm py-3 bg-amber-50 rounded-lg border border-amber-200">
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
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Start generating DS Bingo problems
            </h3>
            <p className="mb-4 text-gray-700">
              Press &quot;Generate Problem&quot; to begin
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
              <p className="text-sm text-green-800 font-medium">DS Bingo</p>
              <p className="text-xs text-green-600 mt-1">
                Is a set of numbers and operators that can be arranged into at
                least one valid equation according to mathematical rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
