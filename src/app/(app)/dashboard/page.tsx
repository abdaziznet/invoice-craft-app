import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import StatsCards from '@/components/dashboard/stats-cards';
import RevenueChart from '@/components/dashboard/revenue-chart';
import RecentInvoices from '@/components/dashboard/recent-invoices';
import { getInvoices } from '@/lib/google-sheets';

export default async function DashboardPage() {
  const invoices = await getInvoices();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard</h1>
        <Button asChild>
          <Link href="/invoices/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Invoice
          </Link>
        </Button>
      </div>
      <StatsCards invoices={invoices} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart invoices={invoices} />
        <RecentInvoices invoices={invoices} />
      </div>
    </div>
  );
}
