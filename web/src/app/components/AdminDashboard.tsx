'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  id?: string;
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  school: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  rejectionReason?: string;
}

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { token } = useAuth();
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [studentToApprove, setStudentToApprove] = useState<Student | null>(null);
  const [studentToReject, setStudentToReject] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const response = await fetch('http://localhost:3001/auth/admin/students/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // console.log('🔍 API Response:', data);
          // console.log('🔍 Students data:', data.students);
          // if (data.students && data.students.length > 0) {
          //   console.log('🔍 First student:', data.students[0]);
          //   console.log('🔍 Student ID field:', data.students[0].id || data.students[0]._id);
          // }
          setPendingStudents(data.students);
        }
      } else {
        const response = await fetch('http://localhost:3001/auth/admin/students', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAllStudents(data.students);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (student: Student) => {
    const studentId = getStudentId(student);
    setStudentToApprove(student);
    setProcessing(studentId);
    
    try {
      // console.log('🔍 Approving student:', student);
      // console.log('🔍 Student ID:', studentId);
      // console.log('🔍 Using token:', token ? 'Token exists' : 'No token');
      
      // Validate studentId format
      if (!studentId || studentId.length !== 24) {
        console.error('❌ Invalid student ID format:', studentId);
        alert('Invalid student ID format');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/auth/admin/students/${studentId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        // const result = await response.json();
              // console.log('🔍 Approval successful:', result);
      // console.log('🔍 Approved student data:', studentToApprove);
      alert(`Student ${studentToApprove?.firstName} ${studentToApprove?.lastName} approved successfully`);
      fetchStudents();
      } else {
        const error = await response.json();
        console.error('🔍 Approval error:', error);
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Error approving student');
    } finally {
      setProcessing(null);
      setStudentToApprove(null);
    }
  };

  const handleReject = async (student: Student) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    const studentId = getStudentId(student);
    setStudentToReject(student);
    setProcessing(studentId);
    
    try {
      // console.log('🔍 Rejecting student:', student);
      // console.log('🔍 Student ID:', studentId);
      // console.log('🔍 Rejection reason:', rejectionReason);
      
      const response = await fetch(`http://localhost:3001/auth/admin/students/${studentId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Rejection successful:', result);
        console.log('🔍 Rejected student data:', studentToReject);
        alert(`Student ${studentToReject?.firstName} ${studentToReject?.lastName} rejected successfully`);
        setRejectionReason('');
        setSelectedStudent(null);
        fetchStudents();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Error rejecting student');
    } finally {
      setProcessing(null);
      setStudentToReject(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setRejectionReason('');
  };

  const getStudentId = (student: Student): string => {
    return student.id || student._id || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20">⏳ Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-600/20">✅ Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ring-1 ring-red-600/20">❌ Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ring-1 ring-gray-600/20">{status}</span>;
    }
  };

  const students = activeTab === 'pending' ? pendingStudents : allStudents;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-green-200 w-full max-w-6xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-green-200 bg-gradient-to-r from-green-50 to-yellow-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-800">
                🏫 Thepsirin Admin Dashboard
              </h3>
              <p className="text-sm text-green-600">Student Management System</p>
            </div>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Tab Navigation */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending Approval</span>
                {pendingStudents.length > 0 && (
                  <span className="ml-2 bg-white/20 text-white px-2 py-0.5 text-xs rounded-full">
                    {pendingStudents.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>All Students</span>
              </div>
            </button>
          </div>

          {/* Info Card */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-yellow-400 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-800 font-medium">
                  <strong>💡 Tip:</strong> Manage student approvals efficiently with this dashboard
                </p>
                <p className="text-xs text-green-600 mt-1">Thepsirin School Management System</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="text-center py-12">
              <p className="mt-4 text-green-700 font-medium">Loading student data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {activeTab === 'pending' ? '🎉 No pending students' : '📚 No student data'}
                  </h3>
                  <p className="text-green-600">
                    {activeTab === 'pending' ? 'All students have been processed successfully!' : 'No students in the system yet'}
                  </p>
                </div>
              ) : (
                students.map((student) => (
                  <div key={getStudentId(student)} className="bg-white border border-green-200 rounded-xl p-5 hover:border-green-300 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {student.firstName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800 text-lg">
                              {student.firstName} {student.lastName}
                              {student.nickname && (
                                <span className="text-green-600 font-normal"> ({student.nickname})</span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(student.status)}
                              <span className="text-xs text-green-600 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(student.createdAt).toLocaleDateString('en-US')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-green-700">
                              <strong>Username:</strong> {student.username}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-green-700">
                              <strong>School:</strong> {student.school}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-200 mb-4">
                          <div className="flex items-start space-x-2">
                            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <span className="text-sm font-medium text-green-800">Purpose:</span>
                              <p className="text-sm text-green-700 mt-1">{student.purpose}</p>
                            </div>
                          </div>
                        </div>

                        {student.rejectionReason && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <div>
                                <span className="text-sm font-medium text-red-800">Rejection Reason:</span>
                                <p className="text-sm text-red-700 mt-1">{student.rejectionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {student.status === 'pending' && (
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => handleApprove(student)}
                            disabled={processing === getStudentId(student)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
                          >
                            {processing === getStudentId(student) ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                                <span className="text-xs">Processing...</span>
                              </div>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedStudent(student)}
                            disabled={processing === getStudentId(student)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCloseModal}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md">
              <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Reject Application
                  </h3>
                  <button
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
                    onClick={handleCloseModal}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">
                      {selectedStudent.firstName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedStudent.username}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-colors"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReject(selectedStudent)}
                    disabled={processing === getStudentId(selectedStudent) || !rejectionReason.trim()}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === getStudentId(selectedStudent) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    disabled={processing === getStudentId(selectedStudent)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

        )}
      </div>
    </div>
  );
}