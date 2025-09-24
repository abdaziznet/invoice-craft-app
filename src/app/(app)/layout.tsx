'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Spinner from '@/components/ui/spinner';
import Header from '@/components/layout/header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isWhitelisted } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      if (!user) {
        router.replace('/');
      } else if (!isWhitelisted) {
        router.replace('/access-denied');
      }
    }
  }, [user, loading, isWhitelisted, router, isClient]);

  if (!isClient || loading || !user || !isWhitelisted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
