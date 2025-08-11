// src/app/play/page.tsx
'use client';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import EquationAnagramGenerator from '@/app/components/EquationAnagramGenerator';
import { useAuth } from '@/app/contexts/AuthContext';
import { assignmentService, type Assignment, type CurrentOptionSetInfo } from '@/app/lib/assignmentService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

// Component that uses useSearchParams
function PlayPageContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [checkingAssignment, setCheckingAssignment] = useState(true);
  const [currentSetInfo, setCurrentSetInfo] = useState<CurrentOptionSetInfo | null>(null);
  // no state needed for exit; we use localStorage directly

  // Helpers to manage exit flag per user
  const getExitKey = useCallback(() => {
    const uid = user?.user?.id || 'anonymous';
    return `assignment_exit_${uid}`;
  }, [user]);

  const saveExitFlag = useCallback((flag: boolean) => {
    try {
      localStorage.setItem(getExitKey(), flag ? '1' : '0');
    } catch {}
  }, [getExitKey]);

  const checkActiveAssignment = useCallback(async () => {
    try {
      setCheckingAssignment(true);
      const preferredId = searchParams.get('assignmentId');

      // If user previously exited assignment mode, and no explicit assignmentId, skip assignment flow
      if (!preferredId) {
        try {
          const raw = localStorage.getItem(getExitKey());
          const exited = raw === '1';
          if (exited) {
            setActiveAssignment(null);
            setCurrentSetInfo(null);
            return;
          }
        } catch {}
      }

      if (preferredId) {
        // Load specific assignment (student-scoped), auto-start if TODO
        try {
          // Explicit assignment selection overrides exit flag
          saveExitFlag(false);
          const { assignment } = await assignmentService.getStudentAssignment(user!.user.id, preferredId);
          const target: Assignment | null = assignment || null;
          // If assignment is already complete/done, redirect to summary
          if (target && (target.studentProgress?.status === 'complete' || target.studentProgress?.status === 'done')) {
            router.replace(`/assignment/${target.id}`);
            setActiveAssignment(null);
            setCurrentSetInfo(null);
            return;
          }
          // No need to start assignment - user can play immediately
          // Just load the assignment as is
          setActiveAssignment(target);
          if (target) {
            const info = await assignmentService.getCurrentOptionSet(target.id, user!.user.id);
            setCurrentSetInfo(info);
          } else {
            setCurrentSetInfo(null);
          }
        } catch (err) {
          console.error('Failed to load preferred assignment:', err);
          setActiveAssignment(null);
          setCurrentSetInfo(null);
        }
      } else {
        // Fallback: Get user's assignments and find in-progress; else auto-start first TODO
        const response = await assignmentService.getAssignmentsByRole(
          user!.user,
          undefined,
          1,
          10
        );
        // Find any available assignment (inprogress or todo)
        const target: Assignment | null = response.assignments.find(a => 
          a.studentProgress?.status === 'inprogress' || a.studentProgress?.status === 'todo'
        ) || null;
        // If the only assignments are complete/done, do not enter play mode
        if (!target) {
          setActiveAssignment(null);
          setCurrentSetInfo(null);
          return;
        }
        setActiveAssignment(target || null);
        if (target) {
          try {
            const info = await assignmentService.getCurrentOptionSet(target.id, user!.user.id);
            setCurrentSetInfo(info);
          } catch (err) {
            console.error('Failed to load current option set:', err);
            setCurrentSetInfo(null);
          }
        } else {
          setCurrentSetInfo(null);
        }
      }
    } catch (error) {
      console.error('Error checking active assignment:', error);
    } finally {
      setCheckingAssignment(false);
    }
  }, [user, searchParams, getExitKey, saveExitFlag]);

  // Check for active assignment when page loads
  useEffect(() => {
    if (isAuthenticated && user?.user?.id) {
      checkActiveAssignment();
    }
  }, [isAuthenticated, user, checkActiveAssignment]);

  const handleSendAnswer = async (questionText: string, answerText: string) => {
    if (!activeAssignment || !user) return;

    try {
      // No need to start assignment - user can submit answers immediately

      // Find next question number (or use existing answer count + 1)
      const currentAnswerCount = activeAssignment.studentProgress?.answers?.length || 0;
      const questionNumber = currentAnswerCount + 1;

      const { studentProgress } = await assignmentService.submitAnswer(
        activeAssignment.id,
        user.user.id,
        {
          questionNumber,
          questionText,
          answerText
        }
      );

      // Refresh assignment and current set info
      await checkActiveAssignment();

      // Auto-exit if assignment is completed (use response from submitAnswer)
      if (studentProgress.status === 'complete') {
        // Mark exit so next visits are normal mode
        saveExitFlag(true);
        setActiveAssignment(null);
        setCurrentSetInfo(null);
        return;
      }
      
      // No alert in assignment flow; auto-progress silently
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExitAssignment = () => {
    // Persist exit so subsequent visits to /play are normal mode
    saveExitFlag(true);
    setActiveAssignment(null);
    setCurrentSetInfo(null);
    router.push('/play');
  };

  // Fallback enforced options if current-set API not available
  const enforcedOptionsToUse = useMemo(() => {
    return (
      currentSetInfo?.currentSet?.options ||
      (activeAssignment?.optionSets &&
        activeAssignment.studentProgress &&
        activeAssignment.optionSets[activeAssignment.studentProgress.currentQuestionSet]?.options) ||
      undefined
    );
  }, [currentSetInfo, activeAssignment]);

  // Persist current question elements if backend has none but we have generated ones
  const handlePersistCurrentElements = useCallback(async (elements: string[]) => {
    try {
      if (!activeAssignment || !user) return;
      await assignmentService.setCurrentQuestionElements(activeAssignment.id, user.user.id, elements);
      // refresh current-set to include persisted elements
      const info = await assignmentService.getCurrentOptionSet(activeAssignment.id, user.user.id);
      setCurrentSetInfo(info);
    } catch (e) {
      console.error('Failed to persist current question elements:', e);
      // Don't throw error - just log it and continue
    }
  }, [activeAssignment, user]);

  if (isLoading || checkingAssignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access the equation anagram generator.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-900 py-8">
      <div className="container mx-auto px-4">
        {/* Assignment Status Bar */}
        {activeAssignment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-900">Assignment Mode</span>
                </div>
                <div className="text-blue-700">
                  <span className="font-semibold">{activeAssignment.title}</span>
                  <span className="mx-2">•</span>
                  <span>
                    Progress: {activeAssignment.studentProgress?.answeredQuestions || 0}/{activeAssignment.totalQuestions}
                  </span>
                  {currentSetInfo?.currentSet && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Set {currentSetInfo.currentSetIndex + 1}/{currentSetInfo.totalSets} ({currentSetInfo.questionsCompleted}/{currentSetInfo.currentSet?.numQuestions})</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/assignment/${activeAssignment.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View Assignment
                </Link>
                <button
                  onClick={handleExitAssignment}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                >
                  Exit Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        <EquationAnagramGenerator 
          assignmentMode={!!activeAssignment}
          onSendAnswer={activeAssignment ? handleSendAnswer : undefined}
          activeAssignment={activeAssignment}
          enforcedOptions={enforcedOptionsToUse}
          presetElements={currentSetInfo?.currentSet ? (currentSetInfo.currentQuestionElements || null) : null}
          onPersistElements={handlePersistCurrentElements}
        />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <PlayPageContent />
    </Suspense>
  );
}
