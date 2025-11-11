import React from 'react';
import type { AmathToken } from '../types/EquationAnagram';

// แบบจำลอง token info (รับจริงจาก AMATH_TOKENS ผ่าน prop)
interface AmathTokenInfo {
  token: AmathToken;
  count: number;
  type: 'lightNumber' | 'heavyNumber' | 'operator' | 'choice' | 'equals' | 'Blank';
  point: number;
}
export interface TokenCountConfigProps {
  counts: Record<AmathToken, number>;
  onChange: (next: Record<AmathToken, number>) => void;
}

// order/type groupings
const GROUPS: { label: string; type: AmathTokenInfo['type']; color: string; tokens: AmathToken[] }[] = [
  {
    label: 'Light Numbers',
    type: 'lightNumber',
    color: 'green',
    tokens: ['1','2','3','4','5','6','7','8','9','0'],
  },
  {
    label: 'Heavy Numbers',
    type: 'heavyNumber',
    color: 'emerald',
    tokens: ['10','11','12','13','14','15','16','17','18','19','20'],
  },
  {
    label: 'Operators',
    type: 'operator',
    color: 'yellow',
    tokens: ['+','-','×','÷'],
  },
  {
    label: 'Choice',
    type: 'choice',
    color: 'orange',
    tokens: ['+/-','×/÷'],
  },
  {
    label: 'Equals',
    type: 'equals',
    color: 'blue',
    tokens: ['='],
  },
  {
    label: 'Blank',
    type: 'Blank',
    color: 'slate',
    tokens: ['?'],
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TokenCountConfigPanel({counts, onChange}: TokenCountConfigProps) {
  const handleChange = (token: AmathToken, nextCount: number) => {
    onChange({ ...counts, [token]: clamp(nextCount, 0, 30) });
  };

  const colorMap: Record<string, {bg: string; border: string; text: string; button: string}> = {
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200 hover:border-green-300',
      text: 'text-green-800',
      button: 'bg-green-500'
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200 hover:border-emerald-300',
      text: 'text-emerald-800',
      button: 'bg-emerald-500'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      border: 'border-yellow-200 hover:border-yellow-300',
      text: 'text-yellow-900',
      button: 'bg-yellow-500'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200 hover:border-orange-300',
      text: 'text-orange-800',
      button: 'bg-orange-500'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200 hover:border-blue-300',
      text: 'text-blue-800',
      button: 'bg-blue-500'
    },
    slate: {
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
      border: 'border-slate-200 hover:border-slate-300',
      text: 'text-slate-800',
      button: 'bg-slate-500'
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-lg mt-6 mb-6 w-full max-w-full overflow-x-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-indigo-900">Tile Token Counts</h3>
          <p className="text-xs sm:text-sm text-indigo-700">Configure the count for each tile token (0-30)</p>
        </div>
      </div>

      <div className="space-y-5">
        {GROUPS.map(group => {
          const colors = colorMap[group.color];
          return (
            <div key={group.label} className="w-full">
              <div className={`mb-3 font-semibold text-sm sm:text-base ${colors.text} flex items-center gap-2`}>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.button}`}></div>
                {group.label}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 w-full">
                {group.tokens.map(token => (
                  <div 
                    key={token} 
                    className={`${colors.bg} ${colors.border} border-2 rounded-xl p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 group w-full min-w-0`}
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.button} rounded-lg flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-sm group-hover:shadow-md transition-shadow`}>
                        {token}
                      </div>
                      <div className="flex items-center gap-1 w-full justify-center">
                        <button
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${colors.button} bg-opacity-20 hover:bg-opacity-30 ${colors.text} font-bold text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow`}
                          onClick={() => handleChange(token, (counts[token] || 0) - 1)}
                          disabled={(counts[token] || 0) <= 0}
                          type="button"
                        >
                          −
                        </button>
                        <input
                          className={`w-10 sm:w-12 h-7 sm:h-8 px-1 text-center border-2 ${colors.border.split(' ')[0]} rounded-lg font-bold text-sm sm:text-base ${colors.text} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${group.color}-300 bg-white shadow-sm appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                          value={counts[token] || 0}
                          type="number"
                          min={0}
                          max={30}
                          onChange={e => handleChange(token, parseInt(e.target.value) || 0)}
                        />
                        <button
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${colors.button} bg-opacity-20 hover:bg-opacity-30 ${colors.text} font-bold text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow`}
                          onClick={() => handleChange(token, (counts[token] || 0) + 1)}
                          disabled={(counts[token] || 0) >= 30}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}