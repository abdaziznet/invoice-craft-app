
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
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProduct } from '@/lib/google-sheets';
import Spinner from '@/components/ui/spinner';
import type { Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocale } from '@/hooks/use-locale';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  unitPrice: z.coerce.number().min(0, 'Price must be a positive number.'),
  unit: z.enum(['pcs', 'boxes']),
});

type ProductFormValues = z.infer<typeof productSchema>;

type EditProductDialogProps = {
    product: Product;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onProductUpdated: () => void;
};

export default function EditProductDialog({ product, isOpen, onOpenChange, onProductUpdated }: EditProductDialogProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name || '',
      unitPrice: product.unitPrice || 0,
      unit: product.unit || 'pcs',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: product.name || '',
      unitPrice: product.unitPrice || 0,
      unit: product.unit || 'pcs',
    });
  }, [product, form]);
  
  const handleOpenChange = (open: boolean) => {
    if (isSaving) return;
    onOpenChange(open);
  }

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    try {
      await updateProduct(product.id, data);
      toast({
        title: t('products.toast.updatedTitle'),
        description: t('products.toast.updatedDesc'),
      });
      onProductUpdated();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('products.toast.updateErrorTitle'),
        description: t('products.toast.updateErrorDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{t('products.editDialog.title')}</DialogTitle>
                <DialogDescription>
                    {t('products.editDialog.description')}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('products.form.name')}</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Web Design" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('products.form.unit')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('products.form.unitPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">pcs</SelectItem>
                              <SelectItem value="boxes">boxes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('products.form.unitPrice')}</FormLabel>
                            <FormControl>
                            <Input
                              type="number"
                              placeholder="5000000"
                              {...field}
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.value = '';
                                }
                              }}
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
                            {t('common.saveChanges')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
