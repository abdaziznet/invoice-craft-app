
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
import { firebaseConfig } from '@/lib/firebase/config';

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

const WHITELISTED_EMAILS = ['file.azis@gmail.com', 'mail.tasliman@gmail.com'];

const MissingApiKeyError = () => (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-destructive">Firebase API Key is Missing</h1>
            <p className="mt-4 text-muted-foreground">
                Your Firebase API key is not configured. Please add your Firebase project credentials to the 
                <code className="mx-1 rounded bg-muted px-1.5 py-1 font-mono text-sm">.env</code> file in the root of the project.
            </p>
             <div className="mt-6 rounded-md border border-input bg-background p-4 text-left text-sm">
                <pre className="whitespace-pre-wrap text-muted-foreground">
                    <code>
                        NEXT_PUBLIC_FIREBASE_API_KEY=...<br/>
                        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...<br/>
                        NEXT_PUBLIC_FIREBASE_PROJECT_ID=...<br/>
                        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...<br/>
                        NEXT_PUBLIC_FIREBASE_APP_ID=...
                    </code>
                </pre>
            </div>
        </div>
    </div>
);


export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isWhitelisted = user?.email ? WHITELISTED_EMAILS.includes(user.email) : false;

  useEffect(() => {
    if (!firebaseConfig.apiKey) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!firebaseConfig.apiKey) {
      return <MissingApiKeyError />;
  }


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
