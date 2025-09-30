
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
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { parseISO, compareDesc } from 'date-fns';
import { useLocale } from '@/hooks/use-locale';

type RecentInvoicesProps = {
  invoices: Invoice[];
};

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const { t } = useLocale();

  const recentInvoices = invoices
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

  const getBadgeVariant = (status: InvoiceStatus): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Unpaid':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
    }
  }

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
                  <>
                    <AvatarImage src={`https://picsum.photos/seed/${invoice.customer.id}/40/40`} alt="Avatar" data-ai-hint="person portrait"/>
                    <AvatarFallback>{getInitials(invoice.customer.name)}</AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback>??</AvatarFallback>
                )}
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {invoice.customer ? invoice.customer.name : 'Customer not found'}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer ? invoice.customer.email : ''}
              </p>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
              <Badge variant={getBadgeVariant(invoice.status)} className="mt-1">{invoice.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
