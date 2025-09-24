export type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
};

export type InvoiceItem = {
  id: string;
  product: Product;
  quantity: number;
  total: number;
};

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // percentage
  discount: number; // value
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  notes?: string;
  // Fields for GenAI feature
  clientRelationship: string; 
  paymentHistory: string; 
};
