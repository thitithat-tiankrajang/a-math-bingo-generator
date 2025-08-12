'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUndoRedo } from '@/app/contexts/UndoRedoContext';
import { assignmentService, type Assignment, type SubmitAnswerData } from '@/app/lib/assignmentService';
import { BookOpen, PartyPopper, AlertTriangle, Target, FileText } from 'lucide-react';


export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { clearUndoRedoHandler } = useUndoRedo();
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<number, { questionText: string; answerText: string }>>({});

  const assignmentId = params.id as string;

  // Clear undo/redo handlers for this page
  useEffect(() => {
    clearUndoRedoHandler();
  }, [clearUndoRedoHandler]);

  useEffect(() => {
    if (isAuthenticated && assignmentId) {
      loadAssignment();
    }
  }, [isAuthenticated, assignmentId]);

  // Guard: only students can access student assignment details
  useEffect(() => {
    if (isAuthenticated && user?.user?.role === 'admin') {
      router.replace('/allassignment');
    }
  }, [isAuthenticated, user, router]);

  const loadAssignment = async () => {
    try {
      setError(null);
      
      // Use the new direct assignment access endpoint
      const response = await assignmentService.getStudentAssignment(
        user!.user.id,
        assignmentId
      );

      setAssignment(response.assignment);

      // Load existing answers into form
      if (response.assignment.studentProgress?.answers) {
        const answerMap: Record<number, { questionText: string; answerText: string }> = {};
        response.assignment.studentProgress.answers.forEach(answer => {
          answerMap[answer.questionNumber] = {
            questionText: answer.questionText,
            answerText: answer.answerText
          };
        });
        setAnswers(answerMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      // Loading handled elsewhere
    }
  };

  const handleStart = async () => {
    if (!assignment || !user) return;

    try {
      setStarting(true);
      await assignmentService.startAssignment(assignment.id, user.user.id);
      
      // Navigate to play page after starting assignment
      router.push('/play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start assignment');
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (questionNumber: number, questionText: string, answerText: string) => {
    if (!assignment || !user || !questionText.trim() || !answerText.trim()) return;

    try {
      setSubmitting(true);
      
      const answerData: SubmitAnswerData = {
        questionNumber,
        questionText: questionText.trim(),
        answerText: answerText.trim()
      };

      await assignmentService.submitAnswer(assignment.id, user.user.id, answerData);
      
      // Update local answers
      setAnswers(prev => ({
        ...prev,
        [questionNumber]: { questionText: questionText.trim(), answerText: answerText.trim() }
      }));

      // Reload assignment to get updated progress
      await loadAssignment();
      
      // Auto-advance to next question if not at the end
      if (questionNumber < assignment.totalQuestions) {
        setCurrentQuestion(questionNumber + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = assignment?.studentProgress;
  const progressPercentage = progress?.progressPercentage || 0;
  const isOverdue = assignment?.isOverdue;
  const canSubmit = progress?.status === 'inprogress' && !isOverdue;
  const isCompleted = progress?.status === 'complete' || progress?.status === 'done';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-3 border-2 border-[var(--brand-secondary)]">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--brand)]"></div>
          <span className="text-[var(--brand-dark)] font-medium">กำลังโหลดงาน...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ต้องเข้าสู่ระบบ</h1>
          <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อดูงานนี้</p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">An Error Occurred</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/assignment')}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Assignments
              </button>
              <button
                onClick={loadAssignment}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <FileText size={64} className="text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assignment Not Found</h1>
          <p className="text-gray-600 mb-6">This assignment doesn&apos;t exist or you don&apos;t have permission to access it</p>
          <button
            onClick={() => router.push('/assignment')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  // If assignment hasn't been started yet
  if (progress?.status === 'todo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <BookOpen size={64} className="text-blue-600 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{assignment.title}</h1>
            <p className="text-gray-600 mb-6 text-lg">{assignment.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{assignment.totalQuestions}</div>
                <div className="text-sm text-blue-800">Total Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-green-800">Due Date</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {isOverdue ? 'Overdue' : 'Active'}
                </div>
                <div className="text-sm text-purple-800">Status</div>
              </div>
            </div>

            {/* Show start/completion timestamps when available */}
            {progress?.startedAt && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-800">Started At</div>
                  <div className="text-lg font-semibold text-blue-900">{new Date(progress.startedAt).toLocaleString()}</div>
                </div>
                {progress?.completedAt && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-800">Completed At</div>
                    <div className="text-lg font-semibold text-green-900">{new Date(progress.completedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}

            {isOverdue ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-red-800">
                  <AlertTriangle size={16} className="inline mr-1" />
                  This assignment is overdue. You may not be able to submit answers.
                </div>
              </div>
            ) : null}

            <button
              onClick={handleStart}
              disabled={starting || isOverdue}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {starting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-8h10a1 1 0 011 1v8a1 1 0 01-1 1H8a1 1 0 01-1-1V7a1 1 0 011-1z" />
                  </svg>
                  Start Assignment
                </>
              )}
            </button>

            <div className="mt-6">
              <button
                onClick={() => router.push('/assignment')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main assignment interface (similar to play page but assignment-focused)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-gray-600">{assignment.description}</p>
            </div>
            <button
              onClick={() => router.push('/assignment')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {progress?.answeredQuestions || 0} / {assignment.totalQuestions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                progress?.status === 'complete' ? 'bg-green-100 text-green-800' :
                progress?.status === 'done' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {progress?.status === 'complete' ? '✅ Complete' :
                 progress?.status === 'done' ? (<><Target size={16} className="inline mr-1" />Done</>) :
                 '🔄 In Progress'}
              </span>
              {isOverdue && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertTriangle size={16} className="inline mr-1" />
                  Overdue
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Assignment Interface */}
        {isCompleted ? (
          /* Completed State */
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <PartyPopper size={64} className="text-green-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignment Completed!</h2>
            <p className="text-gray-600 mb-6">
              You have successfully completed all {assignment.totalQuestions} questions.
              {progress?.status === 'done' && ' Your work has been reviewed.'}
            </p>
            
            {/* Show submitted answers */}
            <div className="text-left max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answers:</h3>
              <div className="space-y-4">
                {progress?.answers?.map((answer) => (
                  <div key={answer.questionNumber} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">
                      Question {answer.questionNumber}: {answer.questionText}
                    </div>
                    <div className="text-gray-700">
                      Answer: {answer.answerText}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(answer.answeredAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Question Interface - Reuse EquationAnagramGenerator style */
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Question {currentQuestion} of {assignment.totalQuestions}
                </h2>
                <div className="flex space-x-2">
                  {Array.from({ length: assignment.totalQuestions }, (_, i) => i + 1).map(qNum => (
                    <button
                      key={qNum}
                      onClick={() => setCurrentQuestion(qNum)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        answers[qNum] 
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : qNum === currentQuestion
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {qNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Form */}
              <QuestionForm
                questionNumber={currentQuestion}
                initialQuestion={answers[currentQuestion]?.questionText || ''}
                initialAnswer={answers[currentQuestion]?.answerText || ''}
                onSubmit={handleSubmitAnswer}
                submitting={submitting}
                canSubmit={canSubmit}
                isOverdue={isOverdue}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Question form component
function QuestionForm({
  questionNumber,
  initialQuestion,
  initialAnswer,
  onSubmit,
  submitting,
  canSubmit,
  isOverdue
}: {
  questionNumber: number;
  initialQuestion: string;
  initialAnswer: string;
  onSubmit: (questionNumber: number, questionText: string, answerText: string) => void;
  submitting: boolean;
  canSubmit: boolean;
  isOverdue?: boolean;
}) {
  const [questionText, setQuestionText] = useState(initialQuestion);
  const [answerText, setAnswerText] = useState(initialAnswer);

  useEffect(() => {
    setQuestionText(initialQuestion);
    setAnswerText(initialAnswer);
  }, [initialQuestion, initialAnswer, questionNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionText.trim() && answerText.trim() && canSubmit) {
      onSubmit(questionNumber, questionText, answerText);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
          Question {questionNumber}
        </label>
        <textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question or problem statement..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
          disabled={!canSubmit}
        />
      </div>

      <div>
        <label htmlFor="answerText" className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer
        </label>
        <textarea
          id="answerText"
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Enter your answer here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={4}
          disabled={!canSubmit}
        />
      </div>

      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">
            <AlertTriangle size={16} className="inline mr-1" />
            This assignment is overdue. You cannot submit new answers.
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!questionText.trim() || !answerText.trim() || submitting || !canSubmit}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Answer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
