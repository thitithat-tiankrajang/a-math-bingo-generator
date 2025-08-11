import React from 'react';
import type { EquationAnagramResult } from "@/app/types/EquationAnagram";

interface ProblemStatsProps {
  result: EquationAnagramResult;
  showChoicePopup: boolean;
}

export default function ProblemStats({ result, showChoicePopup }: ProblemStatsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
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
  );
}
