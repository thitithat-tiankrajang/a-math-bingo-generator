// src/app/play/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import EquationAnagramGenerator from '@/app/components/EquationAnagramGenerator';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  assignmentService,
  type Assignment,
  type CurrentOptionSetInfo,
  type LockedPos, // ✅ NEW
} from '@/app/lib/assignmentService';
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

  /** ✅ NEW: keep lock positions for current question */
  const [currentListPosLock, setCurrentListPosLock] = useState<LockedPos[] | null>(null);

  // Helpers to manage exit flag per user
  const getExitKey = useCallback(() => {
    const uid = user?.user?.id || 'anonymous';
    return `assignment_exit_${uid}`;
  }, [user]);

  const saveExitFlag = useCallback(
    (flag: boolean) => {
      try {
        localStorage.setItem(getExitKey(), flag ? '1' : '0');
      } catch {}
    },
    [getExitKey]
  );

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
            setCurrentListPosLock(null); // ✅ NEW
            return;
          }
        } catch {}
      }

      if (preferredId) {
        // Load specific assignment (student-scoped)
        try {
          // Explicit assignment selection overrides exit flag
          saveExitFlag(false);
          const { assignment } = await assignmentService.getStudentAssignment(
            user!.user.id,
            preferredId
          );
          const target: Assignment | null = assignment || null;

          // If assignment is already complete/done, redirect to summary
          if (
            target &&
            (target.studentProgress?.status === 'complete' ||
              target.studentProgress?.status === 'done')
          ) {
            router.replace(`/assignment/${target.id}`);
            setActiveAssignment(null);
            setCurrentSetInfo(null);
            setCurrentListPosLock(null); // ✅ NEW
            return;
          }

          setActiveAssignment(target);

          if (target) {
            const info = await assignmentService.getCurrentOptionSet(target.id, user!.user.id);
            setCurrentSetInfo(info);

            // ✅ NEW: read lock positions from backend
            setCurrentListPosLock(info.currentQuestionListPosLock ?? null);
          } else {
            setCurrentSetInfo(null);
            setCurrentListPosLock(null); // ✅ NEW
          }
        } catch (err) {
          console.error('Failed to load preferred assignment:', err);
          setActiveAssignment(null);
          setCurrentSetInfo(null);
          setCurrentListPosLock(null); // ✅ NEW
        }
      } else {
        // Fallback: Get user's assignments and find in-progress; else first TODO
        const response = await assignmentService.getAssignmentsByRole(user!.user, undefined, 1, 10);

        const target: Assignment | null =
          response.assignments.find(
            (a) => a.studentProgress?.status === 'inprogress' || a.studentProgress?.status === 'todo'
          ) || null;

        if (!target) {
          setActiveAssignment(null);
          setCurrentSetInfo(null);
          setCurrentListPosLock(null); // ✅ NEW
          return;
        }

        setActiveAssignment(target || null);

        if (target) {
          try {
            const info = await assignmentService.getCurrentOptionSet(target.id, user!.user.id);
            setCurrentSetInfo(info);

            // ✅ NEW
            setCurrentListPosLock(info.currentQuestionListPosLock ?? null);
          } catch (err) {
            console.error('Failed to load current option set:', err);
            setCurrentSetInfo(null);
            setCurrentListPosLock(null); // ✅ NEW
          }
        } else {
          setCurrentSetInfo(null);
          setCurrentListPosLock(null); // ✅ NEW
        }
      }
    } catch (error) {
      console.error('Error checking active assignment:', error);
    } finally {
      setCheckingAssignment(false);
    }
  }, [user, searchParams, getExitKey, saveExitFlag, router]);

  // Check for active assignment when page loads
  useEffect(() => {
    if (isAuthenticated && user?.user?.id) {
      checkActiveAssignment();
    }
  }, [isAuthenticated, user, checkActiveAssignment]);

  /** ✅ UPDATED: accept listPosLock from generator */
  const handleSendAnswer = async (
    questionText: string,
    answerText: string,
    listPosLock?: LockedPos[] | null
  ) => {
    if (!activeAssignment || !user) return;

    try {
      const currentAnswerCount = activeAssignment.studentProgress?.answers?.length || 0;
      const questionNumber = currentAnswerCount + 1;

      const { studentProgress } = await assignmentService.submitAnswer(activeAssignment.id, user.user.id, {
        questionNumber,
        questionText,
        answerText,
        // ✅ NEW: send lock data with answer
        listPosLock: listPosLock ?? currentListPosLock ?? null,
      });

      // Refresh assignment and current set info
      await checkActiveAssignment();

      // Auto-exit if assignment is completed
      if (studentProgress.status === 'complete') {
        saveExitFlag(true);
        setActiveAssignment(null);
        setCurrentSetInfo(null);
        setCurrentListPosLock(null); // ✅ NEW
        return;
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExitAssignment = () => {
    saveExitFlag(true);
    setActiveAssignment(null);
    setCurrentSetInfo(null);
    setCurrentListPosLock(null); // ✅ NEW
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

  /** ✅ UPDATED: persist elements + solutionTokens + listPosLock */
  const handlePersistCurrentElements = useCallback(
    async (elements: string[], listPosLock?: LockedPos[] | null, solutionTokens?: string[] | null) => {
      try {
        if (!activeAssignment || !user) {
          console.warn("⚠️ Cannot persist: missing activeAssignment or user");
          return;
        }

        console.log("💾 handlePersistCurrentElements called:", {
          elementsCount: elements.length,
          lockPosCount: listPosLock?.length ?? 0,
          lockPositions: listPosLock
        });

        // ✅ NEW: keep it locally too (so submitAnswer has fallback)
        setCurrentListPosLock(listPosLock ?? null);

        const response = await assignmentService.setCurrentQuestionElements(
          activeAssignment.id,
          user.user.id,
          elements,
          listPosLock ?? null,
          solutionTokens ?? null
        );

        console.log("✅ Persist response:", response);

        // refresh current-set to include persisted elements & locks
        const info = await assignmentService.getCurrentOptionSet(activeAssignment.id, user.user.id);
        setCurrentSetInfo(info);
        const persistedLockPos = info.currentQuestionListPosLock ?? null;
        setCurrentListPosLock(persistedLockPos);
        
        console.log("✅ Refreshed current set info:", {
          hasElements: !!info.currentQuestionElements,
          hasLockPos: !!persistedLockPos,
          lockPosCount: persistedLockPos?.length ?? 0
        });
      } catch (e) {
        console.error('❌ Failed to persist current question elements:', e);
        // Don't throw - allow user to continue even if persist fails
      }
    },
    [activeAssignment, user]
  );

  if (isLoading || checkingAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-3 border-2 border-[var(--brand-secondary)]">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--brand)]"></div>
          <span className="text-[var(--brand-dark)] font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-xl p-8 border-2 border-[var(--brand-secondary)]">
          <h1 className="text-2xl font-bold text-[var(--brand-dark)] mb-4">Authentication Required 🔐</h1>
          <p className="text-[var(--brand-medium)] mb-6">Please log in to access the equation anagram generator.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-[var(--brand)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-medium)] transition-colors shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] py-8">
      <div className="container mx-auto px-4">
        {/* Assignment Status Bar */}
        {activeAssignment && (
          <div className="bg-white border-2 border-[var(--brand-secondary)] rounded-lg p-6 mb-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[var(--brand)] rounded-full animate-pulse"></div>
                  <span className="font-bold text-[var(--brand-dark)] text-lg">📝 Assignment Mode</span>
                </div>
                <div className="text-[var(--brand-medium)] space-y-1 sm:space-y-0">
                  <div className="font-semibold text-[var(--brand-dark)]">{activeAssignment.title}</div>
                  <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                    <span className="bg-[var(--brand-accent-light)] px-2 py-1 rounded-full text-[var(--brand-dark)] font-medium">
                      Progress: {activeAssignment.studentProgress?.answeredQuestions || 0}/{activeAssignment.totalQuestions}
                    </span>
                    {currentSetInfo?.currentSet && (
                      <span className="bg-[var(--brand-secondary-light)] px-2 py-1 rounded-full text-[var(--brand-dark)] font-medium">
                        Set {currentSetInfo.currentSetIndex + 1}/{currentSetInfo.totalSets} ({currentSetInfo.questionsCompleted}/{currentSetInfo.currentSet?.numQuestions})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/assignment/${activeAssignment.id}`}
                  className="px-3 py-2 bg-[var(--brand)] text-[var(--color-on-brand)] rounded-lg hover:bg-[var(--brand-medium)] transition-colors text-sm font-medium shadow-sm"
                >
                  📊 View Assignment
                </Link>
                <button
                  onClick={handleExitAssignment}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium border-2 border-red-200"
                >
                  🚪 Exit Assignment
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
          presetElements={currentSetInfo?.currentSet ? currentSetInfo.currentQuestionElements || null : null}

          /** ✅ NEW: pass solution tokens to generator */
          presetSolutionTokens={currentSetInfo?.currentSet ? currentSetInfo.currentQuestionSolutionTokens || null : null}

          /** ✅ NEW: pass lock positions to generator */
          presetListPosLock={currentSetInfo?.currentSet ? currentListPosLock : null}

          /** ✅ UPDATED: generator can persist both elements + locks */
          onPersistElements={handlePersistCurrentElements}
        />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-3 border-2 border-[var(--brand-secondary)]">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--brand)]"></div>
            <span className="text-[var(--brand-dark)] font-medium">Loading...</span>
          </div>
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}
