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
          <h1 className="text-2xl font-bold text-white mb-4">Welcome!</h1>
          <p className="text-green-100 mb-6">Please log in to access your dashboard.</p>
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

  const isAdmin = user?.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-green-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user?.firstName || user?.user?.username}! 👋
          </h1>
          <p className="text-green-100">
            {isAdmin ? 'Manage your assignments and track student progress.' : 'Track your progress and stay on top of your assignments.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-800 rounded-lg shadow-md p-6 border border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-blue-700" size={20} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100">Total Assignments</p>
                <p className="text-2xl font-bold text-white">{stats.totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-800 rounded-lg shadow-md p-6 border border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 text-xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-800 rounded-lg shadow-md p-6 border border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-700 text-xl">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100">In Progress</p>
                <p className="text-2xl font-bold text-white">{stats.inProgressAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-800 rounded-lg shadow-md p-6 border border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-700" size={20} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100">Overdue</p>
                <p className="text-2xl font-bold text-white">{stats.overdueAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        

          {/* Scoreboard Section */}
          <div className="bg-green-800 rounded-lg shadow-md border border-green-700">
            <div className="px-6 py-4 border-b border-green-700">
              <h2 className="text-lg font-semibold text-white">Scoreboard</h2>
            </div>
            <div className="p-6">
              {/* Placeholder Scoreboard Table */}
              <div className="text-center center py-8">
                <div className="mb-4">
                  <Trophy size={64} className="text-yellow-400 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Scoreboard Coming Soon</h3>
                <p className="text-green-100 mb-6">
                  Track your performance and compare with other students.
                </p>
                
                {/* Placeholder Table */}
                <div className="max-w-md mx-auto">
                  <div className="bg-green-700 rounded-lg p-4 border-2 border-dashed border-green-600">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 bg-green-800 rounded border border-green-600">
                        <div className="flex items-center space-x-3">
                          <Medal className="w-6 h-6 text-yellow-400" />
                          <span className="font-medium text-green-100">Top Student</span>
                        </div>
                        <span className="text-green-300 font-bold">--</span>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-green-800 rounded border border-green-600">
                        <div className="flex items-center space-x-3">
                          <Medal className="w-6 h-6 text-gray-300" />
                          <span className="font-medium text-green-100">Second Place</span>
                        </div>
                        <span className="text-blue-300 font-bold">--</span>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-green-800 rounded border border-green-600">
                        <div className="flex items-center space-x-3">
                          <Award className="w-6 h-6 text-orange-400" />
                          <span className="font-medium text-green-100">Third Place</span>
                        </div>
                        <span className="text-orange-300 font-bold">--</span>
                      </div>
                      <div className="py-3 px-3 text-center text-green-300 text-sm">
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
        <div className="mt-8 bg-green-800 rounded-lg shadow-md p-6 border border-green-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/assignment"
              className="flex items-center p-4 rounded-lg border border-green-600 hover:border-blue-400 hover:bg-green-700 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-300 transition-colors">
                <BookOpen className="text-blue-700" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">View Assignments</h3>
                <p className="text-sm text-green-100">See all your assignments</p>
              </div>
            </Link>

            <Link
              href="/play"
              className="flex items-center p-4 rounded-lg border border-green-600 hover:border-green-400 hover:bg-green-700 transition-all group"
            >
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-300 transition-colors">
                <Target className="text-green-700" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">Practice Mode</h3>
                <p className="text-sm text-green-100">Generate practice problems</p>
              </div>
            </Link>

            {isAdmin && (
              <Link
                href="/allassignment"
                className="flex items-center p-4 rounded-lg border border-green-600 hover:border-purple-400 hover:bg-green-700 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-300 transition-colors">
                  <Settings className="text-purple-700" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-white">Manage Assignments</h3>
                  <p className="text-sm text-green-100">Create and manage assignments</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

  );
}
