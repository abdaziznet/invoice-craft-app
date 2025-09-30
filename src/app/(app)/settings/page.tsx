
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCompanyProfile, updateCompanyProfile } from '@/lib/google-sheets';
import type { CompanyProfile } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import { useLocale } from '@/hooks/use-locale';

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  address: z.string().min(1, 'Address is required.'),
  logoUrl: z.string().url('Must be a valid URL.').or(z.literal('')),
  currency: z.enum(['IDR', 'USD']),
  language: z.enum(['id', 'en']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { t, setLang } = useLocale();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      address: '',
      logoUrl: '',
      currency: 'IDR',
      language: 'id',
    },
  });

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getCompanyProfile();
        form.reset(profile);
      } catch (error) {
        console.error('Failed to fetch company profile', error);
        toast({
          variant: 'destructive',
          title: t('settings.toast.loadErrorTitle'),
          description: t('settings.toast.loadErrorDesc'),
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [form, toast, t]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await updateCompanyProfile(data);
      setLang(data.language);
      toast({
        title: t('settings.toast.savedTitle'),
        description: t('settings.toast.savedDesc'),
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('settings.toast.saveErrorTitle'),
        description: t('settings.toast.saveErrorDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.companyProfile.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.companyProfile.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Name" {...field} />
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
                    <FormLabel>{t('settings.companyProfile.address')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Business Rd, Suite 100" {...field} />
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
                    <FormLabel>{t('settings.companyProfile.logoUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-logo.com/image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.localization.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.localization.currency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.localization.selectCurrency')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDR">IDR (Indonesian Rupiah)</SelectItem>
                        <SelectItem value="USD">USD (United States Dollar)</SelectItem>
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
                    <FormLabel>{t('settings.localization.language')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.localization.selectLanguage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
