
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Spinner from '@/components/ui/spinner';
import Header from '@/components/layout/header';
import { SearchProvider } from '@/context/search-context';
import { LocaleProvider } from '@/context/locale-context';
import { getCompanyProfile } from '@/lib/google-sheets';
import type { CompanyProfile } from '@/lib/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isWhitelisted } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [language, setLanguage] = useState<'en' | 'id'>('en');

  useEffect(() => {
    setIsClient(true);
    async function fetchProfile() {
      try {
        const profile: CompanyProfile = await getCompanyProfile();
        setLanguage(profile.language || 'en');
      } catch (error) {
        console.error('Failed to fetch company profile for language', error);
      }
    }
    fetchProfile();
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
    <SearchProvider>
      <LocaleProvider lang={language}>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:px-14">
            <Header />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
      </LocaleProvider>
    </SearchProvider>
  );
}
