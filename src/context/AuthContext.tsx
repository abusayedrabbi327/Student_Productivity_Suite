import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, DbProfile } from '../lib/supabase';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: DbProfile | null;
  userRole: 'student' | 'teacher' | null;
  loading: boolean;
  loginAsRole: (role: 'student' | 'teacher') => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithPassword: (data: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher';
    department?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing session on initial load
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfileForUser(session.user.id, session.user.email);
          if (profile) setCurrentUser(profile);
        } else {
          // Check localStorage fallback for quick demo
          const savedUserId = localStorage.getItem('ironman_user_id');
          if (savedUserId) {
            const profile = await api.getProfile(savedUserId);
            if (profile) setCurrentUser(profile);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfileForUser(session.user.id, session.user.email);
        if (profile) setCurrentUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('ironman_user_id');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to fetch or create profile row
  const fetchProfileForUser = async (authId: string, email?: string): Promise<DbProfile | null> => {
    // 1. By id or auth_id
    const { data: byAuth } = await supabase.from('profiles').select('*').or(`id.eq.${authId},auth_id.eq.${authId}`).maybeSingle();
    if (byAuth) return byAuth;

    // 2. By email
    if (email) {
      const { data: byEmail } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
      if (byEmail) {
        // Link auth_id
        await supabase.from('profiles').update({ auth_id: authId }).eq('id', byEmail.id);
        return byEmail;
      }
    }
    return null;
  };

  // Real Password-Protected Login
  const loginWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfileForUser(data.user.id, data.user.email);
        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('ironman_user_id', profile.id);
        }
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'User data not found.' };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // Real Password-Protected Registration
  const registerWithPassword = async (data: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher';
    department?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const color = data.role === 'teacher' ? '#10b981' : '#3b82f6';

      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name.trim(),
            role: data.role,
            department: data.department || 'Computer Science & Engineering',
          },
        },
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        // Ensure profile exists in public.profiles table
        const { data: existingProfile } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
        let profile = existingProfile;

        if (!existingProfile) {
          const { data: created } = await supabase.from('profiles').insert([{
            id: authData.user.id,
            auth_id: authData.user.id,
            email: cleanEmail,
            full_name: data.full_name.trim(),
            role: data.role,
            department: data.department || 'Computer Science & Engineering',
            course: 'Human-Computer Interaction',
            color,
            points: data.role === 'student' ? 1200 : 0,
            level: data.role === 'student' ? 7 : 1,
            streak: data.role === 'student' ? 7 : 0,
          }]).select().single();
          profile = created;
        }

        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem('ironman_user_id', profile.id);
        }

        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Registration failed to create user.' };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Quick Demo Access
  const loginAsRole = async (role: 'student' | 'teacher') => {
    setLoading(true);
    const targetEmail = role === 'teacher' ? 'sarah.ahmed@uiu.ac.bd' : 'student@uiu.ac.bd';
    // Authenticate with pre-configured password
    const res = await loginWithPassword(targetEmail, 'Password123!');
    if (!res.success) {
      // Fallback direct profile load if needed
      const { data } = await supabase.from('profiles').select('*').eq('email', targetEmail).single();
      if (data) {
        setCurrentUser(data);
        localStorage.setItem('ironman_user_id', data.id);
      }
    }
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('ironman_user_id');
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const profile = await api.getProfile(currentUser.id);
    if (profile) setCurrentUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: currentUser?.role || null,
        loading,
        loginAsRole,
        loginWithPassword,
        registerWithPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
