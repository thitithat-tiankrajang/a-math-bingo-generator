import React from 'react';

interface ChoiceSelectionPopupProps {
  isVisible: boolean;
  choiceTokens: string[];
  currentChoiceStep: number;
  onChoiceSelection: (token: string, choice: string) => void;
  onReset: () => void;
}

export default function ChoiceSelectionPopup({
  isVisible,
  choiceTokens,
  currentChoiceStep,
  onChoiceSelection,
  onReset
}: ChoiceSelectionPopupProps) {
  if (!isVisible) return null;

  const renderChoiceButtons = () => {
    const currentToken = choiceTokens[currentChoiceStep];
    
    if (currentToken === '+/-') {
      return (
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => onChoiceSelection('+/-', '+')}
            className="group flex-1 py-2 px-3 rounded-lg border-2 border-green-400 bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <div className="text-green-700 font-bold text-center">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">+</div>
              <div className="text-xs font-semibold">Plus</div>
            </div>
          </button>
          <button
            onClick={() => onChoiceSelection('+/-', '-')}
            className="group flex-1 py-2 px-3 rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <div className="text-red-700 font-bold text-center">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">-</div>
              <div className="text-xs font-semibold">Minus</div>
            </div>
          </button>
        </div>
      );
    }
    
    if (currentToken === '×/÷') {
      return (
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => onChoiceSelection('×/÷', '×')}
            className="group flex-1 py-2 px-3 rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <div className="text-blue-700 font-bold text-center">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">×</div>
              <div className="text-xs font-semibold">Multiply</div>
            </div>
          </button>
          <button
            onClick={() => onChoiceSelection('×/÷', '÷')}
            className="group flex-1 py-2 px-3 rounded-lg border-2 border-purple-400 bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <div className="text-purple-700 font-bold text-center">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">÷</div>
              <div className="text-xs font-semibold">Divide</div>
            </div>
          </button>
        </div>
      );
    }
    
    if (currentToken === '?') {
      return (
        <div className="mb-4 max-h-48 overflow-y-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200 shadow-inner mb-2">
            <h4 className="text-center text-xs font-semibold text-green-700 mb-1">Numbers (0-20)</h4>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 21}, (_, i) => i).map(num => (
                <button
                  key={num}
                  onClick={() => onChoiceSelection('?', num.toString())}
                  className="group py-1 px-1 text-xs rounded border border-green-300 bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 font-bold transition-all duration-200 transform hover:scale-110 hover:shadow-md active:scale-95"
                >
                  <span className="group-hover:scale-110 transition-transform inline-block">{num}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-2 border border-orange-200 shadow-inner">
            <h4 className="text-center text-xs font-semibold text-orange-700 mb-1">Operators</h4>
            <div className="flex gap-1 justify-center">
              {['+', '-', '×', '÷', '='].map(op => (
                <button
                  key={op}
                  onClick={() => onChoiceSelection('?', op)}
                  className="group py-1 px-2 rounded border border-orange-400 bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 font-bold text-xs transition-all duration-200 transform hover:scale-110 hover:shadow-lg active:scale-95"
                >
                  <span className="group-hover:scale-125 transition-transform inline-block">{op}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };



  return (
    <>
      {/* Popup positioned at top-right, compact and responsive */}
      <div className="fixed z-50 p-2" style={{
        top: '10px',
        right: '10px',
        maxWidth: '320px',
        maxHeight: 'calc(100vh - 20px)',
        overflow: 'auto'
      }}>
        <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-xl p-3 w-72 max-w-full border-2 border-purple-300 relative transform animate-in fade-in zoom-in duration-300">
          
          {/* Progress dots */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border border-gray-200">
              {choiceTokens.map((token, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 mb-1 ${
                      index < currentChoiceStep 
                        ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-md scale-110' 
                        : index === currentChoiceStep 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg scale-125 animate-pulse' 
                        : 'bg-gray-300 scale-90'
                    }`}
                  />
                  <span className={`text-xs font-medium transition-colors ${
                    index === currentChoiceStep ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    {token}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-200 to-orange-200 px-3 py-1 rounded-full border-2 border-orange-300 shadow-lg mb-2">
              <span className="text-lg mr-2 animate-bounce">🎯</span>
              <span className="font-bold text-orange-800 text-sm">
                Choose for: <span className="text-lg font-black text-purple-700">{choiceTokens[currentChoiceStep]}</span>
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Step {currentChoiceStep + 1} of {choiceTokens.length}
            </p>
          </div>

          {/* Choice buttons */}
          <div className="mb-4">
            {renderChoiceButtons()}
          </div>

          {/* Cancel button */}
          <div className="text-center">
            <button
              onClick={onReset}
              className="group px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 font-semibold rounded-lg border border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 text-sm"
            >
              <span className="flex items-center gap-1">
                <span className="text-sm group-hover:rotate-12 transition-transform">❌</span>
                Cancel
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}