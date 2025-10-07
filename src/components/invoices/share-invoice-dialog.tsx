'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, FileText, Image as ImageIcon, Copy } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from '@/ai/flows/pdf-generation';
import { generateImage } from '@/ai/flows/image-generation';
import Spinner from '../ui/spinner';
import { saveAs } from 'file-saver';


type ShareInvoiceDialogProps = {
  invoice: Invoice;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
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
  
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };

export default function ShareInvoiceDialog({ invoice, isOpen, onOpenChange }: ShareInvoiceDialogProps) {
  const { t, lang } = useLocale();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<'link' | 'pdf' | 'image' | null>(null);

  const handleShare = async (file: File, text: string) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoiceNumber}`,
          text: text,
        });
      } catch (error) {
        console.error('Error sharing file:', error);
        toast({
          variant: 'destructive',
          title: t('invoices.table.toast.shareErrorTitle'),
          description: t('invoices.table.toast.shareErrorDesc'),
        });
      }
    } else {
      toast({
        title: t('invoices.table.toast.shareUnsupportedTitle'),
        description: t('invoices.table.toast.shareUnsupportedDesc'),
      });
      // As a fallback, we can save the file
      saveAs(file);
    }
  };

  const onShareLink = async () => {
    setLoadingAction('link');
    const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      toast({ title: t('invoices.shareDialog.copySuccess') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('invoices.shareDialog.copyError') });
    } finally {
      setLoadingAction(null);
    }
  };

  const onSharePdf = async () => {
    setLoadingAction('pdf');
    try {
      const response = await generatePdf({ invoiceId: invoice.id, language: lang });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      const file = new File([blob], `invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
      await handleShare(file, `Here is the invoice ${invoice.invoiceNumber}`);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      toast({
        variant: 'destructive',
        title: t('invoices.table.toast.pdfErrorTitle'),
        description: t('invoices.table.toast.pdfErrorDesc'),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const onShareImage = async () => {
    setLoadingAction('image');
    try {
        const response = await generateImage({ invoiceId: invoice.id });
        const imageBlob = await fetch(response.imageUrl).then(res => res.blob());
        const file = new File([imageBlob], `invoice-${invoice.invoiceNumber}.png`, { type: 'image/png' });

        await handleShare(file, `Invoice summary for ${invoice.invoiceNumber}`);
    } catch (error: any) {
      console.error('Error sharing image:', error);
      let description = 'Could not generate an image for this invoice.';
      if (typeof error.message === 'string' && error.message.includes('SERVICE_DISABLED')) {
          description = 'The Generative Language API is not enabled for your project. Please enable it in your Google Cloud Console and try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const shareOptions = [
    {
      title: t('invoices.shareDialog.shareLink'),
      description: t('invoices.shareDialog.shareLinkDesc'),
      icon: Link2,
      action: onShareLink,
      loading: loadingAction === 'link',
    },
    {
      title: t('invoices.shareDialog.sharePdf'),
      description: t('invoices.shareDialog.sharePdfDesc'),
      icon: FileText,
      action: onSharePdf,
      loading: loadingAction === 'pdf',
    },
    {
      title: t('invoices.shareDialog.shareImage'),
      description: t('invoices.shareDialog.shareImageDesc'),
      icon: ImageIcon,
      action: onShareImage,
      loading: loadingAction === 'image',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invoices.shareDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('invoices.shareDialog.description', { invoiceNumber: invoice.invoiceNumber })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shareOptions.map((option) => (
            <Card
              key={option.title}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => !option.loading && option.action()}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <option.icon className="h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{option.title}</CardTitle>
                {option.loading && <Spinner className="ml-auto" />}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
