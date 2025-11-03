import * as React from 'react';
const { createContext, useContext, useEffect, useState } = React;
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
    const now = new Date().toISOString();
    const created = await api.createProfile({
      id: newUser.id,
      name,
      bio: '',
      profile_pic: '',
      wallet_balance: 0,
      created_at: now,
      updated_at: now,
    });
    setProfile(created as Profile);
  };

  const signIn = async (userId: string, _password: string) => {
    try {
      console.log('Attempting to sign in with userId:', userId);

      try {
        const profileData = await api.getProfile(userId);
        if (profileData) {
          const userData = { id: profileData.id, email: `${profileData.name || profileData.id}@demo.com` };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setProfile(profileData);
          return;
        }
      } catch (err: any) {
        const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
        // If profile not found, create a new one. Otherwise rethrow.
        if (!msg.includes('no profile') && !msg.includes('not found') && !msg.includes('404')) {
          console.error('Unexpected error fetching profile:', err);
          throw err;
        }
        console.log('Profile not found, creating new profile for', userId);
      }

      // Create a new profile and sign in
      const userData = { id: userId, email: `${userId}@demo.com` };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      const now = new Date().toISOString();
      const newProfile = {
        id: userId,
        name: userId,
        bio: '',
        profile_pic: '',
        wallet_balance: 0,
        created_at: now,
        updated_at: now,
      };

      const created = await api.createProfile(newProfile);
      setProfile(created as Profile);
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