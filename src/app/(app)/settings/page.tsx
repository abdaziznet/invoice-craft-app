
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getCompanyProfile, updateCompanyProfile } from '@/lib/google-sheets';
import { useEffect, useState } from 'react';
import type { CompanyProfile } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  address: z.string().min(1, 'Company address is required.'),
  logoUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  currency: z.enum(['IDR', 'USD']),
  language: z.enum(['id', 'en']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getCompanyProfile();
        form.reset(profile);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load company profile.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [form, toast]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await updateCompanyProfile(data);
      toast({
        title: 'Settings Saved',
        description: 'Your company profile has been updated.',
      });
    } catch(error) {
      console.error("Failed to save profile", error);
       toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save company profile.',
        });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and company profile.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            This information will appear on your invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="InvoiceCraft Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main Street..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-company.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                            </Trigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="id">Indonesian</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                 {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
