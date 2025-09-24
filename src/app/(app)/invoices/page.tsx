import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceTable from '@/components/invoices/invoice-table';
import { getInvoices } from '@/lib/google-sheets';
import type { InvoiceStatus } from '@/lib/types';

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const statusFilters: InvoiceStatus[] = ['Paid', 'Unpaid', 'Overdue'];
  const allInvoices = invoices;
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'Unpaid');
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
  const overdueInvoices = invoices.filter((inv) => inv.status === 'Overdue');

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="overdue" className="text-destructive">Overdue</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline">
            Export
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              Manage your invoices and track their payment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceTable invoices={allInvoices} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="paid">
        <Card>
          <CardHeader>
            <CardTitle>Paid Invoices</CardTitle>
            <CardDescription>
              These invoices have been successfully paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceTable invoices={paidInvoices} />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="unpaid">
        <Card>
          <CardHeader>
            <CardTitle>Unpaid Invoices</CardTitle>
            <CardDescription>
              These invoices are awaiting payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceTable invoices={unpaidInvoices} />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="overdue">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>
              These invoices have passed their due date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceTable invoices={overdueInvoices} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
