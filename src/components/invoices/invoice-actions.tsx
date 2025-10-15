'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';
import ExportShareDialog from './export-share-dialog';


type InvoiceActionsProps = {
  invoice: Invoice;
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const { t } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          {t('invoices.actions.shareExport')}
        </Button>
      </div>
      <ExportShareDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        invoice={invoice}
      />
    </>
  );
}