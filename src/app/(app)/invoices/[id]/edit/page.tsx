'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams, notFound } from 'next/navigation';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarIcon,
  PlusCircle,
  Save,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { getCustomers, getProducts, getInvoiceById, updateInvoice } from '@/lib/google-sheets';
import type { Customer, Product, Invoice, InvoiceStatus } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AddLineItemDialog from '@/components/invoices/add-line-item-dialog';

const lineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  unitPrice: z.coerce.number(),
  total: z.coerce.number(),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  invoiceDate: z.date({ required_error: 'Invoice date is required.' }),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  status: z.enum(['Paid', 'Unpaid', 'Overdue']),
  lineItems: z.array(lineItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
  underpayment: z.coerce.number().optional(),
}).refine(data => data.dueDate >= data.invoiceDate, {
    message: "Due date cannot be earlier than invoice date.",
    path: ["dueDate"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type LineItemFormValues = z.infer<typeof lineItemSchema>;

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { t, lang } = useLocale();
  
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAddLineItemDialogOpen, setIsAddLineItemDialogOpen] = React.useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
  });
  
  React.useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        const [invoiceData, customersData, productsData] = await Promise.all([
            getInvoiceById(id as string),
            getCustomers(),
            getProducts(),
        ]);
        
        if (!invoiceData) {
          notFound();
          return;
        }

        setInvoice(invoiceData);
        setCustomers(customersData as Customer[]);
        setProducts(productsData as Product[]);
        
        form.reset({
            customerId: invoiceData.customer.id,
            invoiceDate: parseISO(invoiceData.createdAt),
            dueDate: parseISO(invoiceData.dueDate),
            status: invoiceData.status,
            notes: invoiceData.notes,
            underpayment: invoiceData.underpayment,
            lineItems: invoiceData.lineItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            }))
        });

      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: t('invoices.edit.toast.loadErrorTitle'), description: t('invoices.edit.toast.loadErrorDesc')})
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, form, toast, t]);


  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchLineItems = form.watch('lineItems');
  const watchUnderpayment = form.watch('underpayment');

  const subtotal = React.useMemo(
    () => watchLineItems?.reduce((acc, item) => acc + item.total, 0) || 0,
    [JSON.stringify(watchLineItems)]
  );
  
  const total = subtotal + (watchUnderpayment || 0);
  
  const handleAddLineItem = (item: LineItemFormValues) => {
    const existingItemIndex = fields.findIndex(
      (field) => field.productId === item.productId
    );

    if (existingItemIndex > -1) {
      // Update existing item's quantity
      const existingItem = fields[existingItemIndex];
      const newQuantity = existingItem.quantity + item.quantity;
      const newTotal = item.unitPrice * newQuantity;
      update(existingItemIndex, {
        ...existingItem,
        quantity: newQuantity,
        unitPrice: item.unitPrice, // Also update unit price in case it was changed
        total: newTotal,
      });
    } else {
      // Add new item
      append(item);
    }
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSaving(true);
    if (!invoice) return;

    try {
      const invoicePayload = {
          customerId: data.customerId,
          subtotal: subtotal,
          tax: 0,
          discount: invoice.discount, // Assuming discount is not editable for now
          underpayment: data.underpayment || 0,
          total: total,
          status: data.status,
          dueDate: format(data.dueDate, 'yyyy-MM-dd'),
          notes: data.notes,
          customerRelationship: invoice.customerRelationship,
          paymentHistory: invoice.paymentHistory,
          lineItems: data.lineItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
      };
      
      await updateInvoice(invoice.id, invoicePayload);
      
      toast({
        variant: 'success',
        title: t('invoices.edit.toast.updatedTitle'),
        description: t('invoices.edit.toast.updatedDesc'),
      });
      router.push('/invoices');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('invoices.edit.toast.updateErrorTitle'),
        description: t('invoices.edit.toast.updateErrorDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Spinner /></div>;
  }
  
  if (!invoice) {
    return notFound();
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            {t('invoices.edit.title', { number: invoice.invoiceNumber })}
          </h1>
          <p className="text-muted-foreground">
            {t('invoices.edit.description')}
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.form.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('invoices.form.customer')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('invoices.form.selectCustomer')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('invoices.form.invoiceDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value, lang)
                              ) : (
                                <span>{t('invoices.form.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('invoices.form.dueDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value, lang)
                              ) : (
                                <span>{t('invoices.form.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('invoices.form.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('invoices.form.selectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Paid">{t('invoices.status.paid')}</SelectItem>
                          <SelectItem value="Unpaid">{t('invoices.status.unpaid')}</SelectItem>
                           <SelectItem value="Overdue">{t('invoices.status.overdue')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.form.lineItemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.form.item')}</TableHead>
                    <TableHead className="w-[120px]">{t('invoices.form.quantity')}</TableHead>
                    <TableHead className="w-[150px]">
                      {t('invoices.form.unitPrice')}
                    </TableHead>
                    <TableHead className="w-[150px] text-right">
                      {t('invoices.form.total')}
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    )}
                  {fields.map((item, index) => {
                     const product = products.find(p => p.id === item.productId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{product?.name || 'N/A'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsAddLineItemDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> {t('invoices.form.addItem')}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.form.notesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={t('invoices.form.notesPlaceholder')}
                          className="resize-none"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.form.summaryTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{t('invoices.form.subtotal')}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                 <FormField
                    control={form.control}
                    name="underpayment"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center">
                        <FormLabel>Underpayment</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-32"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('invoices.form.total')}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
    <AddLineItemDialog
        isOpen={isAddLineItemDialogOpen}
        onOpenChange={setIsAddLineItemDialogOpen}
        onAddItem={handleAddLineItem}
        products={products}
      />
    </>
  );
}
