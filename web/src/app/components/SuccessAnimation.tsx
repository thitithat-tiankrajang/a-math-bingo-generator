import React from 'react';

interface SuccessAnimationProps {
  isVisible: boolean;
  message?: string;
}

export default function SuccessAnimation({ isVisible, message }: SuccessAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-bounce mb-4">
          <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-6xl text-white">🎉</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
          <h2 className="text-3xl font-bold text-green-600 mb-2">Excellent!</h2>
          <p className="text-xl text-gray-700 mb-4">{message || "You solved it correctly!"}</p>
          <div className="flex justify-center space-x-2">
            <span className="animate-pulse text-2xl">✨</span>
            <span className="animate-pulse text-2xl" style={{animationDelay: '0.2s'}}>🌟</span>
            <span className="animate-pulse text-2xl" style={{animationDelay: '0.4s'}}>⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
} 