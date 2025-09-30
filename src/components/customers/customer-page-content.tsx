'use client';

import * as React from 'react';
import { PlusCircle, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CustomerTable from '@/components/customers/customer-table';
import AddCustomerDialog from '@/components/customers/add-customer-dialog';
import type { Customer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/use-search';
import { Input } from '../ui/input';
import { useLocale } from '@/hooks/use-locale';

type CustomerPageContentProps = {
  initialCustomers: Customer[];
};

export default function CustomerPageContent({
  initialCustomers,
}: CustomerPageContentProps) {
  const [customers, setCustomers] = React.useState<Customer[]>(initialCustomers);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();
  const { t } = useLocale();

  const refreshCustomers = () => {
    router.refresh();
  };
  
  React.useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address'];
    const data = filteredCustomers.map(customer => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      `"${customer.address.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{t('customers.title')}</h1>
          <p className="text-muted-foreground">{t('customers.description')}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('customers.searchPlaceholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleExport} className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('customers.addNew')}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 sm:p-6">
          <CustomerTable
            customers={filteredCustomers}
            onCustomerUpdated={refreshCustomers}
            onCustomerDeleted={refreshCustomers}
          />
        </CardContent>
      </Card>
      <AddCustomerDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCustomerAdded={refreshCustomers}
      />
    </div>
  );
}
