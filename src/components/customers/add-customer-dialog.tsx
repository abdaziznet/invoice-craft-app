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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCustomer } from '@/lib/google-sheets';
import Spinner from '@/components/ui/spinner';
import { useLocale } from '@/hooks/use-locale';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().regex(/^62\d+$/, { message: "Phone number must start with '62'." }),
  address: z.string().min(1, 'Address is required.'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

type AddCustomerDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onCustomerAdded: () => void;
};

export default function AddCustomerDialog({ isOpen, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });
  
  const handleOpenChange = (open: boolean) => {
    if (isSaving) return;
    onOpenChange(open);
    if(!open) {
      form.reset();
    }
  }

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSaving(true);
    try {
      await createCustomer(data);
      toast({
        variant: 'success',
        title: t('customers.toast.createdTitle'),
        description: t('customers.toast.createdDesc'),
      });
      onCustomerAdded();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('customers.toast.createErrorTitle'),
        description: t('customers.toast.createErrorDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{t('customers.addDialog.title')}</DialogTitle>
                <DialogDescription>
                    {t('customers.addDialog.description')}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('customers.form.name')}</FormLabel>
                            <FormControl>
                            <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('customers.form.email')}</FormLabel>
                            <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('customers.form.phone')}</FormLabel>
                            <FormControl>
                            <Input placeholder="6281234567890" {...field} />
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
                            <FormLabel>{t('customers.form.address')}</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="123 Main Street, Anytown, USA 12345"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
