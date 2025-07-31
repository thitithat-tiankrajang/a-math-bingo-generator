// src/app/page.tsx
'use client';
import EquationAnagramGenerator from '@/app/components/EquationAnagramGenerator';
import AuthHeader from '@/app/components/AuthHeader';
import { useAuth } from '@/app/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
        <div className="container mx-auto px-4">
          <AuthHeader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <AuthHeader />
        <EquationAnagramGenerator />
      </div>
    </div>
  );
}