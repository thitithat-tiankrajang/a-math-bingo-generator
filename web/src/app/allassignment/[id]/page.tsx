'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { assignmentService, type Assignment, type Student, type StudentAssignment } from '@/app/lib/assignmentService';
import { Button, Input, TextArea } from '@/app/ui';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<StudentAssignment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);


  const assignmentId = params.id as string;

  // data loading effect will be declared after callbacks are defined

  // Guard: only admins can access admin assignment details
  useEffect(() => {
    if (isAuthenticated && user?.user?.role !== 'admin') {
      router.replace('/assignment');
    }
  }, [isAuthenticated, user, router]);

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading assignment with ID:', assignmentId);
      const data = await assignmentService.getAssignmentById(assignmentId);
      console.log('Received assignment data:', data);
      
      setAssignment(data);
      
      // Set students from assignment data
      if (data.students && data.students.length > 0) {
        console.log('Setting students from assignment data:', data.students);
        setStudents(data.students);
      } else {
        console.log('No students found in assignment data');
        setStudents([]);
      }
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  const loadAvailableStudents = useCallback(async () => {
    try {
      console.log('Loading available students...');
      const data = await assignmentService.getAllStudents();
      console.log('Received available students data:', data);
      setAvailableStudents(data);
    } catch (err) {
      console.error('Failed to load available students:', err);
    }
  }, []);

  // Load assignment and students when admin is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.user?.role === 'admin') {
      loadAssignment();
      loadAvailableStudents();
    }
  }, [isAuthenticated, user, assignmentId, loadAssignment, loadAvailableStudents]);



  const handleSave = async () => {
    if (!assignment) return;

    try {
      setSaving(true);
      await assignmentService.updateAssignment(assignmentId, {
        title: assignment.title,
        description: assignment.description,
        studentIds: students.map(s => s.studentId)
      });
      setEditing(false);
      await loadAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await assignmentService.deleteAssignment(assignmentId);
      router.push('/allassignment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const student = availableStudents.find(s => s.id === studentId);
    if (!student) return;

    const isAssigned = students.some(s => s.studentId === studentId);
    console.log('Toggling student assignment:', { 
      studentId, 
      studentName: typeof student.fullName === 'string' ? student.fullName : 
                   `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown', 
      isAssigned 
    });
    
    if (isAssigned) {
      setStudents(students.filter(s => s.studentId !== studentId));
    } else {
      const newStudent: StudentAssignment = {
        studentId,
        status: 'todo' as const,
        answers: [],
        currentQuestionSet: 0,
        questionsCompletedInCurrentSet: 0,
        progressPercentage: 0,
        answeredQuestions: 0,
        remainingQuestions: assignment?.totalQuestions || 0
      };
      console.log('Adding new student to assignment:', newStudent);
      setStudents([...students, newStudent]);
    }
  };

  const selectAllStudents = () => {
    console.log('Selecting all available students...');
    const newStudents: StudentAssignment[] = availableStudents.map(student => ({
      studentId: student.id,
      status: 'todo' as const,
      answers: [],
      currentQuestionSet: 0,
      questionsCompletedInCurrentSet: 0,
      progressPercentage: 0,
      answeredQuestions: 0,
      remainingQuestions: assignment?.totalQuestions || 0
    }));
    console.log('Created new students array:', newStudents);
    setStudents(newStudents);
  };

  const clearAllStudents = () => {
    console.log('Clearing all students from assignment...');
    setStudents([]);
  };

  // const handleStatusChange = async (studentId: string, newStatus: string) => {
  //   try {
  //     console.log('Updating student status:', { studentId, newStatus });
  //     await assignmentService.updateStudentStatus(assignmentId, studentId, newStatus);
  //     console.log('Status updated successfully, reloading assignment...');
  //     await loadAssignment(); // Reload to get updated data
  //   } catch (err) {
  //     console.error('Error updating student status:', err);
  //     setError(err instanceof Error ? err.message : 'Failed to update student status');
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'inprogress': return 'bg-blue-100 text-blue-800';
      case 'complete': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'ยังไม่เริ่ม';
      case 'inprogress': return 'กำลังทำ';
      case 'complete': return 'ส่งแล้ว';
      case 'done': return 'ตรวจแล้ว';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !user) {
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access assignment management.</p>
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

  if (user?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This page is only accessible to administrators.</p>
          <Link
            href="/home"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Loading assignment...</span>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Assignment</h1>
          <p className="text-gray-600 mb-6">{error || 'Assignment not found'}</p>
          <Link
            href="/allassignment"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to All Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/allassignment"
                className="inline-flex items-center text-blue-600 hover:text-blue-900 mb-4"
              >
                ← Back to All Assignments
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {editing ? 'Edit Assignment' : 'Assignment Details'}
              </h1>
            </div>
            <div className="flex space-x-3">
              {editing ? (
                <>
                  <Button
                    onClick={() => setEditing(false)}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              {editing ? (
                <Input
                  value={assignment.title}
                  onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
                  placeholder="Assignment title"
                />
              ) : (
                <p className="text-gray-900">{assignment.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Questions
              </label>
              <p className="text-gray-900">{assignment.totalQuestions} questions</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              {editing ? (
                <TextArea
                  value={assignment.description || ''}
                  onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
                  placeholder="Assignment description"
                  rows={4}
                />
              ) : (
                <p className="text-gray-900">{assignment.description || 'No description'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <p className="text-gray-900">
                {formatDate(assignment.dueDate)}
                {assignment.isOverdue && (
                  <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created At
              </label>
              <p className="text-gray-900">
                {formatDate(assignment.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        {assignment.statistics && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{assignment.statistics.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{assignment.statistics.statusBreakdown.todo}</div>
                <div className="text-sm text-blue-600">Not Started</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">{assignment.statistics.statusBreakdown.inprogress}</div>
                <div className="text-sm text-yellow-600">In Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{assignment.statistics.statusBreakdown.complete + assignment.statistics.statusBreakdown.done}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">{assignment.statistics.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${assignment.statistics.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Students Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Student Management ({students.length})
            </h2>
            {editing && (
              <div className="flex space-x-2">
                <Button
                  onClick={selectAllStudents}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  onClick={clearAllStudents}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStudents.map((student) => {
                // Ensure student has required properties
                if (!student || typeof student !== 'object') {
                  console.warn('Invalid student data:', student);
                  return null;
                }
                
                const isAssigned = students.some(s => s.studentId === student.id);
                return (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isAssigned
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => handleStudentToggle(student.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {(() => {
                            if (typeof student.fullName === 'string' && student.fullName.trim()) {
                              return student.fullName;
                            }
                            const firstName = typeof student.firstName === 'string' ? student.firstName : '';
                            const lastName = typeof student.lastName === 'string' ? student.lastName : '';
                            const fullName = `${firstName} ${lastName}`.trim();
                            return fullName || 'Unknown Name';
                          })()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {typeof student.username === 'string' ? student.username : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {typeof student.school === 'string' ? student.school : 'Unknown School'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {students.length > 0 ? (
                students.map((studentAssignment) => {
                  const student = availableStudents.find(s => s.id === studentAssignment.studentId);
                  if (!student || typeof student !== 'object') {
                    console.warn('Student not found for assignment:', studentAssignment.studentId);
                    return (
                      <div key={studentAssignment.studentId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-medium text-sm">?</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Unknown Student (ID: {studentAssignment.studentId})</p>
                              <p className="text-sm text-gray-500">Student data not found</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(studentAssignment.status)}`}>
                              {getStatusLabel(studentAssignment.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium text-gray-900">
                              {studentAssignment.answeredQuestions || 0} / {assignment.totalQuestions} questions
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${studentAssignment.progressPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 border-t pt-3">
                          <h5 className="font-medium text-gray-900 mb-2">Submitted Answers</h5>
                          <p className="text-gray-500 text-sm">Student data not available</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={studentAssignment.studentId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {(() => {
                                const firstName = typeof student.firstName === 'string' ? student.firstName : '';
                                const lastName = typeof student.lastName === 'string' ? student.lastName : '';
                                const initials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
                                return initials || '?';
                              })()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {(() => {
                                if (typeof student.fullName === 'string' && student.fullName.trim()) {
                                  return student.fullName;
                                }
                                const firstName = typeof student.firstName === 'string' ? student.firstName : '';
                                const lastName = typeof student.lastName === 'string' ? student.lastName : '';
                                const fullName = `${firstName} ${lastName}`.trim();
                                return fullName || 'Unknown Name';
                              })()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(() => {
                                const username = typeof student.username === 'string' ? student.username : 'Unknown';
                                const school = typeof student.school === 'string' ? student.school : 'Unknown School';
                                return `${username} • ${school}`;
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(studentAssignment.status)}`}>
                            {getStatusLabel(studentAssignment.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {studentAssignment.answeredQuestions || 0}/{assignment.totalQuestions} questions
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-gray-900">
                            {studentAssignment.answeredQuestions || 0} / {assignment.totalQuestions} questions
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${studentAssignment.progressPercentage || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Always show answers for admin view */}
                      <div className="mt-3 border-t pt-3">
                        <h5 className="font-medium text-gray-900 mb-2">Submitted Answers</h5>
                        {studentAssignment.answers && studentAssignment.answers.length > 0 ? (
                          <div className="space-y-3">
                            {studentAssignment.answers.map((answer, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Question {answer.questionNumber}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(answer.answeredAt)}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <p className="text-sm text-gray-600 mb-1">
                                    <strong>Question:</strong> {answer.questionText}
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    <strong>Answer:</strong> {answer.answerText}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No answers submitted yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No students assigned to this assignment
                </div>
              )}
            </div>
          )}
        </div>
        {/* Inline details implementation replaces previous modal */}
        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
