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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-green-800 rounded-lg shadow-md p-6 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-green-100 mb-6">Please log in to view your assignments.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {user?.user?.role === 'admin' ? 'Assignment Management' : 'My Assignments'}
          </h1>
          <p className="text-green-100">
            {user?.user?.role === 'admin' 
              ? 'Create and manage assignments for your students.' 
              : 'Track your progress and complete your assignments.'
            }
          </p>
          {user?.user?.role === 'admin' && (
            <Link
              href="/allassignment"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Assignment
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-green-100">Loading assignments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={() => loadAssignments()}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-green-800/50 border border-green-700 rounded-lg p-6 max-w-md mx-auto">
              <BookOpen size={64} className="text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Assignments</h3>
              <p className="text-green-100 mb-4">
                {user?.user?.role === 'admin' 
                  ? 'No assignments have been created yet.' 
                  : 'You don\'t have any assignments at the moment.'
                }
              </p>
              {user?.user?.role === 'admin' && (
                <Link
                  href="/allassignment"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  <div className="bg-green-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform group-hover:-translate-y-1 overflow-hidden border border-green-700">
                    {/* Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                          {assignment.title}
                        </h3>
                        {isAdmin ? (
                          <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-purple-200 text-purple-800 border-purple-300">
                            <span className="mr-1">👨‍🏫</span>
                            Admin
                          </div>
                        ) : (
                          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(progress?.status || 'todo')}`}>
                            <span className="mr-1">{getStatusIcon(progress?.status || 'todo')}</span>
                            {getStatusText(progress?.status || 'todo')}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-green-100 text-sm mb-4 line-clamp-2">
                        {assignment.description}
                      </p>

                      {/* Progress/Statistics Section */}
                      {isAdmin ? (
                        /* Admin Statistics */
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-green-100">สถิตินักเรียน</span>
                            <span className="text-sm text-green-200">
                              {statistics?.totalStudents || 0} คน
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-200 rounded p-2 text-center">
                              <div className="font-medium text-gray-800">{statistics?.statusBreakdown?.todo || 0}</div>
                              <div className="text-gray-600">ยังไม่เริ่ม</div>
                            </div>
                            <div className="bg-blue-200 rounded p-2 text-center">
                              <div className="font-medium text-blue-800">{statistics?.statusBreakdown?.inprogress || 0}</div>
                              <div className="text-blue-600">กำลังทำ</div>
                            </div>
                            <div className="bg-green-200 rounded p-2 text-center">
                              <div className="font-medium text-green-800">{statistics?.statusBreakdown?.complete || 0}</div>
                              <div className="text-green-600">Complete</div>
                            </div>
                            <div className="bg-purple-200 rounded p-2 text-center">
                              <div className="font-medium text-purple-800">{statistics?.statusBreakdown?.done || 0}</div>
                              <div className="text-purple-600">Checked</div>
                            </div>
                          </div>
                          {statistics?.completionRate !== undefined && (
                            <div className="mt-2 text-center text-sm text-green-200">
                              อัตราเสร็จสิ้น: {statistics.completionRate}%
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Student Progress */
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-green-100">ความคืบหน้า</span>
                            <span className="text-sm text-green-200">
                              {progress?.answeredQuestions || 0} / {assignment.totalQuestions} ข้อ
                            </span>
                          </div>
                          <div className="w-full bg-green-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressPercentage === 100
                                  ? 'bg-green-400'
                                  : progressPercentage > 0
                                  ? 'bg-blue-400'
                                  : 'bg-green-600'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className="text-right text-xs text-green-300 mt-1">
                            {progressPercentage}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-green-700 border-t border-green-600">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-200">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          กำหนดส่ง: {new Date(assignment.dueDate).toLocaleDateString('th-TH')}
                        </div>
                        {isOverdue && (
                          <span className="text-red-400 font-medium text-xs">
                            เลยกำหนด
                          </span>
                        )}
                      </div>

                      {!isAdmin && progress?.status === 'complete' && (
                        <div className="mt-2 text-xs text-green-300 font-medium">
                          <CheckCircle size={16} className="inline mr-1" />
                          Completed on {new Date(progress.completedAt!).toLocaleDateString('en-US')}
                        </div>
                      )}

                      {!isAdmin && progress?.status === 'done' && (
                        <div className="mt-2 text-xs text-purple-300 font-medium">
                          <Target size={16} className="inline mr-1" />
                          Checked on {new Date(progress.markedDoneAt!).toLocaleDateString('en-US')}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-2 text-xs text-green-200">
                          คลิกเพื่อดูรายละเอียดและจัดการงาน
                        </div>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg pointer-events-none transition-colors" />
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
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg bg-green-800 shadow-md text-white disabled:opacity-50 hover:bg-green-700 transition-colors border border-green-600"
                >
                  ก่อนหน้า
                </button>
                <span className="px-4 py-2 text-green-100">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg bg-green-800 shadow-md text-white disabled:opacity-50 hover:bg-green-700 transition-colors border border-green-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
