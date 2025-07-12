// src/components/MathBingoGenerator.tsx
'use client';

import { useState } from 'react';
import DisplayBox from './DisplayBox';
import OptionBox from './OptionBox';
import ActionBox from './ActionBox';
import { generateMathBingo } from '@/app/lib/mathBingoLogic';
import type { MathBingoOptions, MathBingoResult } from '@/app/types/mathBingo';

export default function MathBingoGenerator() {
  const [options, setOptions] = useState<MathBingoOptions>({
    totalCount: 8,
    operatorMode: 'random',    // Default to random mode
    operatorCount: 2,
    equalsCount: 1,
    heavyNumberCount: 0,
    BlankCount: 0,
    zeroCount: 0
  });

  const [result, setResult] = useState<MathBingoResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOptionsChange = (newOptions: MathBingoOptions) => {
    setOptions(newOptions);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedResult = await generateMathBingo(options);
      setResult(generatedResult);
    } catch (error) {
      console.error('Error generating math bingo:', error);
      // TODO: Add error handling UI
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-8">
      {/* Display Box */}
      <DisplayBox 
        result={result}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-6">
        {/* Option Box */}
        <div className="lg:col-span-3 mb-4 lg:mb-0">
          <OptionBox 
            options={options} 
            onOptionsChange={handleOptionsChange}
          />
        </div>
        
        {/* Action Box */}
        <div className="lg:col-span-2">
          <ActionBox 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}