
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function InvoiceActions() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print / Export PDF
    </Button>
  );
}
