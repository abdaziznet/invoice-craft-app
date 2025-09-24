import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/types';

type StatsCardsProps = {
  invoices: Invoice[];
};

export default function StatsCards({ invoices }: StatsCardsProps) {
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((acc, inv) => acc + inv.total, 0);

  const pendingPayments = invoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((acc, inv) => acc + inv.total, 0);
    
  const totalInvoices = invoices.length;

  const stats = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign },
    { title: 'Pending Payments', value: formatCurrency(pendingPayments), icon: Clock },
    { title: 'Total Invoices', value: `+${totalInvoices}`, icon: FileText },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              Based on {totalInvoices} invoices
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
