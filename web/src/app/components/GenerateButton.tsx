import React from 'react';
import Button from '../ui/Button';

interface GenerateButtonProps {
  onGenerate?: () => void;
  isGenerating?: boolean;
  showChoicePopup: boolean;
}

export default function GenerateButton({ onGenerate, isGenerating, showChoicePopup }: GenerateButtonProps) {
  if (!onGenerate) return null;

  return (
    <div className={`flex justify-center mt-2 ${showChoicePopup ? 'blur-sm opacity-60' : ''}`}>
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
          <span>Generate Problem</span>
        )}
      </Button>
    </div>
  );
}
