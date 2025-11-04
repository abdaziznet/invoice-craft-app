'use client';

import { useContext } from 'react';
import { InvoiceContext } from '@/context/invoice-context';

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};
