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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, FileText, Image as ImageIcon, Share2, Download } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from '@/ai/flows/pdf-generation';
import { generateImage } from '@/ai/flows/image-generation';
import Spinner from '../ui/spinner';
import { saveAs } from 'file-saver';


type ExportShareDialogProps = {
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

export default function ExportShareDialog({ invoice, isOpen, onOpenChange }: ExportShareDialogProps) {
  const { t, lang } = useLocale();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleShareFile = async (file: File, text: string) => {
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

  const handleCopyLink = async () => {
    setLoadingAction('link-copy');
    const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      toast({ variant: 'success', title: t('invoices.shareDialog.copySuccess') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('invoices.shareDialog.copyError') });
    } finally {
      setLoadingAction(null);
    }
  };

  const generateAndProcessPdf = async (action: 'share' | 'download') => {
    setLoadingAction(`pdf-${action}`);
    try {
      const response = await generatePdf({ invoiceId: invoice.id, language: lang });
      const blob = b64toBlob(response.pdfBase64, 'application/pdf');
      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
      if (action === 'download') {
        saveAs(blob, fileName);
      } else {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        await handleShareFile(file, `Here is the invoice ${invoice.invoiceNumber}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing PDF:`, error);
      toast({
        variant: 'destructive',
        title: t('invoices.table.toast.pdfErrorTitle'),
        description: t('invoices.table.toast.pdfErrorDesc'),
      });
    } finally {
      setLoadingAction(null);
    }
  };
  
  const generateAndProcessImage = async (action: 'share' | 'download') => {
    const format = 'jpeg';
    setLoadingAction(`image-${action}`);
    try {
        const response = await generateImage({ invoiceId: invoice.id, format });
        const imageBlob = await fetch(response.imageUrl).then(res => res.blob());
        const fileName = `invoice-${invoice.invoiceNumber}.${format}`;
        if (action === 'download') {
            saveAs(imageBlob, fileName);
        } else {
            const file = new File([imageBlob], fileName, { type: `image/${format}` });
            await handleShareFile(file, `Invoice summary for ${invoice.invoiceNumber}`);
        }
    } catch (error: any) {
      console.error(`Error ${action}ing image:`, error);
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description: 'Could not generate an image for this invoice.',
      });
    } finally {
      setLoadingAction(null);
    }
  };


  const options = [
    {
      id: 'link',
      title: t('invoices.shareDialog.shareLink'),
      icon: Link2,
      share: handleCopyLink,
      shareText: t('common.copy'),
      shareIcon: Share2,
      download: null,
    },
    {
      id: 'pdf',
      title: t('invoices.shareDialog.sharePdf'),
      icon: FileText,
      share: () => generateAndProcessPdf('share'),
      shareText: t('common.share'),
      shareIcon: Share2,
      download: () => generateAndProcessPdf('download'),
      downloadText: t('common.download'),
      downloadIcon: Download,
    },
    {
      id: 'image',
      title: t('invoices.shareDialog.shareImageJpg'),
      icon: ImageIcon,
      share: () => generateAndProcessImage('share'),
      shareText: t('common.share'),
      shareIcon: Share2,
      download: () => generateAndProcessImage('download'),
      downloadText: t('common.download'),
      downloadIcon: Download,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('invoices.shareDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('invoices.shareDialog.description', { invoiceNumber: invoice.invoiceNumber })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {options.map((option) => (
            <Card key={option.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                    <option.icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 pt-4">
                 {option.share && (
                     <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => !loadingAction && option.share()}
                        disabled={!!loadingAction}
                     >
                        {loadingAction === `${option.id}-share` ? (
                            <Spinner className="mr-2" />
                        ) : (
                            <option.shareIcon className="mr-2 h-4 w-4" />
                        )}
                        {loadingAction === `${option.id}-share` ? t('common.sharing') : option.shareText}
                     </Button>
                 )}
                 {option.download && (
                    <Button 
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => !loadingAction && option.download!()}
                        disabled={!!loadingAction}
                    >
                        {loadingAction === `${option.id}-download` ? (
                            <Spinner className="mr-2" />
                        ) : (
                            <option.downloadIcon className="mr-2 h-4 w-4" />
                        )}
                        {loadingAction === `${option.id}-download` ? t('common.downloading') : option.downloadText}
                    </Button>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
