

import { getInvoiceById } from '@/lib/google-sheets';
import { notFound } from 'next/navigation';
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
import { ArrowLeft, Printer } from 'lucide-react';
import type { InvoiceStatus } from '@/lib/types';
import { format } from 'date-fns';
import InvoiceActions from '@/components/invoices/invoice-actions';

type InvoiceDetailPageProps = {
  params: {
    id: string;
  };
};

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

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const invoice = await getInvoiceById(params.id);

  if (!invoice) {
    notFound();
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
            Invoice {invoice.invoiceNumber}
          </h1>
           <p className="text-muted-foreground">
            Details for invoice to {invoice.client.name}.
          </p>
        </div>
         <div className="ml-auto">
            <InvoiceActions />
        </div>
      </div>
      <Card className="max-w-4xl mx-auto p-4 sm:p-10 print:shadow-none print:border-none">
        <CardHeader className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Invoice</h1>
              <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold">Sumber Rejeki Frozen Foods</h2>
              <p className="text-sm text-muted-foreground">
                Pasar Patra
                <br />
                West Jakarta 11510
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <p className="font-medium text-primary">{invoice.client.name}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.client.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.client.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.client.phone}
              </p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="font-semibold">Status:</span>
                <Badge
                  variant="outline"
                  className={cn('justify-self-end', getStatusClass(invoice.status))}
                >
                  {invoice.status}
                </Badge>

                <span className="font-semibold">Invoice Date:</span>
                <span className="text-muted-foreground">
                  {format(new Date(invoice.createdAt), 'PPP')}
                </span>

                <span className="font-semibold">Due Date:</span>
                <span className="text-muted-foreground">
                  {format(new Date(invoice.dueDate), 'PPP')}
                </span>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[120px] text-center">Quantity</TableHead>
                <TableHead className="w-[150px] text-right">
                  Unit Price
                </TableHead>
                <TableHead className="w-[150px] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.product.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.product.unitPrice * item.quantity)}
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
                  <h4 className="font-semibold">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tax ({invoice.tax}%)</span>
                <span>{formatCurrency((invoice.subtotal * invoice.tax) / 100)}</span>
              </div>
               {invoice.discount > 0 && (
                 <div className="flex justify-between">
                    <span className="font-medium">Discount</span>
                    <span>- {formatCurrency(invoice.discount)}</span>
                 </div>
               )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 text-center text-xs text-muted-foreground">
            Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  );
}
