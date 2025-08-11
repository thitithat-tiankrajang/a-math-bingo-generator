'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Home, BookOpen, Target, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function Navbar({ onUndo, onRedo, canUndo = false, canRedo = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.user?.role === 'admin';

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    ...(isAdmin ? [] : [{ href: '/assignment', label: 'Assignments', icon: BookOpen }]),
    { href: '/play', label: 'Play', icon: Target },
    ...(isAdmin ? [{ href: '/allassignment', label: 'Manage Assignments', icon: Settings }] : []),
  ];

  return (
    <nav className="bg-green-950 shadow-lg border-b border-green-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation items */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex items-center p-2 rounded-lg border border-green-600 bg-green-800/50">
              <img src="/logoDasc.png" alt="DASC Logo" className="w-8 h-8 mr-2 rounded-md" />
              <span className="text-lg font-bold text-white">DASC</span>
            </div>
            
            {/* Navigation items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive
                        ? 'bg-green-700 text-white shadow-sm'
                        : 'text-green-100 hover:text-white hover:bg-green-800'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Center - Undo/Redo buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-all duration-200 ${
                canUndo
                  ? 'text-green-100 hover:bg-green-800 hover:text-white'
                  : 'text-green-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-all duration-200 ${
                canRedo
                  ? 'text-green-100 hover:bg-green-800 hover:text-white'
                  : 'text-green-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium text-white">
                  {user?.user?.firstName || user?.user?.username}
                </div>
                <div className={`text-xs ${
                  isAdmin ? 'text-red-300' : 'text-blue-300'
                }`}>
                  {isAdmin ? 'Admin' : 'Student'}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                user?.user?.status === 'approved' ? 'bg-green-400' : 'bg-yellow-400'
              }`} title={`Status: ${user?.user?.status}`} />
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
