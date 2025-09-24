import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { invoices } from '@/lib/data';

export default function StatsCards() {
  const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.total, 0);
  const pendingPayments = invoices.filter(inv => inv.status !== 'Paid').reduce((acc, inv) => acc + inv.total, 0);
  const totalInvoices = invoices.length;
  
  const stats = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: '+20.1% from last month' },
    { title: 'Pending Payments', value: formatCurrency(pendingPayments), icon: Clock, change: '+180.1% from last month' },
    { title: 'Total Invoices', value: totalInvoices, icon: FileText, change: '+19% from last month' },
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
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
