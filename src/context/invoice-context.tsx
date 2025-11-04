'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { getInvoices as fetchInvoices } from '@/lib/google-sheets';
import type { Invoice } from '@/lib/types';

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoiceId: string, updatedInvoice: Invoice) => void;
  deleteInvoices: (invoiceIds: string[]) => void;
  refreshInvoices: () => Promise<void>;
}

export const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshInvoices = async () => {
    setLoading(true);
    try {
      const invoicesData = await fetchInvoices();
      const uniqueInvoices = Array.from(new Map(invoicesData.map(inv => [inv.id, inv])).values());
      setInvoices(uniqueInvoices);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const updateInvoice = (invoiceId: string, updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));
  };

  const deleteInvoices = (invoiceIds: string[]) => {
    setInvoices(prev => prev.filter(inv => !invoiceIds.includes(inv.id)));
  };

  return (
    <InvoiceContext.Provider value={{ invoices, loading, addInvoice, updateInvoice, deleteInvoices, refreshInvoices }}>
      {children}
    </InvoiceContext.Provider>
  );
};
