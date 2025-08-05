// Authentication service for handling API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dasc-anagram-generator-jet.vercel.app';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  user: {
    _id: string;
    username: string;
    role: 'admin' | 'student';
    status: 'pending' | 'approved' | 'rejected';
    firstName?: string;
    lastName?: string;
    nickname?: string;
    school?: string;
    purpose?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface AuthResponse {
  token: string;
}

class AuthService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔍 AuthService - Login credentials:', credentials);
    console.log('🔍 AuthService - Login API URL:', `${API_BASE_URL}/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('🔍 AuthService - Login response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('🔍 AuthService - Login error:', error);
      throw new Error(error.message || 'Login failed');
    }

    const loginData = await response.json();
    console.log('🔍 AuthService - Login response data:', loginData);
    return loginData;
  }

  async register(credentials: LoginCredentials): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async getProfile(): Promise<User> {
    console.log('🔍 AuthService - Getting profile...');
    console.log('🔍 AuthService - API URL:', `${API_BASE_URL}/auth/profile`);
    console.log('🔍 AuthService - Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getAuthHeaders(),
    });

    console.log('🔍 AuthService - Profile response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('🔍 AuthService - Profile error:', error);
      throw new Error(error.message || 'Failed to get profile');
    }

    const userData = await response.json();
    console.log('🔍 AuthService - Profile response data:', userData);
    // Return the data as is since API returns {user: {...}}
    return userData;
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }

    // Clear token from localStorage
    localStorage.removeItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService(); 