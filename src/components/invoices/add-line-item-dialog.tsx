'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductCombobox } from './product-combobox';
import type { Product } from '@/lib/types';
import type { LineItemFormValues } from '@/app/(app)/invoices/new/page';
import { useLocale } from '@/hooks/use-locale';
import Spinner from '../ui/spinner';

const addLineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

type AddLineItemFormValues = z.infer<typeof addLineItemSchema>;

type AddLineItemDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: LineItemFormValues) => void;
  products: Product[];
};

export default function AddLineItemDialog({
  isOpen,
  onOpenChange,
  onAddItem,
  products,
}: AddLineItemDialogProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const form = useForm<AddLineItemFormValues>({
    resolver: zodResolver(addLineItemSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (isSaving) return;
    onOpenChange(open);
    if (!open) {
      form.reset();
      setSelectedProduct(null);
    }
  };

  const onSubmit = (data: AddLineItemFormValues) => {
    setIsSaving(true);
    if (!selectedProduct) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a valid product.',
      });
      setIsSaving(false);
      return;
    }

    const newItem: LineItemFormValues = {
      productId: data.productId,
      quantity: data.quantity,
      unitPrice: selectedProduct.unitPrice,
      total: selectedProduct.unitPrice * data.quantity,
    };

    onAddItem(newItem);
    setIsSaving(false);
    handleOpenChange(false);
  };

  const handleProductChange = (productId: string) => {
    form.setValue('productId', productId);
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('invoices.form.addItem')}</DialogTitle>
          <DialogDescription>
            Select a product and specify the quantity to add to the invoice.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.form.item')}</FormLabel>
                  <ProductCombobox
                    products={products}
                    value={field.value}
                    onChange={handleProductChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.form.quantity')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {t('invoices.form.addItem')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
