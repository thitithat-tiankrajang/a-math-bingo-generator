import React from 'react';
import type { TilePiece } from '@/app/types/TilePiece';

interface AnswerFeedbackProps {
  answerFeedback: { type: 'success' | 'error'; message: string } | null;
  assignmentMode?: boolean;
  onSubmitAnswer?: (questionText: string, answerText: string) => Promise<void>;
  isSubmittingAnswer: boolean;
  activeAssignment?: {
    id: string;
    studentProgress?: {
      answers?: Array<{
        questionNumber: number;
        questionText: string;
        answerText: string;
        answeredAt: string;
      }>;
    };
  } | null;
  finalizeEquation: () => string;
  answerTiles: (TilePiece | null)[];
  onValidEquation?: (equation: string) => void;
  setAnswerFeedback: (feedback: { type: 'success' | 'error'; message: string } | null) => void;
  setIsSubmittingAnswer: (submitting: boolean) => void;
}

export default function AnswerFeedback({
  answerFeedback,
}: AnswerFeedbackProps) {
  if (!answerFeedback) return null;

  return (
    <div className={`
      p-4 rounded-lg border-2 text-center font-medium
      ${answerFeedback.type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
      }
    `}>
      {answerFeedback.message}
      
      {/* In assignment mode, auto-submission is handled upstream; no manual submit button */}
    </div>
  );
}
