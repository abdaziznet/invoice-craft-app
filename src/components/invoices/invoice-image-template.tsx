import { formatCurrency } from '@/lib/utils';
import type { CompanyProfile, Invoice } from '@/lib/types';
import { format, parseISO } from 'date-fns';

type InvoiceImageTemplateProps = {
  invoice: Invoice;
  companyProfile: CompanyProfile;
};

export default function InvoiceImageTemplate({
  invoice,
  companyProfile
}: InvoiceImageTemplateProps) {
  const { customer, lineItems, subtotal, tax, total, dueDate, invoiceNumber } = invoice;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        padding: '40px',
        fontFamily: '"Inter", sans-serif',
        color: '#1f2937',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {companyProfile.logoUrl && (
            <img src={companyProfile.logoUrl} alt={companyProfile.name} style={{ width: '60px', height: '60px', marginRight: '20px', borderRadius: '8px' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{companyProfile.name}</p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, whiteSpace: 'pre-wrap', maxWidth: '250px' }}>{companyProfile.address}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <p style={{ fontSize: '40px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Invoice</p>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>#{invoiceNumber}</p>
        </div>
      </div>

      {/* Bill To & Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#6b7280', margin: 0 }}>BILL TO</p>
          <p style={{ fontSize: '20px', fontWeight: 600, margin: '4px 0 0 0' }}>{customer.name}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, whiteSpace: 'pre-wrap', maxWidth: '300px' }}>{customer.address}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '14px' }}>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, margin: 0 }}>Invoice Date:</p>
                <p style={{ margin: 0 }}>{format(parseISO(invoice.createdAt), 'PPP')}</p>
            </div>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginTop: '8px' }}>
                <p style={{ fontWeight: 700, margin: 0 }}>Due Date:</p>
                <p style={{ margin: 0 }}>{format(parseISO(dueDate), 'PPP')}</p>
            </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px', flexGrow: 1 }}>
        <div style={{ display: 'flex', backgroundColor: '#f9fafb', padding: '10px', fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>
          <p style={{ flex: '1 1 50%', margin: 0 }}>ITEM</p>
          <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>QTY</p>
          <p style={{ flex: '0 0 20%', textAlign: 'right', margin: 0 }}>PRICE</p>
          <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>TOTAL</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', border: '1px solid #f3f4f6', borderTop: 'none' }}>
          {lineItems.slice(0, 3).map((item, index) => (
            <div key={item.id} style={{ display: 'flex', padding: '10px', borderTop: index === 0 ? 'none' : '1px solid #f3f4f6' }}>
              <p style={{ flex: '1 1 50%', margin: 0 }}>{item.product.name}</p>
              <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{item.quantity}</p>
              <p style={{ flex: '0 0 20%', textAlign: 'right', margin: 0 }}>{formatCurrency(item.unitPrice)}</p>
              <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{formatCurrency(item.total)}</p>
            </div>
          ))}
          {lineItems.length > 3 && (
            <div style={{ display: 'flex', padding: '10px', borderTop: '1px solid #f3f4f6', color: '#6b7280', fontSize: '12px' }}>
                <p style={{margin: 0}}>...and {lineItems.length - 3} more items</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '280px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <p style={{ margin: 0 }}>Subtotal</p>
            <p style={{ margin: 0 }}>{formatCurrency(subtotal)}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <p style={{ margin: 0 }}>Tax ({tax}%)</p>
            <p style={{ margin: 0 }}>{formatCurrency((subtotal * tax) / 100)}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #e5e7eb', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Total</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
