'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Spinner from '@/components/ui/spinner';
import AppSidebar from '@/components/layout/app-sidebar';
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
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar />
      <div className="flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 gap-4 p-4 sm:px-6 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
