'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { format, addDays } from 'date-fns';
import { getCustomers, getProducts, createInvoice } from '@/lib/google-sheets';
import type { Customer, Product, InvoiceStatus } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import { ProductCombobox } from '@/components/invoices/product-combobox';


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
}).refine(data => data.dueDate >= data.invoiceDate, {
    message: "Due date cannot be earlier than invoice date.",
    path: ["dueDate"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, lang } = useLocale();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [includeTax, setIncludeTax] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      const customersData = await getCustomers();
      const productsData = await getProducts();
      setCustomers(customersData as Customer[]);
      setProducts(productsData as Product[]);
    }
    fetchData();
  }, []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date(),
      dueDate: addDays(new Date(), 7),
      status: 'Unpaid',
      lineItems: [
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
      notes: `1. Barang/jasa yang telah dibayar tidak dapat dikembalikan, kecuali terdapat kesalahan dari pihak penjual.\n2. Pembayaran dapat dilakukan secara tunai atau transfer bank sesuai tanggal jatuh tempo.\n`,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchLineItems = form.watch('lineItems');

  const subtotal = React.useMemo(
    () => watchLineItems.reduce((acc, item) => acc + item.total, 0),
    [JSON.stringify(watchLineItems)]
  );
  const tax = React.useMemo(() => includeTax ? subtotal * 0.11 : 0, [subtotal, includeTax]);
  const total = subtotal + tax;

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSaving(true);
    try {
      const invoicePayload = {
          customerId: data.customerId,
          subtotal: subtotal,
          tax: includeTax ? 11 : 0,
          discount: 0, // Not implemented in form yet
          total: total,
          status: data.status,
          dueDate: format(data.dueDate, 'yyyy-MM-dd'),
          notes: data.notes,
          customerRelationship: '', // Will be populated by default in sheets service
          paymentHistory: '', // Will be populated by default in sheets service
          lineItems: data.lineItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
      };
      
      await createInvoice(invoicePayload);
      
      toast({
        variant: 'success',
        title: t('invoices.new.toast.createdTitle'),
        description: t('invoices.new.toast.createdDesc'),
      });
      router.push('/invoices');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('invoices.new.toast.createErrorTitle'),
        description: t('invoices.new.toast.createErrorDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            {t('invoices.new.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('invoices.new.description')}
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
                        defaultValue={field.value}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  {fields.map((item, index) => {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                           <Controller
                            control={form.control}
                            name={`lineItems.${index}.productId`}
                            render={({ field }) => (
                              <ProductCombobox
                                products={products}
                                value={field.value}
                                onChange={(productId) => {
                                  const product = products.find(p => p.id === productId);
                                  if (product) {
                                    field.onChange(productId);
                                    form.setValue(`lineItems.${index}.unitPrice`, product.unitPrice);
                                    const quantity = form.getValues(`lineItems.${index}.quantity`);
                                    form.setValue(`lineItems.${index}.total`, product.unitPrice * quantity);
                                  }
                                }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const quantity = Number(e.target.value);
                                  const unitPrice = form.getValues(
                                    `lineItems.${index}.unitPrice`
                                  );
                                  field.onChange(quantity);
                                  form.setValue(
                                    `lineItems.${index}.total`,
                                    unitPrice * quantity
                                  );
                                }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={form.control}
                            name={`lineItems.${index}.unitPrice`}
                            render={({ field }) => (
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const unitPrice = Number(e.target.value);
                                  const quantity = form.getValues(
                                    `lineItems.${index}.quantity`
                                  );
                                  field.onChange(unitPrice);
                                  form.setValue(
                                    `lineItems.${index}.total`,
                                    unitPrice * quantity
                                  );
                                }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(watchLineItems[index]?.total || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
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
                onClick={() =>
                  append({
                    productId: '',
                    quantity: 1,
                    unitPrice: 0,
                    total: 0,
                  })
                }
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="include-tax">{t('invoices.form.includeTax')}</Label>
                    <Switch 
                      id="include-tax" 
                      checked={includeTax} 
                      onCheckedChange={setIncludeTax}
                    />
                  </div>
                  <span>{formatCurrency(tax)}</span>
                </div>
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
              {t('invoices.new.saveButton')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
