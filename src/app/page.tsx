'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Spinner from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyProfile } from '@/lib/google-sheets';
import type { CompanyProfile } from '@/lib/types';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const defaultLogo = PlaceHolderImages.find((img) => img.id === 'logo');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    async function fetchLogo() {
      try {
        const profile: CompanyProfile = await getCompanyProfile();
        setLogoUrl(profile.logoUrl);
      } catch (error) {
        console.error('Failed to fetch company profile for logo', error);
      }
    }
    fetchLogo();
  }, []);

  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }
  
  const displayLogoUrl = logoUrl || defaultLogo?.imageUrl;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="items-center text-center">
          {displayLogoUrl && (
            <Image
              src={displayLogoUrl}
              alt="InvoiceCraft Logo"
              width={80}
              height={80}
              className="rounded-full"
              data-ai-hint={logoUrl ? 'company logo' : defaultLogo?.imageHint}
            />
          )}
          <CardTitle className="pt-4 text-3xl font-bold">
            Invoice<span className="text-primary">Craft</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Sign in to manage your invoices.
            </p>
            <Button
              onClick={signInWithGoogle}
              className="w-full"
              variant="default"
              size="lg"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Firebase.</p>
      </footer> */}
    </main>
  );
}
