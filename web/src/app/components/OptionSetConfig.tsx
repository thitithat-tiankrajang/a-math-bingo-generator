import React from 'react';
import OptionPanel from './OptionPanel';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';

interface OptionSetConfigProps {
  options: EquationAnagramOptions;
  onOptionsChange: (opts: EquationAnagramOptions) => void;
  numQuestions: number;
  onNumQuestionsChange: (n: number) => void;
  onRemove?: () => void;
  setLabel?: string;
  setIndex?: number; // for sessionStorage key
}

export default function OptionSetConfig({ 
  options, 
  onOptionsChange, 
  numQuestions, 
  onNumQuestionsChange, 
  onRemove, 
  setLabel, 
  setIndex 
}: OptionSetConfigProps) {
  return (
    <OptionPanel
      options={options}
      onOptionsChange={onOptionsChange}
      numQuestions={numQuestions}
      onNumQuestionsChange={onNumQuestionsChange}
      onRemove={onRemove}
      setLabel={setLabel}
      setIndex={setIndex}
      collapsible={true}
      variant="pdftext"
    />
  );
}