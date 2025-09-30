'use server';

import { getCustomers } from '@/lib/google-sheets';
import CustomerPageContent from '@/components/customers/customer-page-content';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <CustomerPageContent initialCustomers={customers} />;
}
