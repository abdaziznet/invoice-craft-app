'use client';

import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
  type FC,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isWhitelisted: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const WHITELISTED_EMAIL = 'file.azis@gmail.com';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isWhitelisted = user?.email === WHITELISTED_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: 'Sign-in cancelled',
          description: 'You closed the sign-in window before completing the process.',
        });
      } else {
        console.error('Error signing in with Google:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'An error occurred during sign-in. Please try again.',
        });
      }
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = { user, loading, isWhitelisted, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
