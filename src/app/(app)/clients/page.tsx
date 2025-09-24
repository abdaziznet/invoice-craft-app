import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ClientTable from '@/components/clients/client-table';
import { getClients } from '@/lib/google-sheets';

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Clients</h1>
          <p className="text-muted-foreground">Manage your client database.</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Client
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <ClientTable clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
