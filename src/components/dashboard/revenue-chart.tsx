
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { parseISO, getMonth } from 'date-fns';

type RevenueChartProps = {
  invoices: Invoice[];
};

export default function RevenueChart({ invoices }: RevenueChartProps) {
  const monthlyRevenue = Array.from({ length: 12 }, () => 0);

  invoices.forEach(invoice => {
    if (invoice.status === 'Paid') {
      const month = getMonth(parseISO(invoice.createdAt));
      monthlyRevenue[month] += invoice.total;
    }
  });

  const data = [
    { name: 'Jan', total: monthlyRevenue[0] },
    { name: 'Feb', total: monthlyRevenue[1] },
    { name: 'Mar', total: monthlyRevenue[2] },
    { name: 'Apr', total: monthlyRevenue[3] },
    { name: 'May', total: monthlyRevenue[4] },
    { name: 'Jun', total: monthlyRevenue[5] },
    { name: 'Jul', total: monthlyRevenue[6] },
    { name: 'Aug', total: monthlyRevenue[7] },
    { name: 'Sep', total: monthlyRevenue[8] },
    { name: 'Oct', total: monthlyRevenue[9] },
    { name: 'Nov', total: monthlyRevenue[10] },
    { name: 'Dec', total: monthlyRevenue[11] },
  ];
  
  const yAxisTickFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${formatCurrency(value / 1000000)}M`;
    }
    if (value >= 1000) {
      return `${formatCurrency(value / 1000)}K`;
    }
    return formatCurrency(value);
  };

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>An overview of your income this year based on paid invoices.</CardDescription>
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
              formatter={(value) => [formatCurrency(value as number), 'Revenue']}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
