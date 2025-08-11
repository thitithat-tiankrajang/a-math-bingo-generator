'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Input, Button, TextArea } from '@/app/ui';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nickname: '',
    school: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.username || !formData.password || !formData.firstName || !formData.lastName || !formData.school || !formData.purpose) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Prepare registration data (excluding confirmPassword)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-green-800 rounded-lg shadow-md p-6 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-white">Redirecting...</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-green-800 rounded-lg shadow-lg p-8 text-center border border-green-700">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">Registration Successful!</h2>
            <p className="text-green-100 mb-6">
              Your account has been created successfully. Please wait for admin approval before you can sign in.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Sign In
              </Link>
              <Link
                href="/"
                className="block w-full py-2 px-4 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-green-100">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <div className="bg-green-800 rounded-lg shadow-lg p-8 border border-green-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-200">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                label="Username *"
                placeholder="Choose a username"
              />

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                label="Password *"
                placeholder="Create a password"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                label="Confirm Password *"
                placeholder="Confirm your password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                label="First Name *"
                placeholder="First name"
              />

              <Input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                label="Last Name *"
                placeholder="Last name"
              />
            </div>

            <Input
              id="nickname"
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleChange}
              label="Nickname"
              placeholder="Nickname (optional)"
            />

            <Input
              id="school"
              name="school"
              type="text"
              required
              value={formData.school}
              onChange={handleChange}
              label="School *"
              placeholder="Your school name"
            />

            <TextArea
              id="purpose"
              name="purpose"
              required
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              label="Purpose *"
              placeholder="Please describe why you want to use this system"
            />

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              loadingText="Creating account..."
              variant="primary"
              icon={
                !loading && (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )
              }
            >
              Create Account
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-green-100 hover:text-white transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center">
          <div className="text-xs text-green-200">
            <p>By registering, you acknowledge that your account will need to be approved by an administrator before you can access the system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
