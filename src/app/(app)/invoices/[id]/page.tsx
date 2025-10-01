'use client';
import { getCompanyProfile, getInvoiceById } from '@/lib/google-sheets';
import { notFound, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { CompanyProfile, InvoiceStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import InvoiceActions from '@/components/invoices/invoice-actions';
import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import Image from 'next/image';
import { useLocale } from '@/hooks/use-locale';

const getStatusClass = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    case 'Unpaid':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
    case 'Overdue':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
    default:
      return '';
  }
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const { t } = useLocale();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

  useEffect(() => {
    if (!id) return;
    async function fetchInvoice() {
      try {
        const [fetchedInvoice, fetchedProfile] = await Promise.all([
            getInvoiceById(id as string),
            getCompanyProfile(),
        ]);

        if (!fetchedInvoice) {
          notFound();
        } else {
          setInvoice(fetchedInvoice);
          setCompanyProfile(fetchedProfile);
        }
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);
  

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  if (!invoice || !companyProfile) {
     return notFound();
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4 print-hidden">
        <Button variant="outline" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
           <h1 className="text-2xl font-semibold md:text-3xl">
            {t('invoices.detail.title')} {invoice.invoiceNumber}
          </h1>
           <p className="text-muted-foreground">
            {t('invoices.detail.description', { customerName: invoice.customer?.name || 'N/A'})}
          </p>
        </div>
         <div className="ml-auto">
            <InvoiceActions invoice={invoice} />
        </div>
      </div>
      <Card className="max-w-4xl mx-auto p-4 sm:p-10 print:shadow-none print:border-none">
        <CardHeader className="p-6">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-4">
              {companyProfile.logoUrl && (
                <Image 
                    src={companyProfile.logoUrl} 
                    alt={companyProfile.name} 
                    width={80} 
                    height={80}
                    className="rounded-md"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold">{companyProfile.name}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {companyProfile.address}
                </p>
              </div>
            </div>
            <div className="text-right">
                <h1 className="text-3xl font-bold">{t('invoices.pdf.title')}</h1>
                <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold mb-2">{t('invoices.pdf.billTo')}</h3>
              {invoice.customer ? (
                <>
                    <p className="font-medium text-primary">{invoice.customer.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {invoice.customer.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {invoice.customer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {invoice.customer.phone}
                    </p>
                </>
              ) : (
                <p className="text-sm text-destructive">{t('invoices.detail.customerNotFound')}</p>
              )}
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="font-semibold">{t('invoices.pdf.status')}:</span>
                <Badge
                  variant="outline"
                  className={cn('justify-self-end', getStatusClass(invoice.status))}
                >
                  {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                </Badge>

                <span className="font-semibold">{t('invoices.pdf.invoiceDate')}:</span>
                <span className="text-muted-foreground">
                  {format(parseISO(invoice.createdAt), 'PPP')}
                </span>

                <span className="font-semibold">{t('invoices.pdf.dueDate')}:</span>
                <span className="text-muted-foreground">
                  {format(parseISO(invoice.dueDate), 'PPP')}
                </span>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/50">{t('invoices.form.item')}</TableHead>
                <TableHead className="w-[120px] text-center bg-muted/50">{t('invoices.form.quantity')}</TableHead>
                <TableHead className="w-[150px] text-right bg-muted/50">
                  {t('invoices.form.unitPrice')}
                </TableHead>
                <TableHead className="w-[150px] text-right bg-muted/50">{t('invoices.form.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold">{t('invoices.form.notesTitle')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="font-medium">{t('invoices.form.subtotal')}</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t('invoices.pdf.tax')} ({invoice.tax}%)</span>
                <span>{formatCurrency((invoice.subtotal * invoice.tax) / 100)}</span>
              </div>
               {invoice.discount > 0 && (
                 <div className="flex justify-between">
                    <span className="font-medium">{t('invoices.pdf.discount')}</span>
                    <span>- {formatCurrency(invoice.discount)}</span>
                 </div>
               )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('invoices.form.total')}</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 text-center text-xs text-muted-foreground">
            {t('invoices.pdf.footer')}
        </CardFooter>
      </Card>
    </div>
  );
}

    