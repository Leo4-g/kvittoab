import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ success: boolean, message: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    console.log("AuthProvider initialized");
    
    // Function to handle session changes
    const handleSessionChange = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session check:", session ? "Session exists" : "No session");
        
        if (!session) {
          console.log("No active session, setting user to null");
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log("Creating new profile");
            const newProfile = {
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString(),
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();
              
            if (createError) {
              console.error("Error creating profile:", createError);
              setCurrentUser(null);
            } else {
              setCurrentUser({
                id: session.user.id,
                email: session.user.email!,
                ...createdProfile
              });
            }
          } else {
            console.error("Error fetching profile:", error);
            setCurrentUser(null);
          }
        } else {
          // Set user with profile
          setCurrentUser({
            id: session.user.id,
            email: session.user.email!,
            ...profile
          });
        }
      } catch (error) {
        console.error("Session handling error:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial session check
    handleSessionChange();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        handleSessionChange();
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  async function login(email: string, password: string) {
    try {
      setLoading(true);
      console.log("Logging in with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Auth state change listener will handle setting the user
    } catch (error: any) {
      console.error("Login error:", error);
      setLoading(false);
      throw error;
    }
  }

  // Signup function
  async function signup(email: string, password: string) {
    try {
      setLoading(true);
      console.log("Signing up with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      
      setLoading(false);
      return {
        success: true,
        message: "Account created! Please check your email for verification link"
      };
    } catch (error: any) {
      console.error("Signup error:", error);
      setLoading(false);
      return {
        success: false,
        message: error.message || 'Failed to create account'
      };
    }
  }

  // Logout function
  async function logout() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Auth state change listener will handle setting the user to null
    } catch (error: any) {
      console.error("Logout error:", error);
      setLoading(false);
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email: string) {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error: any) {
      console.error("Reset password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Debug logging
  useEffect(() => {
    console.log("Auth state updated:", 
      currentUser ? `User: ${currentUser.id}` : "No user", 
      `Loading: ${loading}`
    );
  }, [currentUser, loading]);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
