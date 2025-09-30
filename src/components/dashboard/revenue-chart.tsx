
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { parseISO, getMonth } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';


type RevenueChartProps = {
  invoices: Invoice[];
};

export default function RevenueChart({ invoices }: RevenueChartProps) {
  const { t } = useLocale();
  const monthlyRevenue = Array.from({ length: 12 }, () => 0);

  invoices.forEach(invoice => {
    if (invoice.status === 'Paid') {
      const month = getMonth(parseISO(invoice.createdAt));
      monthlyRevenue[month] += invoice.total;
    }
  });
  
  const monthNames = t('months.short', { returnObjects: true }) as string[];
  const data = monthNames.map((monthName, index) => ({
    name: monthName,
    total: monthlyRevenue[index]
  }));

  const yAxisTickFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${formatCurrency(value / 1000000, true)}M`;
    }
    if (value >= 1000) {
      return `${formatCurrency(value / 1000, true)}K`;
    }
    return formatCurrency(value, true);
  };

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>{t('dashboard.monthlyRevenue')}</CardTitle>
        <CardDescription>{t('dashboard.monthlyRevenueDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisTickFormatter}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
              }}
              formatter={(value) => [formatCurrency(value as number), t('dashboard.revenue')]}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
