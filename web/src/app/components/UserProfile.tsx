'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Button from '@/app/ui/Button';
import AdminDashboard from './AdminDashboard';

export default function UserProfile() {
  const { user, logout, isAuthenticated, token } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending count for admin
  React.useEffect(() => {
    // console.log('🔍 UserProfile - User data:', user);
    // console.log('🔍 UserProfile - User role:', user?.user?.role);
    // console.log('🔍 UserProfile - User status:', user?.user?.status);
    // console.log('🔍 UserProfile - Is authenticated:', isAuthenticated);
    
    if (user?.user?.role === 'admin') {
      // console.log('🔍 UserProfile - Admin detected, fetching pending count...');
      fetchPendingCount();
    } else {
      // console.log('🔍 UserProfile - Not admin or no user');
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      // console.log('🔍 UserProfile - Fetching pending count...');
      // console.log('🔍 UserProfile - Token from AuthContext:', token);
      
      const response = await fetch('http://localhost:3001/auth/admin/students/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // console.log('🔍 UserProfile - API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log('🔍 UserProfile - API response data:', data);
        setPendingCount(data.total || 0);
        // console.log('🔍 UserProfile - Set pending count to:', data.total || 0);
      } else {
        const errorData = await response.json();
        console.error('🔍 UserProfile - API error:', errorData);
      }
    } catch (error) {
      console.error('🔍 UserProfile - Error fetching pending count:', error);
    }
  };

  if (!isAuthenticated || !user) {
    // console.log('🔍 UserProfile - Not authenticated or no user, returning null');
    return null;
  }

  // console.log('🔍 UserProfile - Rendering with user:', user);
  // console.log('🔍 UserProfile - User role:', user?.user?.role);
  // console.log('🔍 UserProfile - User status:', user?.user?.status);
  // console.log('🔍 UserProfile - Pending count:', pendingCount);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = () => {
    if (user?.user?.role === 'admin') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Admin</span>;
    } else if (user?.user?.status === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Student</span>;
    } else if (user?.user?.status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending Approval</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{user?.user?.status}</span>;
    }
  };

  return (
          <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user?.user?.role === 'admin' ? 'bg-red-600' : 'bg-green-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user?.user?.username}</h3>
                                 <div className="flex items-center space-x-2">
                     {getRoleBadge()}
                     <p className="text-sm text-gray-500">Logged In</p>
                   </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            
            
                               <Button
                     onClick={handleLogout}
                     loading={isLoggingOut}
                     loadingText="Logging out..."
                     color="white"
                     className="!w-auto"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                     </svg>
                     Logout
                   </Button>
          </div>
        </div>

                {/* Admin Dashboard Button */}
        {user?.user?.role === 'admin' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                                     Manage All Students
              </button>
              {pendingCount > 0 && (
                                     <div className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                       </svg>
                       {pendingCount} pending approvals
                     </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message for Students */}
                     {user?.user?.role === 'student' && user?.user?.status === 'pending' && (
               <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                 <p className="text-sm text-yellow-800">
                   <strong>Status:</strong> Your account is pending approval. Please wait for administrator approval.
                 </p>
               </div>
             )}

      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      
    </div>
  );
} 