
'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ClientTable from '@/components/clients/client-table';
import AddClientDialog from '@/components/clients/add-client-dialog';
import type { Client } from '@/lib/types';
import { useRouter } from 'next/navigation';

type ClientPageContentProps = {
  initialClients: Client[];
};

export default function ClientPageContent({
  initialClients,
}: ClientPageContentProps) {
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();

  const refreshClients = () => {
    router.refresh();
  };
  
  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Clients</h1>
          <p className="text-muted-foreground">Manage your client database.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <ClientTable
            clients={clients}
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
