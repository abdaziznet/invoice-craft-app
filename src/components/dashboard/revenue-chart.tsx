'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';


const data = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Feb', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Apr', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'May', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Jul', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Aug', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Sep', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Oct', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Nov', total: Math.floor(Math.random() * 5000000) + 1000000 },
  { name: 'Dec', total: Math.floor(Math.random() * 5000000) + 1000000 },
];

export default function RevenueChart() {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>An overview of your income this year.</CardDescription>
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
              tickFormatter={(value) => `${formatCurrency(value as number).slice(0, -4)}jt`}
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
