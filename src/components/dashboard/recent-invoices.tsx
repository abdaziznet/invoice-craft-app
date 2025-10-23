'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { parseISO, compareDesc } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';

type RecentInvoicesProps = {
  invoices: Invoice[];
};

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const { t } = useLocale();

  const uniqueInvoices = Array.from(new Map(invoices.map(inv => [inv.id, inv])).values());

  const recentInvoices = uniqueInvoices
    .filter(invoice => !!invoice.customer) // Filter out invoices without a customer
    .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)))
    .slice(0, 5);

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }
  
  const generateAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 80%)`;
  };

  const getStatusClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      default:
        return '';
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>{t('dashboard.recentInvoices')}</CardTitle>
          <CardDescription>
            {t('dashboard.recentInvoicesDesc', { count: invoices.length })}
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/invoices">
            {t('common.viewAll')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-8">
        {recentInvoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center gap-4">
             <Avatar className="hidden h-9 w-9 sm:flex">
                {invoice.customer ? (
                  <AvatarFallback style={{ backgroundColor: generateAvatarColor(invoice.customer.name) }}>
                    {getInitials(invoice.customer.name)}
                  </AvatarFallback>
                ) : (
                  <AvatarFallback>??</AvatarFallback>
                )}
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {invoice.customer.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer.email}
              </p>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
               <Badge variant="outline" className={cn('mt-1', getStatusClass(invoice.status))}>
                {t(`invoices.status.${invoice.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
