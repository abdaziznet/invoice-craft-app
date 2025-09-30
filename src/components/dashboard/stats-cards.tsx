
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';


type StatsCardsProps = {
  invoices: Invoice[];
};

export default function StatsCards({ invoices }: StatsCardsProps) {
  const { t } = useLocale();
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
  const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);

  const unpaidInvoices = invoices.filter((inv) => inv.status === 'Unpaid' || inv.status === 'Overdue');
  const pendingPayments = unpaidInvoices.reduce((acc, inv) => acc + inv.total, 0);
    
  const totalInvoices = invoices.length;

  const stats = [
    { 
        title: t('dashboard.totalRevenue'), 
        value: formatCurrency(totalRevenue), 
        icon: DollarSign,
        description: t('dashboard.revenueDesc', { count: paidInvoices.length })
    },
    { 
        title: t('dashboard.pendingPayments'), 
        value: formatCurrency(pendingPayments), 
        icon: Clock,
        description: t('dashboard.pendingDesc', { count: unpaidInvoices.length })
    },
    { 
        title: t('dashboard.totalInvoices'), 
        value: `+${totalInvoices}`, 
        icon: FileText,
        description: t('dashboard.invoicesDesc')
    },
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
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
