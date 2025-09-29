'use client';

import { Button } from '@/components/ui/button';
import { Printer, Share } from 'lucide-react';
import WhatsappIcon from '../icons/whatsapp-icon';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

type InvoiceActionsProps = {
  invoice: Invoice;
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined' && invoice.id) {
       const printWindow = window.open(`/invoices/${invoice.id}?print=true`, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          toast({
            variant: "destructive",
            title: "Popup Blocked",
            description: "Please allow pop-ups for this site to export the PDF.",
          });
        }
    }
  };

  const handleShareWhatsApp = () => {
    if (!invoice.client.phone) {
      toast({
        variant: "destructive",
        title: "Missing Phone Number",
        description: "This client does not have a phone number saved.",
      });
      return;
    }

    const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
    const message = `Hi ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}. You can view it here: ${invoiceUrl}`;
    const whatsappUrl = `https://wa.me/${invoice.client.phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleShareWhatsApp}>
        <WhatsappIcon className="mr-2" />
        Share via WhatsApp
      </Button>
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print / Export PDF
      </Button>
    </div>
  );
}
