'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUndoRedo } from '@/app/contexts/UndoRedoContext';
import { assignmentService, type Assignment, type StudentProgress } from '@/app/lib/assignmentService';
import { BookOpen, Target, CheckCircle } from 'lucide-react';

// Component for handling assignment card clicks
function AssignmentCard({ 
  assignment, 
  progress, 
  CardContent 
}: { 
  assignment: Assignment; 
  progress?: StudentProgress; 
  CardContent: React.ComponentType; 
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardClick = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const status = progress?.status || 'todo';
      
      if (status === 'todo') {
        // Start assignment and go to play page
        if (!user?.user?.id) {
          throw new Error('User not authenticated');
        }
        await assignmentService.startAssignment(assignment.id, user.user.id);
        router.push(`/play?assignmentId=${assignment.id}`);
      } else if (status === 'inprogress') {
        // Continue playing
        router.push(`/play?assignmentId=${assignment.id}`);
      } else if (status === 'complete' || status === 'done') {
        // View results
        router.push(`/assignment/${assignment.id}`);
      }
    } catch (error) {
      console.error('Error handling assignment card click:', error);
      // Fallback navigation
      const status = progress?.status || 'todo';
      if (status === 'todo' || status === 'inprogress') {
        router.push(`/play?assignmentId=${assignment.id}`);
      } else {
        router.push(`/assignment/${assignment.id}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleCardClick}
      disabled={isProcessing}
      className="block group w-full text-left"
    >
      <CardContent />
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}
    </button>
  );
}

export default function AssignmentPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { clearUndoRedoHandler } = useUndoRedo();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Loading assignments for user:', user?.user);
      console.log('🔵 User role:', user?.user?.role);
      console.log('🔵 Page:', page);
      
              const response = await assignmentService.getAssignmentsByRole(
          { id: user!.user.id, role: user!.user.role },
        undefined, // no status filter for students, search for admins
        page,
        12 // 12 cards per page for nice grid layout
      );
      
      console.log('✅ API Response:', response);
      
      setAssignments(response.assignments);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  // Clear undo/redo handlers for this page
  useEffect(() => {
    clearUndoRedoHandler();
  }, [clearUndoRedoHandler]);

  // Guard: only students can access /assignment pages
  useEffect(() => {
    if (isAuthenticated && user?.user?.role === 'admin') {
      router.replace('/allassignment');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
          console.log('🔍 useEffect triggered with:', {
        isAuthenticated,
        user: user,
        userId: user?.user?.id,
        page,
        condition: isAuthenticated && user?.user?.id
      });
      
      if (isAuthenticated && user?.user?.id) {
      console.log('✅ Condition met - calling loadAssignments');
      loadAssignments();
    } else {
      console.log('❌ Condition not met - not calling loadAssignments');
    }
  }, [isAuthenticated, user, page, loadAssignments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'done':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return '⏳';
      case 'inprogress':
        return '🔄';
      case 'complete':
        return '✅';
      case 'done':
        return <Target size={16} className="text-green-600" />;
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'Not Started';
      case 'inprogress':
        return 'In Progress';
      case 'complete':
        return 'Complete';
      case 'done':
        return 'Checked';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-[var(--brand-dark)] mb-4">Access Denied 🚫</h1>
          <p className="text-[var(--brand-medium)] mb-6">Please log in to view your assignments.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)]">
          <h1 className="text-3xl font-bold text-[var(--brand-dark)] mb-2">
            {user?.user?.role === 'admin' ? '📚 Assignment Management' : '📝 My Assignments'}
          </h1>
          <p className="text-[var(--brand-medium)] text-lg mb-4">
            {user?.user?.role === 'admin' 
              ? 'Create and manage assignments for your students.' 
              : 'Track your progress and complete your assignments.'
            }
          </p>
          {user?.user?.role === 'admin' && (
            <Link
              href="/allassignment"
              className="inline-flex items-center px-6 py-3 bg-[var(--brand)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-medium)] transition-colors shadow-md"
            >
              Create New Assignment
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-[var(--brand-secondary)] max-w-md mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)] mx-auto mb-4"></div>
              <p className="text-[var(--brand-dark)] font-medium">Loading assignments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md mx-auto shadow-xl">
              <p className="text-red-800 mb-4 font-medium">{error}</p>
              <button
                onClick={() => loadAssignments()}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-[var(--brand-secondary)] max-w-md mx-auto">
              <BookOpen size={64} className="text-[var(--brand-accent)] mx-auto mb-4 drop-shadow-md" />
              <h3 className="text-xl font-semibold text-[var(--brand-dark)] mb-2">No Assignments</h3>
              <p className="text-[var(--brand-medium)] mb-4">
                {user?.user?.role === 'admin' 
                  ? 'No assignments have been created yet.' 
                  : 'You don\'t have any assignments at the moment.'
                }
              </p>
              {user?.user?.role === 'admin' && (
                <Link
                  href="/allassignment"
                  className="inline-flex items-center px-6 py-3 bg-[var(--brand)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-medium)] transition-colors shadow-md"
                >
                  Create First Assignment
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Assignment Cards */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {assignments.map((assignment) => {
                const progress = assignment.studentProgress;
                const progressPercentage = progress?.progressPercentage || 0;
                const isOverdue = assignment.isOverdue;
                const isAdmin = user?.user?.role === 'admin';
                const statistics = assignment.statistics;

                const CardContent = () => (
                  <div className="bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform group-hover:-translate-y-1 overflow-hidden border-2 border-[var(--brand-secondary)]">
                    {/* Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-[var(--brand-dark)] group-hover:text-[var(--brand)] transition-colors line-clamp-2">
                          {assignment.title}
                        </h3>
                        {isAdmin ? (
                          <div className="flex items-center px-3 py-1.5 rounded-full text-xs font-medium border-2 bg-purple-100 text-purple-800 border-purple-300">
                            <span className="mr-1">👨‍🏫</span>
                            Admin
                          </div>
                        ) : (
                          <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border-2 ${getStatusColor(progress?.status || 'todo')}`}>
                            <span className="mr-1">{getStatusIcon(progress?.status || 'todo')}</span>
                            {getStatusText(progress?.status || 'todo')}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-[var(--brand-medium)] text-sm mb-4 line-clamp-2">
                        {assignment.description}
                      </p>

                      {/* Progress/Statistics Section */}
                      {isAdmin ? (
                        /* Admin Statistics */
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-[var(--brand-dark)]">📊 สถิตินักเรียน</span>
                            <span className="text-sm text-[var(--brand-medium)] font-semibold">
                              {statistics?.totalStudents || 0} คน
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[var(--brand-accent-light)] rounded-lg p-3 text-center border border-[var(--brand-secondary)]">
                              <div className="font-bold text-[var(--brand-dark)]">{statistics?.statusBreakdown?.todo || 0}</div>
                              <div className="text-[var(--brand-medium)]">ยังไม่เริ่ม</div>
                            </div>
                            <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-200">
                              <div className="font-bold text-blue-800">{statistics?.statusBreakdown?.inprogress || 0}</div>
                              <div className="text-blue-600">กำลังทำ</div>
                            </div>
                            <div className="bg-green-100 rounded-lg p-3 text-center border border-green-200">
                              <div className="font-bold text-green-800">{statistics?.statusBreakdown?.complete || 0}</div>
                              <div className="text-green-600">Complete</div>
                            </div>
                            <div className="bg-purple-100 rounded-lg p-3 text-center border border-purple-200">
                              <div className="font-bold text-purple-800">{statistics?.statusBreakdown?.done || 0}</div>
                              <div className="text-purple-600">Checked</div>
                            </div>
                          </div>
                          {statistics?.completionRate !== undefined && (
                            <div className="mt-3 text-center text-sm text-[var(--brand-dark)] font-medium bg-[var(--brand-secondary)] rounded-lg py-1">
                              อัตราเสร็จสิ้น: {statistics.completionRate}%
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Student Progress */
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-[var(--brand-dark)]">📈 ความคืบหน้า</span>
                            <span className="text-sm text-[var(--brand-medium)] font-semibold">
                              {progress?.answeredQuestions || 0} / {assignment.totalQuestions} ข้อ
                            </span>
                          </div>
                          <div className="w-full bg-[var(--brand-secondary-light)] rounded-full h-3 border border-[var(--brand-secondary)]">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                progressPercentage === 100
                                  ? 'bg-green-500'
                                  : progressPercentage > 0
                                  ? 'bg-[var(--brand)]'
                                  : 'bg-[var(--brand-secondary)]'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className="text-right text-sm text-[var(--brand-dark)] font-medium mt-2">
                            {progressPercentage}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-[var(--brand-accent-light)] border-t-2 border-[var(--brand-secondary)]">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-[var(--brand-dark)]">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">กำหนดส่ง: {new Date(assignment.dueDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        {isOverdue && (
                          <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full">
                            เลยกำหนด
                          </span>
                        )}
                      </div>

                      {!isAdmin && progress?.status === 'complete' && (
                        <div className="mt-2 text-xs text-green-700 font-medium bg-green-100 rounded-lg px-2 py-1">
                          <CheckCircle size={14} className="inline mr-1" />
                          Completed on {new Date(progress.completedAt!).toLocaleDateString('en-US')}
                        </div>
                      )}

                      {!isAdmin && progress?.status === 'done' && (
                        <div className="mt-2 text-xs text-purple-700 font-medium bg-purple-100 rounded-lg px-2 py-1">
                          <Target size={14} className="inline mr-1" />
                          Checked on {new Date(progress.markedDoneAt!).toLocaleDateString('en-US')}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-2 text-xs text-[var(--brand-medium)] font-medium">
                          💼 คลิกเพื่อดูรายละเอียดและจัดการงาน
                        </div>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--brand)] rounded-lg pointer-events-none transition-colors" />
                  </div>
                );

                return isAdmin ? (
                  <Link
                    key={assignment.id}
                    href={`/allassignment/${assignment.id}`}
                    className="block group"
                  >
                    <CardContent />
                  </Link>
                ) : (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    progress={progress}
                    CardContent={CardContent}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white shadow-xl text-[var(--brand-dark)] disabled:opacity-50 hover:bg-[var(--brand-accent-light)] transition-colors border-2 border-[var(--brand-secondary)] font-medium"
                >
                  ← ก่อนหน้า
                </button>
                <span className="px-6 py-2 text-white bg-[var(--brand)] rounded-lg font-medium shadow-md">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white shadow-xl text-[var(--brand-dark)] disabled:opacity-50 hover:bg-[var(--brand-accent-light)] transition-colors border-2 border-[var(--brand-secondary)] font-medium"
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
