
'use client'

import { PlusCircle, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceTable from '@/components/invoices/invoice-table';
import { getInvoices } from '@/lib/google-sheets';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useSearch } from '@/hooks/use-search';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { searchTerm, setSearchTerm } = useSearch();
  
  useEffect(() => {
    async function fetchInvoices() {
      const invoicesData = await getInvoices();
      setInvoices(invoicesData);
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);
  
  const statusFilters: InvoiceStatus[] = ['Paid', 'Unpaid', 'Overdue'];
  const allInvoices = filteredInvoices;
  const unpaidInvoices = filteredInvoices.filter((inv) => inv.status === 'Unpaid');
  const paidInvoices = filteredInvoices.filter((inv) => inv.status === 'Paid');
  const overdueInvoices = filteredInvoices.filter((inv) => inv.status === 'Overdue');
  
  const handleExport = () => {
    const headers = [
      'Invoice Number',
      'Client Name',
      'Client Email',
      'Status',
      'Due Date',
      'Total',
      'Created At',
    ];

    const data = allInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.client.name,
      invoice.client.email,
      invoice.status,
      invoice.dueDate,
      invoice.total,
      invoice.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'invoices.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder="Search invoices..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href="/invoices/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
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
