
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
import { formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import PaymentReminderModal from './payment-reminder-modal';
import { cn } from '@/lib/utils';
import DeleteConfirmationDialog from '../clients/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteInvoices } from '@/lib/google-sheets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generatePdf } from '@/ai/flows/pdf-generation';
import { saveAs } from 'file-saver';
import Spinner from '../ui/spinner';
import DataTablePagination from '../data-table-pagination';
import { useLocale } from '@/hooks/use-locale';


type InvoiceTableProps = {
  invoices: Invoice[];
};

const b64toBlob = (b64Data: string, contentType='', sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
    
  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLocale();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || '10');

  const paginatedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);


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
    setIsModalOpen(true);
  };
  
  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoiceIds([invoice.id]);
    setIsDeleteDialogOpen(true);
  }
  
  const handleBulkDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  }

  const handleExportPdf = async (invoice: Invoice) => {
    setIsProcessing(invoice.id);
    try {
        const response = await generatePdf({ invoiceId: invoice.id });
        const blob = b64toBlob(response.pdfBase64, 'application/pdf');
        saveAs(blob, `invoice-${invoice.invoiceNumber}.pdf`);

    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({
            variant: 'destructive',
            title: t('invoices.table.toast.pdfErrorTitle'),
            description: t('invoices.table.toast.pdfErrorDesc'),
        });
    } finally {
        setIsProcessing(null);
    }
  };

  const handleShare = async (invoice: Invoice) => {
    setIsProcessing(invoice.id);
    try {
      const response = await generatePdf({ invoiceId: invoice.id });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      const file = new File([blob], `invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
      
      const shareData = {
        files: [file],
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Hi ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}.`,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
         toast({
            title: t('invoices.table.toast.shareUnsupportedTitle'),
            description: t('invoices.table.toast.shareUnsupportedDesc'),
          });
         const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
         const message = `Hi ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}. You can view it here: ${invoiceUrl}`;
         const whatsappUrl = `https://wa.me/${invoice.client.phone}?text=${encodeURIComponent(message)}`;
         window.open(whatsappUrl, '_blank');
      }

    } catch (error) {
       console.error("Failed to share invoice", error);
       toast({
         variant: 'destructive',
         title: t('invoices.table.toast.shareErrorTitle'),
         description: t('invoices.table.toast.shareErrorDesc'),
       })
    } finally {
        setIsProcessing(null);
    }
  };


  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoices(selectedInvoiceIds);
      toast({
        title: t('invoices.table.toast.deletedTitle'),
        description: t('invoices.table.toast.deletedDesc'),
      });
      router.refresh();
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
      <div className="mb-4 flex items-center gap-2">
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
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  checked={rowCount > 0 && numSelected === rowCount}
                  aria-label="Select all"
                 />
              </TableHead>
              <TableHead>{t('invoices.table.header.invoice')}</TableHead>
              <TableHead>{t('invoices.table.header.client')}</TableHead>
              <TableHead>{t('invoices.table.header.status')}</TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  {t('invoices.table.header.dueDate')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                 <Button variant="ghost" className="p-0 hover:bg-transparent">
                  {t('invoices.table.header.total')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right w-[50px]">{t('invoices.table.header.actions')}</TableHead>
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
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.client.name}</TableCell>
                <TableCell>
                  <Badge className={cn(getStatusClass(invoice.status))} variant="outline">{invoice.status}</Badge>
                </TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-right">
                  {isProcessing === invoice.id ? <Spinner/> : (
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
                      <DropdownMenuItem onClick={() => handleExportPdf(invoice)}>
                         {t('invoices.table.actions.exportPdf')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(invoice)}>
                         <Share2 className="mr-2 h-4 w-4" /> {t('invoices.table.actions.share')}
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
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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

    