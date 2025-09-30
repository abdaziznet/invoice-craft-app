
'use client';

import * as React from 'react';
import { PlusCircle, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ClientTable from '@/components/clients/client-table';
import AddClientDialog from '@/components/clients/add-client-dialog';
import type { Client } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/use-search';
import { Input } from '../ui/input';
import { useLocale } from '@/hooks/use-locale';

type ClientPageContentProps = {
  initialClients: Client[];
};

export default function ClientPageContent({
  initialClients,
}: ClientPageContentProps) {
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();
  const { t } = useLocale();

  const refreshClients = () => {
    router.refresh();
  };
  
  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const filteredClients = React.useMemo(() => {
    if (!searchTerm) {
      return clients;
    }
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address'];
    const data = filteredClients.map(client => [
      client.id,
      client.name,
      client.email,
      client.phone,
      `"${client.address.replace(/"/g, '""')}"`,
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
    link.setAttribute('download', 'clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{t('clients.title')}</h1>
          <p className="text-muted-foreground">{t('clients.description')}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('clients.searchPlaceholder')}
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
            {t('clients.addNew')}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 sm:p-6">
          <ClientTable
            clients={filteredClients}
            onClientUpdated={refreshClients}
            onClientDeleted={refreshClients}
          />
        </CardContent>
      </Card>
      <AddClientDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onClientAdded={refreshClients}
      />
    </div>
  );
}
