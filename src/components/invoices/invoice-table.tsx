'use client';

import { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, Trash2, Share2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import PaymentReminderModal from './payment-reminder-modal';
import { cn } from '@/lib/utils';
import DeleteConfirmationDialog from '../customers/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteInvoices as deleteInvoicesFromSheet } from '@/lib/google-sheets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '../ui/spinner';
import DataTablePagination from '../data-table-pagination';
import { useLocale } from '@/hooks/use-locale';
import ExportShareDialog from './export-share-dialog';
import { parseISO } from 'date-fns';
import { useInvoices } from '@/hooks/use-invoices';


type InvoiceTableProps = {
  invoices: Invoice[];
};

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { t, lang } = useLocale();
  const { deleteInvoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isExportShareDialogOpen, setIsExportShareDialogOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || '10');

  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof Invoice) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    // Handle nested properties or specific types if needed
    // For now we handle top-level properties. 
    // If we want to sort by customer name, we'd need special handling since customer is an object.

    let aValue: any = a[key];
    let bValue: any = b[key];

    if (key === 'dueDate') {
      aValue = new Date(a.dueDate).getTime();
      bValue = new Date(b.dueDate).getTime();
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const paginatedInvoices = sortedInvoices.slice((page - 1) * pageSize, page * pageSize);


  const getStatusClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleGenerateReminder = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsReminderModalOpen(true);
  };

  const handleShareClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsExportShareDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoiceIds([invoice.id]);
    setIsDeleteDialogOpen(true);
  }

  const handleBulkDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoicesFromSheet(selectedInvoiceIds);
      deleteInvoices(selectedInvoiceIds);
      toast({
        variant: 'success',
        title: t('invoices.table.toast.deletedTitle'),
        description: t('invoices.table.toast.deletedDesc'),
      });
      setSelectedInvoiceIds([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('invoices.table.toast.deleteErrorTitle'),
        description: t('invoices.table.toast.deleteErrorDesc'),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(invoices.map(inv => inv.id));
    } else {
      setSelectedInvoiceIds([]);
    }
  }

  const handleSelectRow = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds(prev => prev.filter(id => id !== invoiceId));
    }
  }

  const numSelected = selectedInvoiceIds.length;
  const rowCount = invoices.length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2 px-4 sm:px-0">
        {numSelected > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('invoices.table.deleteSelected', { count: numSelected })}
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary/90">
              <TableHead className="w-[40px] text-primary-foreground">
                <Checkbox
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  checked={rowCount > 0 && numSelected === rowCount}
                  aria-label="Select all"
                  className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                />
              </TableHead>
              <TableHead className="hidden sm:table-cell text-primary-foreground">{t('invoices.table.header.invoice')}</TableHead>
              <TableHead className="text-primary-foreground">{t('invoices.table.header.customer')}</TableHead>
              <TableHead className="text-primary-foreground">{t('invoices.table.header.status')}</TableHead>
              <TableHead className="hidden md:table-cell text-primary-foreground">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent hover:text-primary-foreground/80 text-primary-foreground"
                  onClick={() => handleSort('dueDate')}
                >
                  {t('invoices.table.header.dueDate')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right text-primary-foreground">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent hover:text-primary-foreground/80 text-primary-foreground"
                  onClick={() => handleSort('total')}
                >
                  {t('invoices.table.header.total')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right w-[50px] text-primary-foreground">{t('invoices.table.header.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                data-state={selectedInvoiceIds.includes(invoice.id) && "selected"}
              >
                <TableCell>
                  <Checkbox
                    onCheckedChange={(checked) => handleSelectRow(invoice.id, checked as boolean)}
                    checked={selectedInvoiceIds.includes(invoice.id)}
                    aria-label={`Select row ${invoice.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium hidden sm:table-cell">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customer ? invoice.customer.name : 'Customer not found'}</TableCell>
                <TableCell>
                  <Badge className={cn(getStatusClass(invoice.status))} variant="outline">{t(`invoices.status.${invoice.status.toLowerCase()}`)}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(parseISO(invoice.dueDate), lang)}</TableCell>
                <TableCell className="text-right text-xs md:text-sm">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-right">
                  {isProcessing === invoice.id ? <Spinner /> : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('invoices.table.actions.title')}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}`}>{t('invoices.table.actions.view')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}/edit`}>{t('invoices.table.actions.edit')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareClick(invoice)}>
                          <Share2 className="mr-2 h-4 w-4" /> {t('invoices.table.actions.shareExport')}
                        </DropdownMenuItem>
                        {invoice.status === 'Overdue' && (
                          <DropdownMenuItem onClick={() => handleGenerateReminder(invoice)}>
                            {t('invoices.table.actions.generateReminder')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => handleDeleteClick(invoice)}
                        >
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        count={invoices.length}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
      />
      {selectedInvoice && (
        <PaymentReminderModal
          invoice={selectedInvoice}
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
        />
      )}
      {selectedInvoice && (
        <ExportShareDialog
          invoice={selectedInvoice}
          isOpen={isExportShareDialogOpen}
          onOpenChange={setIsExportShareDialogOpen}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemsDescription={numSelected > 1 ? t('invoices.table.deleteDesc', { count: numSelected }) : t('invoices.table.deleteDescSingle', { number: invoices.find(inv => inv.id === selectedInvoiceIds[0])?.invoiceNumber })}
      />
    </>
  );
}


