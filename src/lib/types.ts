export type Customer = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
};

export type Product = {
  id: string;
  name: string;
  unitPrice: number;
  unit: 'pcs' | 'boxes';
};

export type InvoiceItem = {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number; // The price at the time of invoice creation
  total: number;
};

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';

export type Invoice = {
  id:string;
  invoiceNumber: string;
  customer: Customer;
  lineItems: InvoiceItem[];
  subtotal: number;
  tax: number; // percentage
  discount: number; // value
  underpayment: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  notes?: string;
  // Fields for GenAI feature
  customerRelationship: string; 
  paymentHistory: string; 
};

export type CompanyProfile = {
    name: string;
    address: string;
    logoUrl: string;
    currency: 'IDR' | 'USD';
    language: 'id' | 'en';
};
