import { formatCurrency, formatDate } from '@/lib/utils';
import type { CompanyProfile, Invoice } from '@/lib/types';
import { parseISO } from 'date-fns';

type InvoiceImageTemplateProps = {
  invoice: Invoice;
  companyProfile: CompanyProfile;
  t: (key: string, options?: any) => string;
};

export default function InvoiceImageTemplate({
  invoice,
  companyProfile,
  t
}: InvoiceImageTemplateProps) {
  const { customer, lineItems, subtotal, tax, total, dueDate, invoiceNumber, notes, underPayment } = invoice;
  const lang = companyProfile.language;

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
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {companyProfile.logoUrl && (
            <img src={companyProfile.logoUrl} alt={companyProfile.name} style={{ width: '60px', height: '60px', marginRight: '20px', borderRadius: '8px' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{companyProfile.name}</p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, whiteSpace: 'pre-wrap', maxWidth: '250px' }}>{companyProfile.address}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <p style={{ fontSize: '40px', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{t('invoices.pdf.title')}</p>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>#{invoiceNumber}</p>
        </div>
      </div>

      {/* Bill To & Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#6b7280', margin: 0 }}>{t('invoices.pdf.billTo')}</p>
          <p style={{ fontSize: '20px', fontWeight: 600, margin: '4px 0 0 0' }}>{customer.name}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, whiteSpace: 'pre-wrap', maxWidth: '300px' }}>{customer.address}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '14px', gap: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '12px', maxWidth: '250px' }}>
            <p style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>{t('invoices.pdf.invoiceDate')}:</p>
            <p style={{ margin: 0, textAlign: 'right', wordBreak: 'keep-all' }}>{formatDate(parseISO(invoice.createdAt), lang)}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '12px', maxWidth: '250px' }}>
            <p style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>{t('invoices.pdf.dueDate')}:</p>
            <p style={{ margin: 0, textAlign: 'right', wordBreak: 'keep-all' }}>{formatDate(parseISO(dueDate), lang)}</p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px', flexGrow: 1 }}>
        <div style={{ display: 'flex', backgroundColor: '#1d80a0', padding: '10px', fontSize: '14px', fontWeight: 900, color: '#f8f8f8' }}>
          <p style={{ flex: '1 1 50%', margin: 0 }}>{t('invoices.form.item')}</p>
          <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{t('invoices.form.quantity')}</p>
          <p style={{ flex: '0 0 20%', textAlign: 'right', margin: 0 }}>{t('invoices.form.unitPrice')}</p>
          <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{t('invoices.form.total')}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', border: '1px solid #f3f4f6', borderTop: 'none' }}>
          {lineItems.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', padding: '10px', borderTop: index === 0 ? 'none' : '1px solid #f3f4f6' }}>
              <p style={{ flex: '1 1 50%', margin: 0 }}>{item.product.name}</p>
              <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{item.quantity}</p>
              <p style={{ flex: '0 0 20%', textAlign: 'right', margin: 0 }}>{formatCurrency(item.unitPrice)}</p>
              <p style={{ flex: '0 0 15%', textAlign: 'right', margin: 0 }}>{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Notes & Summary */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '20px' }}>
        {/* Notes Section */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '50%', fontSize: '12px' }}>
          {notes && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>{t('invoices.form.notesTitle')}</p>
              <p style={{ margin: 0, color: '#6b7280', whiteSpace: 'pre-wrap' }}>{notes}</p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '280px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <p style={{ margin: 0 }}>{t('invoices.form.subtotal')}</p>
            <p style={{ margin: 0 }}>{formatCurrency(subtotal)}</p>
          </div>
          {underPayment > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <p style={{ margin: 0 }}>Kurang Bayar</p>
                <p style={{ margin: 0 }}>{formatCurrency(underPayment)}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #e5e7eb', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{t('invoices.form.total')}</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}