'use client';

import React, { useState } from 'react';
import Input from '@/app/ui/Input';

export interface RegistrationForm {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  nickname: string;
  school: string;
  purpose: string;
}

interface StudentRegistrationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentRegistration({ onClose, onSuccess }: StudentRegistrationProps) {
  const [formData, setFormData] = useState<RegistrationForm>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nickname: '',
    school: '',
    purpose: ''
  });

  const [errors, setErrors] = useState<Partial<RegistrationForm>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof RegistrationForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationForm> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Please enter username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter first name';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Please enter last name';
    }

    if (!formData.school.trim()) {
      newErrors.school = 'Please enter school name';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Please enter purpose';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          nickname: formData.nickname.trim() || undefined,
          school: formData.school.trim(),
          purpose: formData.purpose.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please wait for admin approval.');
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-green-200 w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Close Button - Top Right */}
        <button
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm z-10"
          onClick={onClose}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-yellow-500 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">📝 Student Registration</h2>
              <p className="text-green-100 text-sm">Join Thepsirin School System</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <Input
              label="Username *"
              type="text"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={errors.username}
              placeholder="Enter username"
              disabled={loading}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            {/* Password */}
            <Input
              label="Password *"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              placeholder="Enter password"
              disabled={loading}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password *"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Confirm password"
              disabled={loading}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={errors.firstName}
                placeholder="First name"
                disabled={loading}
              />
              <Input
                label="Last Name *"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={errors.lastName}
                placeholder="Last name"
                disabled={loading}
              />
            </div>

            {/* Nickname */}
            <Input
              label="Nickname (Optional)"
              type="text"
              value={formData.nickname}
              onChange={handleInputChange('nickname')}
              placeholder="Nickname"
              disabled={loading}
            />

            {/* School */}
            <Input
              label="School *"
              type="text"
              value={formData.school}
              onChange={handleInputChange('school')}
              error={errors.school}
              placeholder="School name"
              disabled={loading}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            {/* Purpose */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                Purpose *
              </label>
              <div className="relative group">
                <textarea
                  value={formData.purpose}
                  onChange={handleInputChange('purpose')}
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ease-in-out bg-white shadow-sm hover:shadow-md focus:shadow-lg text-black caret-black resize-none placeholder-gray-400 ${
                    errors.purpose ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Purpose of using this system"
                  disabled={loading}
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-green-200 group-focus-within:ring-opacity-50"></div>
              </div>
              {errors.purpose && (
                <p className="text-sm text-red-600 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.purpose}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl border border-yellow-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Important Notice</p>
                <p className="text-sm text-yellow-700 mt-1">
                  After registration, you need to wait for admin approval before you can access the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}