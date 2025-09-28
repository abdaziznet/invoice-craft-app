'use server';

import { getClients } from '@/lib/google-sheets';
import ClientPageContent from '@/components/clients/client-page-content';

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientPageContent initialClients={clients} />;
}
