
'use client';

import * as React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ClientTable from '@/components/clients/client-table';
import AddClientDialog from '@/components/clients/add-client-dialog';
import type { Client } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/use-search';
import { Input } from '../ui/input';

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


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Clients</h1>
          <p className="text-muted-foreground">Manage your client database.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
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
