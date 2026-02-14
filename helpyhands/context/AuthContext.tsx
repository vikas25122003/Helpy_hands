import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up a new user
  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);
      
      if (checkError) {
        console.error('Error checking existing email:', checkError);
      } else if (existingUsers && existingUsers.length > 0) {
        setError('Email already exists. Please use a different email or log in.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'helpyhands://',
          data: {
            username: username,
            full_name: username
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already') || error.message.includes('exist')) {
          setError('Email already exists. Please use a different email or log in.');
        } else {
          setError(error.message);
        }
        console.error('Signup error:', error);
      } else {
        console.log('Signup successful:', data);

        // Update the profile with username
        if (data?.user) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                username: username,
                email: email
              })
              .eq('id', data.user.id);
                
            if (profileError) {
              console.error('Profile update error:', profileError);
            }
          } catch (err) {
            console.error('Error updating profile:', err);
          }
        }
        
        // Always show confirmation email alert
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification link to complete your registration.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
      console.error('Unexpected signup error:', error);
      Alert.alert('Unexpected Error', `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        console.error('Sign in error:', error);
        Alert.alert('Sign In Error', `Error: ${error.message}`);
      } else {
        console.log('Sign in successful:', data);
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
      console.error('Unexpected sign in error:', error);
      Alert.alert('Unexpected Error', `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        console.error('Sign out error:', error);
        Alert.alert('Sign Out Error', `Error: ${error.message}`);
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
      console.error('Unexpected sign out error:', error);
      Alert.alert('Unexpected Error', `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 