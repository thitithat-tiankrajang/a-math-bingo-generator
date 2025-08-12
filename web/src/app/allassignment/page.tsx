'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUndoRedo } from '@/app/contexts/UndoRedoContext';
import { assignmentService, type Assignment, type CreateAssignmentData, type Student, type OptionSet } from '@/app/lib/assignmentService';
import OptionSetConfig from '@/app/components/OptionSetConfig';
import OptionSetsSummary from '@/app/components/OptionSetsSummary';
import type { OptionSet as UIOptionSet, EquationAnagramOptions } from '@/app/types/EquationAnagram';
import { Input, Button, TextArea, SearchInput } from '@/app/ui';

export default function AllAssignmentPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { clearUndoRedoHandler } = useUndoRedo();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Clear undo/redo handlers for this page
  useEffect(() => {
    clearUndoRedoHandler();
  }, [clearUndoRedoHandler]);

  useEffect(() => {
    if (isAuthenticated && user?.user?.role === 'admin') {
      loadAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, page, search]);

  // Guard: only admins can access /allassignment pages
  useEffect(() => {
    if (isAuthenticated && user?.user?.role !== 'admin') {
      router.replace('/assignment');
    }
  }, [isAuthenticated, user, router]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await assignmentService.getAllAssignments(page, 10, search);
      setAssignments(response.assignments);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (data: CreateAssignmentData) => {
    try {
      setCreating(true);
      await assignmentService.createAssignment(data);
      setShowCreateModal(false);
      await loadAssignments(); // Reload assignments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAssignment = async (assignment: Assignment) => {
    // TODO: Implement edit functionality
    console.log('Edit assignment:', assignment);
    // For now, just show a placeholder
    alert('Edit functionality coming soon!');
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        await assignmentService.deleteAssignment(assignmentId);
        await loadAssignments(); // Reload assignments
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      }
    }
  };

  if (isLoading && !user) {
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
          <p className="text-[var(--brand-medium)] mb-6">Please log in to access assignment management.</p>
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

  if (user?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-xl p-8 border-2 border-[var(--brand-secondary)]">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-[var(--brand-dark)] mb-4">Access Denied</h1>
          <p className="text-[var(--brand-medium)] mb-6">This page is only accessible to administrators.</p>
          <Link
            href="/home"
            className="inline-flex items-center px-6 py-3 bg-[var(--brand)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-medium)] transition-colors shadow-md"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)] mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--brand-dark)] mb-2">🎯 Assignment Management</h1>
              <p className="text-[var(--brand-medium)] text-lg">Create and manage assignments for your students</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="md"
              fullWidth={false}
              className="bg-[var(--brand)] hover:bg-[var(--brand-medium)] text-[var(--color-on-brand)] font-medium shadow-lg border-2 border-[var(--brand-secondary)]"
              icon={
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              ✨ Create Assignment
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <SearchInput
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>
        </div>

        {/* Summary Statistics */}
        {!loading && assignments.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                  <p className="text-2xl font-semibold text-gray-900">{assignments.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {assignments.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} created this week
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.reduce((sum, assignment) => 
                      sum + (assignment.statistics?.statusBreakdown.done || 0), 0
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const totalStudents = assignments.reduce((sum, assignment) => 
                        sum + (assignment.statistics?.totalStudents || 0), 0
                      );
                      const completedStudents = assignments.reduce((sum, assignment) => 
                        sum + (assignment.statistics?.statusBreakdown.done || 0), 0
                      );
                      return totalStudents > 0 ? `${Math.round((completedStudents / totalStudents) * 100)}% completion rate` : 'No students assigned';
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.reduce((sum, assignment) => 
                      sum + (assignment.statistics?.statusBreakdown.inprogress || 0), 0
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const totalStudents = assignments.reduce((sum, assignment) => 
                        sum + (assignment.statistics?.totalStudents || 0), 0
                      );
                      const inProgressStudents = assignments.reduce((sum, assignment) => 
                        sum + (assignment.statistics?.statusBreakdown.inprogress || 0), 0
                      );
                      return totalStudents > 0 ? `${Math.round((inProgressStudents / totalStudents) * 100)}% actively working` : 'No students assigned';
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {assignments.filter(assignment => assignment.isOverdue).length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const overdueAssignments = assignments.filter(assignment => assignment.isOverdue);
                      if (overdueAssignments.length === 0) return 'All on time';
                      const avgOverdue = overdueAssignments.reduce((sum, assignment) => {
                        const now = new Date();
                        const due = new Date(assignment.dueDate);
                        return sum + Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      }, 0) / overdueAssignments.length;
                      return `Avg ${Math.abs(Math.round(avgOverdue))} days overdue`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <Button
              onClick={loadAssignments}
              variant="ghost"
              size="sm"
              fullWidth={false}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {search ? 'No assignments found' : 'No assignments yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {search 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first assignment to get started'
                }
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create First Assignment
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{assignment.description}</div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {assignment.totalQuestions} questions
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {assignment.statistics?.totalStudents || 0} students
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {assignment.statistics?.totalStudents || 0} assigned
                              </span>
                              <span className="text-xs text-gray-500">
                                {assignment.statistics?.completionRate || 0}% complete
                              </span>
                            </div>
                            
                            {/* Progress breakdown */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">✓ Completed</span>
                                <span className="text-gray-600">{assignment.statistics?.statusBreakdown.done || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-600">⏳ In Progress</span>
                                <span className="text-gray-600">{assignment.statistics?.statusBreakdown.inprogress || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">⏸️ Not Started</span>
                                <span className="text-gray-600">{assignment.statistics?.statusBreakdown.todo || 0}</span>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${assignment.statistics?.completionRate || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {/* Main progress bar */}
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${assignment.statistics?.completionRate || 0}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                                {assignment.statistics?.completionRate || 0}%
                              </span>
                            </div>
                            
                            {/* Progress details */}
                            <div className="text-xs text-gray-600">
                              {(() => {
                                const completionRate = assignment.statistics?.completionRate || 0;
                                if (completionRate === 0) {
                                  return <span className="text-gray-500">No students have started yet</span>;
                                } else if (completionRate === 100) {
                                  return <span className="text-green-600 font-medium">All students completed! 🎉</span>;
                                } else if (completionRate >= 75) {
                                  return <span className="text-green-600 font-medium">Great progress! Almost done</span>;
                                } else if (completionRate >= 50) {
                                  return <span className="text-amber-600 font-medium">Good progress, keep going!</span>;
                                } else if (completionRate >= 25) {
                                  return <span className="text-blue-600 font-medium">Making steady progress</span>;
                                } else {
                                  return <span className="text-gray-600">Just getting started</span>;
                                }
                              })()}
                            </div>
                            
                            {/* Time remaining indicator */}
                            {(() => {
                              const now = new Date();
                              const due = new Date(assignment.dueDate);
                              const diffTime = due.getTime() - now.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) {
                                return (
                                  <div className="text-xs text-red-600 font-medium">
                                    ⚠️ {Math.abs(diffDays)} days overdue
                                  </div>
                                );
                              } else if (diffDays <= 3) {
                                return (
                                  <div className="text-xs text-amber-600 font-medium">
                                    ⏰ Due in {diffDays} day{diffDays !== 1 ? 's' : ''}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {/* Status badge */}
                            <div className="flex items-center">
                              {(() => {
                                const completionRate = assignment.statistics?.completionRate || 0;
                                if (completionRate === 100) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Completed
                                    </span>
                                  );
                                } else if (completionRate > 0) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      In Progress
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Not Started
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Creation info */}
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Created {new Date(assignment.createdAt).toLocaleDateString('th-TH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {assignment.updatedAt !== assignment.createdAt && (
                                <div className="flex items-center mt-1">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Updated {new Date(assignment.updatedAt).toLocaleDateString('th-TH', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {/* Due date */}
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(assignment.dueDate).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            
                            {/* Status indicators */}
                            <div className="space-y-1">
                              {assignment.isOverdue && (
                                <div className="text-xs text-red-600 font-medium flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Overdue
                                </div>
                              )}
                              
                              {/* Time remaining indicator */}
                              {(() => {
                                const now = new Date();
                                const due = new Date(assignment.dueDate);
                                const diffTime = due.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  return (
                                    <div className="text-xs text-red-600 font-medium">
                                      {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''} overdue
                                    </div>
                                  );
                                } else if (diffDays === 0) {
                                  return (
                                    <div className="text-xs text-amber-600 font-medium">
                                      Due today!
                                    </div>
                                  );
                                } else if (diffDays === 1) {
                                  return (
                                    <div className="text-xs text-amber-600 font-medium">
                                      Due tomorrow
                                    </div>
                                  );
                                } else if (diffDays <= 7) {
                                  return (
                                    <div className="text-xs text-amber-600 font-medium">
                                      Due in {diffDays} days
                                    </div>
                                  );
                                } else if (diffDays <= 30) {
                                  return (
                                    <div className="text-xs text-blue-600 font-medium">
                                      Due in {diffDays} days
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-xs text-gray-600">
                                      Due in {diffDays} days
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Time details */}
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const due = new Date(assignment.dueDate);
                                const now = new Date();
                                const diffTime = due.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                                } else if (diffDays === 0) {
                                  return 'Due today';
                                } else if (diffDays === 1) {
                                  return 'Due tomorrow';
                                } else if (diffDays <= 7) {
                                  return `Due this week`;
                                } else if (diffDays <= 30) {
                                  return `Due this month`;
                                } else {
                                  return `Due in ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''}`;
                                }
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/allassignment/${assignment.id}`}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium group"
                              title="View and manage assignment details"
                            >
                              <svg className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Manage
                            </Link>
                            
                            <button 
                              onClick={() => handleEditAssignment(assignment)}
                              className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-xs font-medium group"
                              title="Edit assignment details"
                            >
                              <svg className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium group"
                              title="Delete assignment (cannot be undone)"
                            >
                              <svg className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                          
                          {/* Quick stats */}
                          <div className="mt-2 text-xs text-gray-500 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {assignment.statistics?.totalStudents || 0} students
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {assignment.totalQuestions} questions
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <CreateAssignmentModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAssignment}
            submitting={creating}
          />
        )}
      </div>
    </div>
  );
}

// Create Assignment Modal Component
function CreateAssignmentModal({
  onClose,
  onSubmit,
  submitting
}: {
  onClose: () => void;
  onSubmit: (data: CreateAssignmentData) => void;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalQuestions: 1,
    dueDate: ''
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  // Assignment option sets (same model as Print modal)
  const defaultOptions: EquationAnagramOptions = {
    totalCount: 8,
    operatorMode: 'random',
    operatorCount: 2,
    equalsCount: 1,
    heavyNumberCount: 0,
    BlankCount: 0,
    zeroCount: 0,
    operatorCounts: undefined,
    operatorFixed: {
      '+': null,
      '-': null,
      '×': null,
      '÷': null,
      '+/-': null,
      '×/÷': null
    },
    equalsMode: undefined,
    equalsMin: undefined,
    equalsMax: undefined,
    heavyNumberMode: undefined,
    heavyNumberMin: undefined,
    heavyNumberMax: undefined,
    blankMode: undefined,
    blankMin: undefined,
    blankMax: undefined,
    zeroMode: undefined,
    zeroMin: undefined,
    zeroMax: undefined,
    operatorMin: undefined,
    operatorMax: undefined,
    randomSettings: undefined
  };
  const [optionSets, setOptionSets] = useState<UIOptionSet[]>([
    { options: { ...defaultOptions }, numQuestions: 5 }
  ]);

  // Load available students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await assignmentService.getAvailableStudents();
        setAvailableStudents(response.students);
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim() && formData.dueDate && selectedStudents.length > 0) {
      onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        totalQuestions: optionSets.reduce((sum, s) => sum + (s.numQuestions || 0), 0),
        dueDate: formData.dueDate,
        studentIds: selectedStudents,
        optionSets
      });
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Filter students based on search query
  const filteredStudents = availableStudents.filter(student => 
    student.displayName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.school.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const selectAllStudents = () => {
    const allFilteredStudentIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      // Add all filtered students that aren't already selected
      const newSelections = allFilteredStudentIds.filter(id => !prev.includes(id));
      return [...prev, ...newSelections];
    });
  };

  const clearAllStudents = () => {
    setSelectedStudents([]);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto touch-pan-y overscroll-none">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl my-8 pointer-events-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
          <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain">
          <Input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            label="Title *"
            placeholder="Assignment title"
            required
          />

          <TextArea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            label="Description *"
            placeholder="Assignment description"
            required
          />

          {/* Total questions now derived from option sets */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Total Questions</label>
            <span className="text-sm font-semibold text-gray-900">{optionSets.reduce((sum, s) => sum + (s.numQuestions || 0), 0)} questions</span>
          </div>

          <Input
            type="date"
            id="dueDate"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            label="Due Date *"
            min={minDate}
            required
          />

          {/* Option Sets configuration (admin) - identical to Print Text settings */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Option Sets Configuration</h4>
            <div className="mb-3">
              <OptionSetsSummary optionSets={optionSets as unknown as OptionSet[]} />
            </div>
            <div className="space-y-4">
              <OptionSetConfig
                options={optionSets[0].options}
                onOptionsChange={(opts) => {
                  setOptionSets(prev => prev.map((set, i) => i === 0 ? { ...set, options: opts } : set));
                }}
                numQuestions={optionSets[0].numQuestions}
                onNumQuestionsChange={(num) => {
                  setOptionSets(prev => prev.map((set, i) => i === 0 ? { ...set, numQuestions: num } : set));
                }}
                setLabel="Set 1"
                setIndex={0}
              />
              {optionSets.slice(1).map((set, idx) => (
                <OptionSetConfig
                  key={idx + 1}
                  options={set.options}
                  onOptionsChange={(opts) => setOptionSets(prev => prev.map((s, i) => i === idx + 1 ? { ...s, options: opts } : s))}
                  numQuestions={set.numQuestions}
                  onNumQuestionsChange={(num) => setOptionSets(prev => prev.map((s, i) => i === idx + 1 ? { ...s, numQuestions: num } : s))}
                  onRemove={optionSets.length > 1 ? () => setOptionSets(prev => prev.filter((_, i) => i !== idx + 1)) : undefined}
                  setLabel={`Set ${idx + 2}`}
                  setIndex={idx + 1}
                />
              ))}
            </div>
            <Button
              onClick={() => setOptionSets(prev => ([...prev, { options: { ...defaultOptions }, numQuestions: 5, setLabel: `Set ${prev.length + 1}` }]))}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              + Add Option Set
            </Button>
          </div>

          {/* Student Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                มอบหมายให้นักเรียน *
              </label>
              <button
                type="button"
                onClick={() => setShowStudentSelector(!showStudentSelector)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showStudentSelector ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    ซ่อนรายชื่อ
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    เลือกนักเรียน
                  </>
                )}
              </button>
            </div>
            
            {/* Selected Students Summary */}
            <div className="mb-3">
              {selectedStudents.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      เลือกแล้ว {selectedStudents.length} คน
                    </span>
                    <button
                      type="button"
                      onClick={clearAllStudents}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedStudents.map((studentId) => {
                      const student = availableStudents.find(s => s.id === studentId);
                      return student ? (
                        <span
                          key={studentId}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {typeof student.displayName === 'string' ? student.displayName : 
                           `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student'}
                          <button
                            type="button"
                            onClick={() => handleStudentToggle(studentId)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-amber-800">กรุณาเลือกนักเรียนที่จะรับผิดชอบงานนี้</span>
                  </div>
                </div>
              )}
            </div>

            {showStudentSelector && (
              <div className="border border-blue-300 rounded-lg p-4 bg-white">
                {loadingStudents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-3">กำลังโหลดรายชื่อนักเรียน...</p>
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-sm text-gray-500">ไม่พบนักเรียนที่ผ่านการอนุมัติ</p>
                  </div>
                ) : (
                  <>
                    {/* Search for students */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="ค้นหานักเรียน..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={selectAllStudents}
                        className="inline-flex items-center text-xs px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        เลือกทั้งหมด ({filteredStudents.length})
                      </button>
                      <button
                        type="button"
                        onClick={clearAllStudents}
                        className="inline-flex items-center text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        ยกเลิกทั้งหมด
                      </button>
                    </div>

                    {/* Student list */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="space-y-1 p-2">
                        {filteredStudents.map((student) => (
                          <label 
                            key={student.id} 
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleStudentToggle(student.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {typeof student.displayName === 'string' ? student.displayName : 
                                 `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {typeof student.school === 'string' ? student.school : 'Unknown School'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {filteredStudents.length === 0 && studentSearchQuery && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">ไม่พบนักเรียนที่ตรงกับคำค้นหา</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 bg-white sticky bottom-0 -mx-6 -mb-6 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || selectedStudents.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'กำลังสร้าง...' : 'สร้างงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

