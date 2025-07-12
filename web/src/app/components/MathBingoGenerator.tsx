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
    operatorCount: 2,
    equalsCount: 1,
    heavyNumberCount: 1,  // 1 heavy number
    wildcardCount: 0,     // no wildcard
    zeroCount: 0          // no zero
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Display Box */}
      <DisplayBox 
        result={result}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option Box */}
        <OptionBox 
          options={options} 
          onOptionsChange={handleOptionsChange}
        />
        
        {/* Action Box */}
        <ActionBox 
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}