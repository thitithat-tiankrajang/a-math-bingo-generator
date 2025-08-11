import React from 'react';

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
  answerTiles: any[];
  onValidEquation?: (equation: string) => void;
  setAnswerFeedback: (feedback: { type: 'success' | 'error'; message: string } | null) => void;
  setIsSubmittingAnswer: (submitting: boolean) => void;
}

export default function AnswerFeedback({
  answerFeedback,
  assignmentMode,
  onSubmitAnswer,
  isSubmittingAnswer,
  activeAssignment,
  finalizeEquation,
  answerTiles,
  onValidEquation,
  setAnswerFeedback,
  setIsSubmittingAnswer,
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
