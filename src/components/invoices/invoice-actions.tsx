'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import WhatsappIcon from '../icons/whatsapp-icon';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { generatePdfFlow } from '@/ai/flows/pdf-generation';
import Spinner from '../ui/spinner';

type InvoiceActionsProps = {
  invoice: Invoice;
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await generatePdfFlow({ invoiceId: invoice.id });
      const { pdfBase64 } = response;
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'Could not generate PDF for this invoice.',
      })
    } finally {
        setIsGeneratingPdf(false);
    }
  }

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
    const message = `Hi ${invoice.client.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}. You can view and save the PDF here: ${invoiceUrl}`;
    const whatsappUrl = `https://wa.me/${invoice.client.phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleShareWhatsApp}>
        <WhatsappIcon className="mr-2" />
        Share via WhatsApp
      </Button>
      <Button variant="outline" onClick={handleExportPdf} disabled={isGeneratingPdf}>
        {isGeneratingPdf ? <Spinner className="mr-2"/> : <Printer className="mr-2 h-4 w-4" />}
        {isGeneratingPdf ? 'Generating...' : 'Print / Export PDF'}
      </Button>
    </div>
  );
}
