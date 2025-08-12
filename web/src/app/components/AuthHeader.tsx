'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import UserProfile from './UserProfile';
import AdminDashboard from './AdminDashboard';

export default function AuthHeader() {
  const { isAuthenticated, isLoading} = useAuth();
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-[var(--brand-secondary)]">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--brand)]"></div>
            <span className="text-[var(--brand-dark)] font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mb-6">
        <UserProfile />
        {showAdminDashboard && (
          <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-[var(--brand-secondary)]">
          <h3 className="text-2xl font-bold text-[var(--brand-dark)] mb-3">Welcome to Equation Anagram Generator</h3>
          <p className="text-[var(--brand-medium)] mb-6 text-lg">Sign in to access all features and start solving math puzzles!</p>
          <div className="flex space-x-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-[var(--brand)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-medium)] transition-colors shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center px-6 py-3 bg-[var(--brand-accent)] text-[var(--color-on-brand)] font-medium rounded-lg hover:bg-[var(--brand-secondary)] transition-colors shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Register
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 