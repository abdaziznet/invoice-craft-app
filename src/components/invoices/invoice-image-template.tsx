import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';

type InvoiceImageTemplateProps = {
  invoice: Invoice;
};

const getStatusStyles = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid':
      return {
        backgroundColor: '#e6fffa',
        color: '#00796b',
        borderColor: '#4db6ac',
      };
    case 'Unpaid':
      return {
        backgroundColor: '#fffbeb',
        color: '#b45309',
        borderColor: '#fcd34d',
      };
    case 'Overdue':
      return {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderColor: '#fca5a5',
      };
    default:
      return {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        borderColor: '#d1d5db',
      };
  }
};

export default function InvoiceImageTemplate({
  invoice,
}: InvoiceImageTemplateProps) {
  const statusStyles = getStatusStyles(invoice.status);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        padding: '50px',
        fontFamily: '"Inter", sans-serif',
        color: '#1f2937',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, margin: 0 }}>
            Invoice Summary
          </h1>
          <p style={{ fontSize: '24px', color: '#6b7280', marginTop: '8px' }}>
            #{invoice.invoiceNumber}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            padding: '12px 24px',
            borderRadius: '9999px',
            fontSize: '24px',
            fontWeight: 600,
            border: `2px solid ${statusStyles.borderColor}`,
            ...statusStyles,
          }}
        >
          {invoice.status}
        </div>
      </div>

      <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '22px', color: '#6b7280', margin: 0 }}>
          Billed to
        </p>
        <p style={{ fontSize: '32px', fontWeight: 600, marginTop: '4px' }}>
          {invoice.customer.name}
        </p>
      </div>

      <div
        style={{
          marginTop: 'auto',
          borderTop: '2px solid #e5e7eb',
          paddingTop: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '22px', color: '#6b7280', margin: 0 }}>
            Due Date
          </p>
          <p style={{ fontSize: '32px', fontWeight: 600, marginTop: '4px' }}>
            {format(parseISO(invoice.dueDate), 'PPP')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
          <p style={{ fontSize: '28px', color: '#6b7280', margin: 0 }}>
            Total Amount
          </p>
          <p
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#0369a1',
              marginTop: '4px',
              lineHeight: 1,
            }}
          >
            {formatCurrency(invoice.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
