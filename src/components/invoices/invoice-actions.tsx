'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Share2 } from 'lucide-react';
import WhatsappIcon from '../icons/whatsapp-icon';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { generatePdf } from '@/ai/flows/pdf-generation';
import Spinner from '../ui/spinner';
import { saveAs } from 'file-saver';


type InvoiceActionsProps = {
  invoice: Invoice;
}

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


export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await generatePdf({ invoiceId: invoice.id });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      saveAs(blob, `invoice-${invoice.invoiceNumber}.pdf`);

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

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await generatePdf({ invoiceId: invoice.id });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      const file = new File([blob], `invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
      
      const shareData = {
        files: [file],
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Hi ${invoice.customer.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}.`,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
         // Fallback for desktop or unsupported browsers
         toast({
            title: "Web Share not supported",
            description: "Your browser doesn't support sharing files directly. Opening WhatsApp with a link instead.",
          });
         const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
         const message = `Hi ${invoice.customer.name}, here is your invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}. You can view it here: ${invoiceUrl}`;
         const whatsappUrl = `https://wa.me/${invoice.customer.phone}?text=${encodeURIComponent(message)}`;
         window.open(whatsappUrl, '_blank');
      }

    } catch (error) {
       console.error("Failed to share invoice", error);
       toast({
         variant: 'destructive',
         title: 'Sharing Failed',
         description: 'Could not share the invoice. Please try again.',
       })
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleShare} disabled={isSharing}>
        {isSharing ? <Spinner className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
        {isSharing ? 'Preparing...' : 'Share Invoice'}
      </Button>
      <Button variant="outline" onClick={handleExportPdf} disabled={isGeneratingPdf}>
        {isGeneratingPdf ? <Spinner className="mr-2"/> : <Printer className="mr-2 h-4 w-4" />}
        {isGeneratingPdf ? 'Generating...' : 'Print / Export PDF'}
      </Button>
    </div>
  );
}
