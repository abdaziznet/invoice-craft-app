'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AccessDeniedPage() {
  const { user, signOut, isWhitelisted, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && !isWhitelisted) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Your email is not authorized to access this application.",
      })
    }
  }, [user, isWhitelisted, loading, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="mt-4">Access Denied</CardTitle>
          <CardDescription>
            Sorry, your account with the email{' '}
            <span className="font-semibold text-foreground">{user?.email}</span> is not
            authorized to access this application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out & Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
