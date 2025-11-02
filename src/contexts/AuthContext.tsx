import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, Profile } from '../lib/api';

// Mock user type for now since we're migrating away from Supabase
type MockUser = {
  id: string;
  email: string;
};

interface AuthContextType {
  user: MockUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (userId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      return await api.getProfile(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check for existing user session in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchProfile(userData.id).then((profileData) => {
          setProfile(profileData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, _password: string, name: string) => {
    // Mock signup - in a real app this would call an API
    const newUser = { id: `user-${Date.now()}`, email };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    await api.createProfile({
      id: newUser.id,
      name,
      bio: '',
      profile_pic: '',
      wallet_balance: 0,
    });
  };

  const signIn = async (userId: string, _password: string) => {
    try {
      console.log('Attempting to sign in with userId:', userId);
      
      let profileData;
      try {
        profileData = await api.getProfile(userId);
        console.log('Profile data received:', profileData);

        if (profileData) {
          // User exists, sign them in
          console.log('Existing user found, signing in');
          const userData = { id: profileData.id, email: `${profileData.name}@demo.com` };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setProfile(profileData);
          return; // Early return on success
        }
      } catch (err: any) {
        // If error is not 404, rethrow it
        if (err.response?.status !== 404) {
          console.error('Error during profile fetch:', err);
          throw new Error(err.response?.data?.message || 'Failed to sign in');
        }
        // If 404, continue to create new profile
        console.log('User not found, will create new profile');
      }

      // User doesn't exist, create new profile and sign them in
      console.log('Creating new profile for user:', userId);
      const userData = { id: userId, email: `${userId}@demo.com` };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      const now = new Date().toISOString();
      const newProfile = {
        id: userId,
        name: userId, // Use userId as default name
        bio: '',
        profile_pic: '',
        wallet_balance: 0,
        created_at: now,
        updated_at: now,
      };

      await api.createProfile(newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error during sign in:', error);
      throw new Error('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};