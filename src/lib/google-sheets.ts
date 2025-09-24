
'use server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { Client, Invoice, InvoiceItem, Product } from './types';

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

export async function createClient(clientData: Omit<Client, 'id'>) {
    try {
        const clientsData = (await getSheetData('Clients!A:A')) || [['id']];
        const newClientId = `cli-${clientsData.length}`;

        const newClientRow = [
            newClientId,
            clientData.name,
            clientData.email,
            clientData.address,
            clientData.phone,
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Clients!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newClientRow],
            },
        });

        return { id: newClientId };
    } catch (error) {
        console.error('Error creating client:', error);
        throw new Error('Could not create client in Google Sheets.');
    }
}

export async function updateClient(clientId: string, clientData: Partial<Omit<Client, 'id'>>) {
    try {
        const clientsData = await getSheetData('Clients!A:E');
        if (!clientsData) {
            throw new Error('Could not fetch clients data.');
        }

        const headers = clientsData[0];
        const clientRowIndex = clientsData.findIndex(row => row[0] === clientId);

        if (clientRowIndex === -1) {
            throw new Error('Client not found.');
        }

        const updatedRow = headers.map((header: string) => {
            if (header in clientData) {
                return clientData[header as keyof typeof clientData];
            }
            return clientsData[clientRowIndex][headers.indexOf(header)];
        });


        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Clients!A${clientRowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${clientRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });

    } catch (error) {
        console.error('Error updating client:', error);
        throw new Error('Could not update client in Google Sheets.');
    }
}

export async function deleteClients(clientIds: string[]) {
    try {
        const sheetTitle = 'Clients';
        const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = sheetResponse.data.sheets?.find(s => s.properties?.title === sheetTitle);
        const sheetId = sheet?.properties?.sheetId;

        if (sheetId === undefined) {
            throw new Error(`Sheet "${sheetTitle}" not found.`);
        }

        const data = await getSheetData('Clients!A:A');
        if (!data) {
            throw new Error('Could not fetch clients data.');
        }

        const requests = [];
        // Iterate backwards to avoid index shifting issues
        for (let i = data.length - 1; i >= 1; i--) {
            const rowId = data[i][0];
            if (clientIds.includes(rowId)) {
                requests.push({
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: i,
                            endIndex: i + 1,
                        },
                    },
                });
            }
        }

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests,
                },
            });
        }

    } catch (error) {
        console.error('Error deleting clients:', error);
        throw new Error('Could not delete clients in Google Sheets.');
    }
}


export async function getProducts() {
  const data = await getSheetData('Products!A:D');
  const products = mapToObjects(data) as Product[];
  const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
  return uniqueProducts.map(p => ({...p, unitPrice: parseFloat(p.unitPrice as any) }));
}

export async function createProduct(productData: Omit<Product, 'id'>) {
    try {
        const productsData = (await getSheetData('Products!A:A')) || [['id']];
        const newProductId = `prod-${productsData.length}`;

        const newProductRow = [
            newProductId,
            productData.name,
            productData.unit,
            productData.unitPrice,
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Products!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newProductRow],
            },
        });

        return { id: newProductId };
    } catch (error) {
        console.error('Error creating product:', error);
        throw new Error('Could not create product in Google Sheets.');
    }
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id'>>) {
    try {
        const productsData = await getSheetData('Products!A:D');
        if (!productsData) {
            throw new Error('Could not fetch products data.');
        }

        const headers = productsData[0];
        const productRowIndex = productsData.findIndex(row => row[0] === productId);

        if (productRowIndex === -1) {
            throw new Error('Product not found.');
        }

        const originalData = productsData[productRowIndex];
        const updatedRow = [
            originalData[0], // id
            productData.name ?? originalData[headers.indexOf('name')],
            productData.unit ?? originalData[headers.indexOf('unit')],
            productData.unitPrice ?? originalData[headers.indexOf('unitPrice')],
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Products!A${productRowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${productRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });

    } catch (error) {
        console.error('Error updating product:', error);
        throw new Error('Could not update product in Google Sheets.');
    }
}

export async function deleteProducts(productIds: string[]) {
    try {
        const sheetTitle = 'Products';
        const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = sheetResponse.data.sheets?.find(s => s.properties?.title === sheetTitle);
        const sheetId = sheet?.properties?.sheetId;

        if (sheetId === undefined) {
            throw new Error(`Sheet "${sheetTitle}" not found.`);
        }

        const data = await getSheetData('Products!A:A');
        if (!data) {
            throw new Error('Could not fetch products data.');
        }

        const requests = [];
        for (let i = data.length - 1; i >= 1; i--) {
            const rowId = data[i][0];
            if (productIds.includes(rowId)) {
                requests.push({
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: i,
                            endIndex: i + 1,
                        },
                    },
                });
            }
        }

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests,
                },
            });
        }

    } catch (error) {
        console.error('Error deleting products:', error);
        throw new Error('Could not delete products in Google Sheets.');
    }
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

export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'client' | 'items'> & { lineItems: Omit<InvoiceItem, 'id'|'product'>[], clientId: string}) {
  try {
    const invoicesData = (await getSheetData('Invoices!A:A')) || [['id']];
    const invoiceItemsData = (await getSheetData('InvoiceItems!A:A')) || [['id']];

    const newInvoiceId = `inv-${invoicesData.length}`;
    const newInvoiceNumber = `${new Date().getFullYear()}-${String(invoicesData.length).padStart(3, '0')}`;

    const newInvoiceRow = [
        newInvoiceId,
        newInvoiceNumber,
        invoiceData.clientId,
        invoiceData.subtotal,
        invoiceData.tax,
        invoiceData.discount,
        invoiceData.total,
        invoiceData.status,
        invoiceData.dueDate,
        new Date().toISOString().split('T')[0],
        invoiceData.notes || '',
        invoiceData.clientRelationship || 'New client',
        invoiceData.paymentHistory || 'No payment history',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Invoices!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newInvoiceRow],
      },
    });

    const newInvoiceItemsRows = invoiceData.lineItems.map((item, index) => {
        const newItemId = `item-${invoiceItemsData.length + index}`;
        return [newItemId, newInvoiceId, item.productId, item.quantity, item.total];
    });

    if (newInvoiceItemsRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'InvoiceItems!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: newInvoiceItemsRows,
        },
      });
    }

    return { id: newInvoiceId, number: newInvoiceNumber };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Could not create invoice in Google Sheets.');
  }
}

    
