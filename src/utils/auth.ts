import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2`;

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  error?: string;
}

export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      return data;
    } catch (error) {
      console.error('Registration request error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store session
      if (data.session?.access_token) {
        localStorage.setItem('deskflow_session', JSON.stringify(data.session));
        localStorage.setItem('deskflow_auth', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login request error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async verifySession(): Promise<AuthResponse> {
    try {
      const sessionData = localStorage.getItem('deskflow_session');
      if (!sessionData) {
        return { success: false, error: 'No session found' };
      }

      const session = JSON.parse(sessionData);
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem('deskflow_session');
        localStorage.removeItem('deskflow_auth');
        return { success: false, error: data.error || 'Session expired' };
      }

      return data;
    } catch (error) {
      console.error('Session verification error:', error);
      localStorage.removeItem('deskflow_session');
      localStorage.removeItem('deskflow_auth');
      return { success: false, error: 'Session verification failed' };
    }
  },

  async updateProfile(name: string, email: string): Promise<AuthResponse> {
    try {
      const sessionData = localStorage.getItem('deskflow_session');
      if (!sessionData) {
        return { success: false, error: 'Not authenticated' };
      }

      const session = JSON.parse(sessionData);
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Update failed' };
      }

      // Update local storage
      if (data.user) {
        localStorage.setItem('deskflow_auth', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async logout(): Promise<void> {
    try {
      const sessionData = localStorage.getItem('deskflow_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('deskflow_session');
      localStorage.removeItem('deskflow_auth');
    }
  }
};
