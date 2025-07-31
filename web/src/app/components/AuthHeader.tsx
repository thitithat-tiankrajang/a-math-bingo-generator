'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import LoginForm from './LoginForm';
import UserProfile from './UserProfile';

export default function AuthHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mb-6">
        <UserProfile />
      </div>
    );
  }

  return (
    <div className="mb-6">
      {showLoginForm ? (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowLoginForm(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <LoginForm onSuccess={() => setShowLoginForm(false)} />
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Equation Anagram Generator</h3>
            <p className="text-gray-600 mb-4">Sign in to access all features</p>
            <button
              onClick={() => setShowLoginForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 