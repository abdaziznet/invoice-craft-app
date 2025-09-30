
'use client';

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
import { useLocale } from '@/hooks/use-locale';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { searchTerm, setSearchTerm } = useSearch();
  const { t } = useLocale();
  
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
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="all">{t('invoices.tabs.all')}</TabsTrigger>
          <TabsTrigger value="paid">{t('invoices.tabs.paid')}</TabsTrigger>
          <TabsTrigger value="unpaid">{t('invoices.tabs.unpaid')}</TabsTrigger>
          <TabsTrigger value="overdue" className="text-destructive">{t('invoices.tabs.overdue')}</TabsTrigger>
        </TabsList>
        <div className="flex-1 md:ml-auto md:flex-grow-0">
            <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder={t('invoices.searchPlaceholder')}
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:flex-grow-0">
          <Button size="sm" variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link href="/invoices/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('invoices.create')}
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.title')}</CardTitle>
            <CardDescription>
              {t('invoices.description')}
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
            <CardTitle>{t('invoices.paidTitle')}</CardTitle>
            <CardDescription>
              {t('invoices.paidDescription')}
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
            <CardTitle>{t('invoices.unpaidTitle')}</CardTitle>
            <CardDescription>
              {t('invoices.unpaidDescription')}
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
            <CardTitle>{t('invoices.overdueTitle')}</CardTitle>
            <CardDescription>
              {t('invoices.overdueDescription')}
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
