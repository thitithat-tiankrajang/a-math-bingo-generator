import React, { useState } from 'react';
import type { EquationAnagramResult } from "@/app/types/EquationAnagram";

interface ExampleSolutionProps {
  result: EquationAnagramResult;
  showChoicePopup: boolean;
}

export default function ExampleSolution({ result, showChoicePopup }: ExampleSolutionProps) {
  const [showExampleSolution, setShowExampleSolution] = useState(false);
  const [showMoreEquations, setShowMoreEquations] = useState(false);

  if (!result.sampleEquation) {
    return null;
  }

  return (
    <>
      {/* Example Solution Section */}
      <div className={`space-y-3 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
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

      {/* Other Solutions Section */}
      {showExampleSolution &&
        result.possibleEquations &&
        result.possibleEquations.length > 1 && (
          <div className={`space-y-4 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
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
    </>
  );
}
