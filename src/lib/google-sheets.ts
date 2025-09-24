import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const getClient = () => {
  const client = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return client;
};

const sheets = google.sheets({ version: 'v4', auth: getClient() });

async function getSheetData(range: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Could not fetch data from Google Sheets.');
  }
}

function mapToObjects(data: any[][] | null | undefined) {
  if (!data || data.length < 2) {
    return [];
  }
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row) => {
    const obj: { [key: string]: any } = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

export async function getClients() {
  const data = await getSheetData('Clients!A:E');
  return mapToObjects(data);
}

export async function getProducts() {
  const data = await getSheetData('Products!A:D');
  const products = mapToObjects(data);
  return products.map(p => ({...p, unitPrice: parseFloat(p.unitPrice) }));
}

export async function getInvoices() {
    const data = await getSheetData('Invoices!A:L');
    const invoices = mapToObjects(data);
    const clients = await getClients();
    const products = await getProducts();

    const invoiceItemsData = await getSheetData('InvoiceItems!A:D');
    const invoiceItems = mapToObjects(invoiceItemsData);


    return invoices.map(inv => {
        const client = clients.find(c => c.id === inv.clientId);
        const items = invoiceItems
            .filter(item => item.invoiceId === inv.id)
            .map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    id: item.id,
                    product: product,
                    quantity: parseInt(item.quantity, 10),
                    total: parseFloat(item.total),
                }
            });

        return {
            ...inv,
            client,
            items,
            subtotal: parseFloat(inv.subtotal),
            tax: parseFloat(inv.tax),
            discount: parseFloat(inv.discount),
            total: parseFloat(inv.total),
        }
    });
}
