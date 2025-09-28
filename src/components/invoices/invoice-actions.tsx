'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function InvoiceActions() {
  const params = useParams();
  const { id } = params;

  const handlePrint = () => {
    if (typeof window !== 'undefined' && id) {
       const printWindow = window.open(`/invoices/${id}?print=true`, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          alert('Please allow pop-ups for this site to export the PDF.');
        }
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print / Export PDF
    </Button>
  );
}
