'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Share2 } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from '@/ai/flows/pdf-generation';
import Spinner from '../ui/spinner';
import { saveAs } from 'file-saver';
import { useLocale } from '@/hooks/use-locale';
import ShareInvoiceDialog from './share-invoice-dialog';


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
  const { lang, t } = useLocale();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await generatePdf({ invoiceId: invoice.id, language: lang });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      saveAs(blob, `invoice-${invoice.invoiceNumber}.pdf`);

    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast({
        variant: 'destructive',
        title: t('invoices.table.toast.pdfErrorTitle'),
        description: t('invoices.table.toast.pdfErrorDesc'),
      })
    } finally {
        setIsGeneratingPdf(false);
    }
  }


  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          {t('invoices.actions.share')}
        </Button>
        <Button variant="outline" onClick={handleExportPdf} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? <Spinner className="mr-2"/> : <Printer className="mr-2 h-4 w-4" />}
          {isGeneratingPdf ? t('invoices.actions.generating') : t('invoices.actions.printExport')}
        </Button>
      </div>
      <ShareInvoiceDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        invoice={invoice}
      />
    </>
  );
}

    
