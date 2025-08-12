'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUndoRedo } from '@/app/contexts/UndoRedoContext';
import { assignmentService } from '@/app/lib/assignmentService';
import { BookOpen, AlertTriangle, Trophy, Medal, Award, Target, Settings } from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { clearUndoRedoHandler } = useUndoRedo();

  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    inProgressAssignments: 0,
    overdueAssignments: 0
  });

  // Clear undo/redo handlers for this page
  useEffect(() => {
    clearUndoRedoHandler();
  }, [clearUndoRedoHandler]);

  useEffect(() => {
    if (isAuthenticated && user?.user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {

      

      // Calculate stats
      const allResponse = await assignmentService.getStudentAssignments(
        user!.user.id,
        undefined,
        1,
        100 // Get all for stats
      );

      const all = allResponse.assignments;
      const completed = all.filter(a => a.studentProgress?.status === 'complete' || a.studentProgress?.status === 'done').length;
      const inProgress = all.filter(a => a.studentProgress?.status === 'inprogress').length;
      const overdue = all.filter(a => a.isOverdue && a.studentProgress?.status !== 'complete' && a.studentProgress?.status !== 'done').length;

      setStats({
        totalAssignments: all.length,
        completedAssignments: completed,
        inProgressAssignments: inProgress,
        overdueAssignments: overdue
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
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
          <h1 className="text-2xl font-bold text-[var(--brand-dark)] mb-4">Welcome! 👋</h1>
          <p className="text-[var(--brand-medium)] mb-6">Please log in to access your dashboard.</p>
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

  const isAdmin = user?.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-medium)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8 bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)]">
          <h1 className="text-3xl font-bold text-[var(--brand-dark)] mb-2">
            Welcome back, {user?.user?.firstName || user?.user?.username}! 👋
          </h1>
          <p className="text-[var(--brand-medium)] text-lg">
            {isAdmin ? 'Manage your assignments and track student progress.' : 'Track your progress and stay on top of your assignments.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)] hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[var(--brand-secondary)] rounded-lg flex items-center justify-center">
                  <BookOpen className="text-[var(--brand-dark)]" size={22} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--brand-medium)]">Total Assignments</p>
                <p className="text-2xl font-bold text-[var(--brand-dark)]">{stats.totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)] hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 text-xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--brand-medium)]">Completed</p>
                <p className="text-2xl font-bold text-[var(--brand-dark)]">{stats.completedAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)] hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[var(--brand-accent)] rounded-lg flex items-center justify-center">
                  <span className="text-[var(--brand-dark)] text-xl">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--brand-medium)]">In Progress</p>
                <p className="text-2xl font-bold text-[var(--brand-dark)]">{stats.inProgressAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)] hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-700" size={22} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--brand-medium)]">Overdue</p>
                <p className="text-2xl font-bold text-[var(--brand-dark)]">{stats.overdueAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        

          {/* Scoreboard Section */}
          <div className="bg-white rounded-lg shadow-xl border-2 border-[var(--brand-secondary)] mb-8">
            <div className="px-6 py-4 border-b border-[var(--brand-secondary)] bg-[var(--brand-accent-light)]">
              <h2 className="text-lg font-semibold text-[var(--brand-dark)]">🏆 Scoreboard</h2>
            </div>
            <div className="p-6">
              {/* Placeholder Scoreboard Table */}
              <div className="text-center py-8">
                <div className="mb-4">
                  <Trophy size={64} className="text-[var(--brand-accent)] mx-auto drop-shadow-md" />
                </div>
                <h3 className="text-xl font-medium text-[var(--brand-dark)] mb-2">Scoreboard Coming Soon</h3>
                <p className="text-[var(--brand-medium)] mb-6">
                  Track your performance and compare with other students.
                </p>
                
                {/* Placeholder Table */}
                <div className="max-w-md mx-auto">
                  <div className="bg-[var(--brand-accent-light)] rounded-lg p-4 border-2 border-dashed border-[var(--brand-secondary)]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-[var(--brand-secondary)] shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Medal className="w-6 h-6 text-yellow-500" />
                          <span className="font-medium text-[var(--brand-dark)]">Top Student</span>
                        </div>
                        <span className="text-[var(--brand-medium)] font-bold">--</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-[var(--brand-secondary)] shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Medal className="w-6 h-6 text-gray-400" />
                          <span className="font-medium text-[var(--brand-dark)]">Second Place</span>
                        </div>
                        <span className="text-[var(--brand-medium)] font-bold">--</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-[var(--brand-secondary)] shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Award className="w-6 h-6 text-orange-400" />
                          <span className="font-medium text-[var(--brand-dark)]">Third Place</span>
                        </div>
                        <span className="text-[var(--brand-medium)] font-bold">--</span>
                      </div>
                      <div className="py-3 px-3 text-center text-[var(--brand-medium)] text-sm">
                        ... more rankings to come
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)]">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-[var(--brand-dark)]">⚡ Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/assignment"
              className="flex items-center p-4 rounded-lg border-2 border-[var(--brand-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-accent-light)] transition-all group shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 bg-[var(--brand-secondary)] rounded-lg flex items-center justify-center mr-4 group-hover:bg-[var(--brand)] transition-colors">
                <BookOpen className="text-[var(--brand-dark)]" size={22} />
              </div>
              <div>
                <h3 className="font-medium text-[var(--brand-dark)]">View Assignments</h3>
                <p className="text-sm text-[var(--brand-medium)]">See all your assignments</p>
              </div>
            </Link>

            <Link
              href="/play"
              className="flex items-center p-4 rounded-lg border-2 border-[var(--brand-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-accent-light)] transition-all group shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 bg-[var(--brand-accent)] rounded-lg flex items-center justify-center mr-4 group-hover:bg-[var(--brand)] transition-colors">
                <Target className="text-[var(--brand-dark)]" size={22} />
              </div>
              <div>
                <h3 className="font-medium text-[var(--brand-dark)]">Practice Mode</h3>
                <p className="text-sm text-[var(--brand-medium)]">Generate practice problems</p>
              </div>
            </Link>

            {isAdmin && (
              <Link
                href="/allassignment"
                className="flex items-center p-4 rounded-lg border-2 border-[var(--brand-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-accent-light)] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-300 transition-colors">
                  <Settings className="text-purple-700" size={22} />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--brand-dark)]">Manage Assignments</h3>
                  <p className="text-sm text-[var(--brand-medium)]">Create and manage assignments</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

  );
}
