'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import StatsCards from '@/components/dashboard/stats-cards';
import RevenueChart from '@/components/dashboard/revenue-chart';
import RecentInvoices from '@/components/dashboard/recent-invoices';
import { useInvoices } from '@/hooks/use-invoices';
import { LocaleRedirect } from '@/components/locale-redirect';
import Spinner from '@/components/ui/spinner';

export default function DashboardPage() {
  const { invoices, loading } = useInvoices();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <LocaleRedirect />
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
    </>
  );
}
