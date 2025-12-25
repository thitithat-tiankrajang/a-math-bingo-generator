// Assignment service for handling API calls
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://dasc-anagram-generator-jet.vercel.app';

/** ✅ NEW: Locked position item */
export type LockedPos = { pos: number; value: string };

export interface Assignment {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  studentProgress?: StudentProgress;
  students?: StudentAssignment[];
  optionSets?: OptionSet[];
  statistics?: {
    totalStudents: number;
    statusBreakdown: {
      todo: number;
      inprogress: number;
      complete: number;
      done: number;
    };
    completionRate: number;
  };
}

export interface StudentProgress {
  studentId: string;
  status: 'todo' | 'inprogress' | 'complete' | 'done';
  startedAt?: string;
  completedAt?: string;
  markedDoneAt?: string;
  answers: Answer[];
  currentQuestionSet: number;
  questionsCompletedInCurrentSet: number;
  progressPercentage: number;
  answeredQuestions: number;
  remainingQuestions: number;
  currentQuestionElements?: string[] | null;

  /** ✅ NEW: solution tokens for current generated question (persisted) */
  currentQuestionSolutionTokens?: string[] | null;

  /** ✅ NEW: lock positions for current generated question (persisted) */
  currentQuestionListPosLock?: LockedPos[] | null;
}

export interface StudentAssignment {
  studentId: string;
  status: 'todo' | 'inprogress' | 'complete' | 'done';
  startedAt?: string;
  completedAt?: string;
  markedDoneAt?: string;
  answers: Answer[];
  currentQuestionSet: number;
  questionsCompletedInCurrentSet: number;
  progressPercentage?: number;
  answeredQuestions?: number;
  remainingQuestions?: number;

  /** ✅ NEW (optional): same as StudentProgress */
  currentQuestionListPosLock?: LockedPos[] | null;
}

export interface Student {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  school: string;
  fullName: string;
  displayName: string;
}

export interface Answer {
  questionNumber: number;
  questionText: string;
  answerText: string;
  answeredAt: string;
}

export interface OptionSet {
  options: {
    totalCount: number;
    lockMode?: boolean;     // frontend canonical
    lockCount?: number;     // must be totalCount - 8 when lockMode=true
    isLockPos?: boolean;    // some code might use this name
    posLockCount?: number;  // optional alias
    operatorMode: 'random' | 'specific';
    operatorCount: number;
    specificOperators?: {
      plus?: number;
      minus?: number;
      multiply?: number;
      divide?: number;
    };
    equalsCount: number;
    heavyNumberCount: number;
    BlankCount: number;
    zeroCount: number;
    operatorCounts?: {
      '+': number;
      '-': number;
      '×': number;
      '÷': number;
    };
    operatorFixed?: {
      '+': number | null;
      '-': number | null;
      '×': number | null;
      '÷': number | null;
      '+/-': number | null;
      '×/÷': number | null;
    };
    equalsMode?: 'random' | 'specific';
    equalsMin?: number;
    equalsMax?: number;
    heavyNumberMode?: 'random' | 'specific';
    heavyNumberMin?: number;
    heavyNumberMax?: number;
    blankMode?: 'random' | 'specific';
    blankMin?: number;
    blankMax?: number;
    zeroMode?: 'random' | 'specific';
    zeroMin?: number;
    zeroMax?: number;
    operatorMin?: number;
    operatorMax?: number;
    randomSettings?: {
      operators: boolean;
      equals: boolean;
      heavy: boolean;
      blank: boolean;
      zero: boolean;
    };
  };
  numQuestions: number;
  setLabel?: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  totalQuestions: number;
  dueDate: string;
  studentIds?: string[];
  optionSets?: OptionSet[];
}

export interface AssignStudentsData {
  studentIds: string[];
}

/** ✅ UPDATED: allow listPosLock */
export interface SubmitAnswerData {
  questionNumber: number;
  questionText: string;
  answerText: string;

  /** ✅ NEW */
  listPosLock?: LockedPos[] | null;
}

export interface CurrentOptionSetInfo {
  currentSet: OptionSet | null;
  currentSetIndex: number;
  questionsCompleted: number;
  shouldProgress: boolean;
  totalSets: number;
  currentQuestionElements?: string[] | null;

  /** ✅ NEW: solution tokens for lock pos reference */
  currentQuestionSolutionTokens?: string[] | null;

  /** ✅ NEW */
  currentQuestionListPosLock?: LockedPos[] | null;
}

class AssignmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Student endpoints
  async getStudentAssignments(
    studentId: string,
    status?: string,
    page = 1,
    limit = 10
  ): Promise<{
    assignments: Assignment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await fetch(
      `${API_BASE_URL}/assignments/students/${studentId}/assignments?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get student assignments');
    }

    return response.json();
  }

  async startAssignment(
    assignmentId: string,
    studentId: string
  ): Promise<{ studentProgress: StudentProgress }> {
    const headers = this.getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/start`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start assignment');
    }

    return response.json();
  }

  async submitAnswer(
    assignmentId: string,
    studentId: string,
    answerData: SubmitAnswerData
  ): Promise<{ studentProgress: StudentProgress }> {
    const response = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/answers`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(answerData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit answer');
    }

    return response.json();
  }

  async getStudentAnswers(
    assignmentId: string,
    studentId: string
  ): Promise<{
    studentId: string;
    assignmentId: string;
    totalQuestions: number;
    answers: Answer[];
    answeredCount: number;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/answers`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get student answers');
    }
    return response.json();
  }

  // Admin endpoints
  async createAssignment(
    assignmentData: CreateAssignmentData
  ): Promise<{ message: string; assignment: Assignment }> {
    console.log("🚀 createAssignment input:", assignmentData.optionSets?.map(s => ({
      lockMode: (s as OptionSet).options?.lockMode,
      isLockPos: (s as OptionSet).options?.isLockPos,
      lockCount: (s as OptionSet).options?.lockCount,
      posLockCount: (s as OptionSet).options?.posLockCount,
    })));
    
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create assignment');
    }

    return response.json();
  }

  async getAllAssignments(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{
    assignments: Assignment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await fetch(`${API_BASE_URL}/assignments?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get assignments');
    }

    return response.json();
  }

  async getAssignment(
    assignmentId: string
  ): Promise<{ assignment: Assignment }> {
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get assignment');
    }

    return response.json();
  }

  // Alias for getAssignment to match the naming in the detail page
  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    const response = await this.getAssignment(assignmentId);
    return response.assignment;
  }

  async getStudentAssignment(
    studentId: string,
    assignmentId: string
  ): Promise<{ assignment: Assignment }> {
    const response = await fetch(
      `${API_BASE_URL}/assignments/students/${studentId}/assignments/${assignmentId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get assignment');
    }

    return response.json();
  }

  async assignStudents(
    assignmentId: string,
    studentIds: string[]
  ): Promise<{ assignment: Assignment }> {
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ studentIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign students');
    }

    return response.json();
  }

  async updateStudentStatus(
    assignmentId: string,
    studentId: string,
    status: string
  ): Promise<{ studentProgress: StudentProgress }> {
    const response = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/status`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update student status');
    }

    return response.json();
  }

  async updateAssignment(
    assignmentId: string,
    updateData: {
      title?: string;
      description?: string;
      studentIds?: string[];
    }
  ): Promise<{ message: string; assignment: Assignment }> {
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update assignment');
    }

    return response.json();
  }

  async deleteAssignment(
    assignmentId: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete assignment');
    }

    return response.json();
  }

  // Utility method to get students for assignment
  async getStudents(
    status?: string,
    page = 1,
    limit = 50
  ): Promise<{
    students: Array<{
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      nickname?: string;
      school?: string;
      status: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await fetch(
      `${API_BASE_URL}/auth/admin/students?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get students');
    }

    return response.json();
  }

  async getAvailableStudents(): Promise<{
    students: Student[];
    count: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/assignments/available-students`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get available students');
    }

    return response.json();
  }

  // Get all students as a simple array for the detail page
  async getAllStudents(): Promise<Student[]> {
    const response = await this.getAvailableStudents();
    return response.students;
  }

  async createAssignmentWithStudents(assignmentData: {
    title: string;
    description: string;
    totalQuestions: number;
    dueDate: string;
    studentIds?: string[];
  }): Promise<{ message: string; assignment: Assignment }> {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create assignment');
    }

    return response.json();
  }

  // Role-based assignment fetching
  async getAssignmentsByRole(
    user: { id: string; role: string },
    status?: string,
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{
    assignments: Assignment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  }> {
    console.log('🚀 getAssignmentsByRole called with:', { user, status, page, limit, search });

    // If user is admin, get all assignments created by them
    if (user.role === 'admin') {
      console.log('📋 Admin user - calling getAllAssignments');
      return this.getAllAssignments(page, limit, search);
    }

    // If user is student, get assignments assigned to them
    console.log('🎓 Student user - calling getStudentAssignments with ID:', user.id);
    return this.getStudentAssignments(user.id, status, page, limit);
  }

  // Get current option set for a student in an assignment
  async getCurrentOptionSet(
    assignmentId: string,
    studentId: string
  ): Promise<CurrentOptionSetInfo> {
    const response = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/current-set`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get current option set');
    }

    return response.json();
  }

  // Persist current generated question elements (idempotent; only sets if empty)
  /** ✅ UPDATED: accept solutionTokens and listPosLock */
  async setCurrentQuestionElements(
    assignmentId: string,
    studentId: string,
    elements: string[],
    listPosLock?: LockedPos[] | null,
    solutionTokens?: string[] | null
  ): Promise<{ currentQuestionElements: string[]; currentQuestionSolutionTokens?: string[] | null; currentQuestionListPosLock?: LockedPos[] | null }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/assignments/${assignmentId}/students/${studentId}/current-question`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            elements,
            ...(listPosLock ? { listPosLock } : {}),
            ...(solutionTokens ? { solutionTokens } : {}),
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        console.warn(
          'Failed to set current question elements:',
          error.message || 'Unknown error'
        );
        // Return a mock response instead of throwing
        return {
          currentQuestionElements: elements,
          currentQuestionSolutionTokens: solutionTokens ?? null,
          currentQuestionListPosLock: listPosLock ?? null,
        };
      }
      return response.json();
    } catch (error) {
      console.warn('Error setting current question elements:', error);
      // Return a mock response instead of throwing
      return {
        currentQuestionElements: elements,
        currentQuestionSolutionTokens: solutionTokens ?? null,
        currentQuestionListPosLock: listPosLock ?? null,
      };
    }
  }
}

export const assignmentService = new AssignmentService();
