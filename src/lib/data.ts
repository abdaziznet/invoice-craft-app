import type { Customer, Product, Invoice } from './types';

export const customers: Customer[] = [
  { id: 'cus-1', name: 'Alpha Tech', email: 'contact@alpha.tech', address: '123 Tech Street, Silicon Valley', phone: '123-456-7890' },
  { id: 'cus-2', name: 'Beta Solutions', email: 'info@betasolutions.com', address: '456 Solution Ave, New York', phone: '234-567-8901' },
  { id: 'cus-3', name: 'Gamma Corp', email: 'support@gammacorp.io', address: '789 Gamma Blvd, Austin', phone: '345-678-9012' },
];

export const products: Product[] = [
  { id: 'prod-1', name: 'Web Development', description: '10-page responsive website', unitPrice: 5000000 },
  { id: 'prod-2', name: 'UI/UX Design', description: 'Mobile app design mockups', unitPrice: 2500000 },
  { id: 'prod-3', name: 'SEO Optimization', description: 'Monthly SEO services', unitPrice: 1500000 },
  { id: 'prod-4', name: 'Logo Design', description: 'Corporate branding package', unitPrice: 1000000 },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: '2024-001',
    customer: customers[0],
    items: [
      { id: 'item-1', product: products[0], quantity: 1, total: 5000000 },
      { id: 'item-2', product: products[1], quantity: 2, total: 5000000 },
    ],
    subtotal: 10000000,
    tax: 11,
    discount: 500000,
    total: 10600000,
    status: 'Paid',
    dueDate: '2024-07-15',
    createdAt: '2024-06-15',
    customerRelationship: 'Long-term, high-value customer',
    paymentHistory: 'Always pays on time.',
  },
  {
    id: 'inv-002',
    invoiceNumber: '2024-002',
    customer: customers[1],
    items: [
      { id: 'item-3', product: products[2], quantity: 1, total: 1500000 },
    ],
    subtotal: 1500000,
    tax: 11,
    discount: 0,
    total: 1665000,
    status: 'Unpaid',
    dueDate: '2024-08-10',
    createdAt: '2024-07-10',
    customerRelationship: 'New customer',
    paymentHistory: 'First invoice with us.',
  },
  {
    id: 'inv-003',
    invoiceNumber: '2024-003',
    customer: customers[2],
    items: [
      { id: 'item-4', product: products[3], quantity: 1, total: 1000000 },
    ],
    subtotal: 1000000,
    tax: 0,
    discount: 100000,
    total: 900000,
    status: 'Overdue',
    dueDate: '2024-06-30',
    createdAt: '2024-05-30',
    customerRelationship: 'Recurring customer',
    paymentHistory: 'Has had a few late payments in the past but always pays.',
  },
];
