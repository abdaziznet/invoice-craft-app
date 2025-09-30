

'use server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { Customer, Invoice, InvoiceItem, Product, CompanyProfile } from './types';
import { isPast, parseISO, startOfToday } from 'date-fns';

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
  } catch (error: any) {
    if (error.code === 400 && error.errors[0]?.message.includes('Unable to parse range')) {
        // Find or create sheet 'Customers'
        const sheetTitle = range.split('!')[0];
        const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = spreadsheetInfo.data.sheets?.some(s => s.properties?.title === sheetTitle);

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        { addSheet: { properties: { title: sheetTitle } } }
                    ]
                }
            });
            let headers: string[] = [];
            if (sheetTitle === 'Customers') headers = ['id', 'name', 'email', 'address', 'phone'];
            else if (sheetTitle === 'Products') headers = ['id', 'name', 'unit', 'unitPrice'];
            else if (sheetTitle === 'Invoices') headers = ['id', 'invoiceNumber', 'customerId', 'subtotal', 'tax', 'discount', 'total', 'status', 'dueDate', 'createdAt', 'notes', 'customerRelationship', 'paymentHistory'];
            else if (sheetTitle === 'InvoiceItems') headers = ['id', 'invoiceId', 'productId', 'quantity', 'total'];
            else if (sheetTitle === 'CompanyProfile') headers = ['key', 'value'];

             if (headers.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetTitle}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [headers]
                    }
                });
            }
        }
        return null;
    }
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

export async function getCompanyProfile(): Promise<CompanyProfile> {
    const defaultProfile: CompanyProfile = {
        name: '',
        address: '',
        logoUrl: '',
        currency: 'IDR',
        language: 'id',
    };
    
    const data = await getSheetData('CompanyProfile!A:B');
    if (!data) {
        return defaultProfile;
    }

    const profile = data.slice(1).reduce((acc, row) => {
        if (row[0]) {
            acc[row[0]] = row[1];
        }
        return acc;
    }, {} as { [key: string]: any });

    return {
        name: profile.name || '',
        address: profile.address || '',
        logoUrl: profile.logoUrl || '',
        currency: (profile.currency as CompanyProfile['currency']) || 'IDR',
        language: (profile.language as CompanyProfile['language']) || 'id',
    };
}


export async function updateCompanyProfile(profileData: CompanyProfile) {
    const sheetTitle = 'CompanyProfile';
    try {
        const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = spreadsheetInfo.data.sheets?.some(s => s.properties?.title === sheetTitle);

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        { addSheet: { properties: { title: sheetTitle } } }
                    ]
                }
            });
            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetTitle}!A1:B1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['key', 'value']]
                }
            });
        }
        
        const data = Object.entries(profileData);
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetTitle}!A2:B${data.length + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: data,
            },
        });
    } catch (error) {
        console.error('Error updating company profile:', error);
        throw new Error('Could not update company profile in Google Sheets.');
    }
}

export async function getCustomers() {
  const data = await getSheetData('Customers!A:E');
  return mapToObjects(data);
}

export async function createCustomer(customerData: Omit<Customer, 'id'>) {
    try {
        const customersData = (await getSheetData('Customers!A:A')) || [['id']];
        const newCustomerId = `cus-${customersData.length}`;

        const newCustomerRow = [
            newCustomerId,
            customerData.name,
            customerData.email,
            customerData.address,
            customerData.phone,
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Customers!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newCustomerRow],
            },
        });

        return { id: newCustomerId };
    } catch (error) {
        console.error('Error creating customer:', error);
        throw new Error('Could not create customer in Google Sheets.');
    }
}

export async function updateCustomer(customerId: string, customerData: Partial<Omit<Customer, 'id'>>) {
    try {
        const customersData = await getSheetData('Customers!A:E');
        if (!customersData) {
            throw new Error('Could not fetch customers data.');
        }

        const headers = customersData[0];
        const customerRowIndex = customersData.findIndex(row => row[0] === customerId);

        if (customerRowIndex === -1) {
            throw new Error('Customer not found.');
        }

        const updatedRow = headers.map((header: string) => {
            if (header in customerData) {
                return customerData[header as keyof typeof customerData];
            }
            return customersData[customerRowIndex][headers.indexOf(header)];
        });


        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Customers!A${customerRowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${customerRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });

    } catch (error) {
        console.error('Error updating customer:', error);
        throw new Error('Could not update customer in Google Sheets.');
    }
}

export async function deleteCustomers(customerIds: string[]) {
    try {
        const sheetTitle = 'Customers';
        const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = sheetResponse.data.sheets?.find(s => s.properties?.title === sheetTitle);
        const sheetId = sheet?.properties?.sheetId;

        if (sheetId === undefined) {
            throw new Error(`Sheet "${sheetTitle}" not found.`);
        }

        const data = await getSheetData('Customers!A:A');
        if (!data) {
            throw new Error('Could not fetch customers data.');
        }

        const requests = [];
        // Iterate backwards to avoid index shifting issues
        for (let i = data.length - 1; i >= 1; i--) {
            const rowId = data[i][0];
            if (customerIds.includes(rowId)) {
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
        console.error('Error deleting customers:', error);
        throw new Error('Could not delete customers in Google Sheets.');
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
    const data = await getSheetData('Invoices!A:M');
    let invoices = mapToObjects(data) as Invoice[];
    const customers = await getCustomers();
    const products = await getProducts();

    const invoiceItemsData = await getSheetData('InvoiceItems!A:D');
    const invoiceItems = mapToObjects(invoiceItemsData);
    
    const today = startOfToday();

    const updatePromises = invoices.map(async (inv) => {
        if (inv.status === 'Unpaid' && isPast(parseISO(inv.dueDate))) {
            inv.status = 'Overdue';
            // This is a fire-and-forget update. We update the local object immediately
            // for responsiveness and send the update to the sheet in the background.
            // A more robust solution might involve a queue or error handling here.
            try {
                const fullInvoice = await getInvoiceById(inv.id);
                if (fullInvoice) {
                     await updateInvoice(inv.id, {
                        ...fullInvoice,
                        status: 'Overdue',
                        customerId: fullInvoice.customer.id,
                        lineItems: fullInvoice.lineItems.map(item => ({
                            productId: item.product.id,
                            quantity: item.quantity,
                            total: item.total
                        }))
                    });
                }
            } catch (e) {
                console.error(`Failed to auto-update invoice ${inv.id} to Overdue`, e);
            }
        }
        return inv;
    });

    invoices = await Promise.all(updatePromises);


    return invoices.map(inv => {
        const customer = customers.find(c => c.id === inv.customerId);
        const lineItems = invoiceItems
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
            customer,
            lineItems,
            subtotal: parseFloat(inv.subtotal),
            tax: parseFloat(inv.tax),
            discount: parseFloat(inv.discount),
            total: parseFloat(inv.total),
        }
    });
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    // We call getInvoices without the auto-update logic here to prevent cycles
    // and to get the raw data for a specific invoice.
    const data = await getSheetData('Invoices!A:M');
    const invoices = mapToObjects(data);
    const targetInvoice = invoices.find(inv => inv.id === id);

    if (!targetInvoice) {
        return null;
    }
    
    const customers = await getCustomers();
    const products = await getProducts();
    const invoiceItemsData = await getSheetData('InvoiceItems!A:D');
    const invoiceItems = mapToObjects(invoiceItemsData);

    const customer = customers.find(c => c.id === targetInvoice.customerId);
    const lineItems = invoiceItems
        .filter(item => item.invoiceId === targetInvoice.id)
        .map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                id: item.id,
                product: product!,
                quantity: parseInt(item.quantity, 10),
                total: parseFloat(item.total),
            }
        });
        
    const fullInvoice: Invoice = {
        ...targetInvoice,
        customer: customer!,
        lineItems: lineItems,
        subtotal: parseFloat(targetInvoice.subtotal),
        tax: parseFloat(targetInvoice.tax),
        discount: parseFloat(targetInvoice.discount),
        total: parseFloat(targetInvoice.total),
    };

    return fullInvoice;
}


export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'customer' | 'lineItems'> & { lineItems: Omit<InvoiceItem, 'id'|'product'>[], customerId: string}) {
  try {
    const invoicesData = (await getSheetData('Invoices!A:A')) || [['id']];
    const invoiceItemsData = (await getSheetData('InvoiceItems!A:A')) || [['id']];

    const newInvoiceId = `inv-${invoicesData.length}`;
    const newInvoiceNumber = `${new Date().getFullYear()}-${String(invoicesData.length).padStart(3, '0')}`;

    const newInvoiceRow = [
        newInvoiceId,
        newInvoiceNumber,
        invoiceData.customerId,
        invoiceData.subtotal,
        invoiceData.tax,
        invoiceData.discount,
        invoiceData.total,
        invoiceData.status,
        invoiceData.dueDate,
        new Date().toISOString().split('T')[0],
        invoiceData.notes || '',
        invoiceData.customerRelationship || 'New customer',
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

export async function updateInvoice(invoiceId: string, invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'customer' | 'lineItems'> & { lineItems: Omit<InvoiceItem, 'id'|'product'>[], customerId: string}) {
    try {
        const invoicesData = await getSheetData('Invoices!A:M');
        if (!invoicesData) {
            throw new Error('Could not fetch invoices data.');
        }

        const headers = invoicesData[0];
        const invoiceRowIndex = invoicesData.findIndex(row => row[0] === invoiceId);

        if (invoiceRowIndex === -1) {
            throw new Error('Invoice not found.');
        }

        const originalData = invoicesData[invoiceRowIndex];
        const updatedRow = [
            originalData[0], // id
            originalData[1], // invoiceNumber
            invoiceData.customerId,
            invoiceData.subtotal,
            invoiceData.tax,
            invoiceData.discount,
            invoiceData.total,
            invoiceData.status,
            invoiceData.dueDate,
            originalData[9], // createdAt
            invoiceData.notes,
            invoiceData.customerRelationship,
            invoiceData.paymentHistory
        ];
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Invoices!A${invoiceRowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${invoiceRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });

        // First, clear old invoice items for this invoice
        const invoiceItemsSheetTitle = 'InvoiceItems';
        const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });
        const invoiceItemsSheet = sheetResponse.data.sheets?.find(s => s.properties?.title === invoiceItemsSheetTitle);
        const invoiceItemsSheetId = invoiceItemsSheet?.properties?.sheetId;

        if (invoiceItemsSheetId === undefined) {
            throw new Error(`Sheet "${invoiceItemsSheetTitle}" not found.`);
        }
        
        const invoiceItemsData = await getSheetData('InvoiceItems!A:E');
        if (invoiceItemsData) {
          const deleteRequests = [];
          for (let i = invoiceItemsData.length - 1; i >= 1; i--) {
            if (invoiceItemsData[i][1] === invoiceId) {
              deleteRequests.push({
                deleteDimension: {
                  range: {
                    sheetId: invoiceItemsSheetId,
                    dimension: 'ROWS',
                    startIndex: i,
                    endIndex: i + 1,
                  },
                },
              });
            }
          }
          if(deleteRequests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: deleteRequests },
            });
          }
        }
        
        // Then, add the updated line items
        const allInvoiceItems = (await getSheetData('InvoiceItems!A:A')) || [['id']];
        const newInvoiceItemsRows = invoiceData.lineItems.map((item, index) => {
            const newItemId = `item-${allInvoiceItems.length + index}`;
            return [newItemId, invoiceId, item.productId, item.quantity, item.total];
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


    } catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Could not update invoice in Google Sheets.');
    }
}


export async function deleteInvoices(invoiceIds: string[]) {
    try {
        const sheetResponse = await sheets.spreadsheets.get({ spreadsheetId });

        const invoiceSheetTitle = 'Invoices';
        const invoiceSheet = sheetResponse.data.sheets?.find(s => s.properties?.title === invoiceSheetTitle);
        const invoiceSheetId = invoiceSheet?.properties?.sheetId;

        if (invoiceSheetId === undefined) {
            throw new Error(`Sheet "${invoiceSheetTitle}" not found.`);
        }
        
        const invoiceItemsSheetTitle = 'InvoiceItems';
        const invoiceItemsSheet = sheetResponse.data.sheets?.find(s => s.properties?.title === invoiceItemsSheetTitle);
        const invoiceItemsSheetId = invoiceItemsSheet?.properties?.sheetId;

        if (invoiceItemsSheetId === undefined) {
          throw new Error(`Sheet "${invoiceItemsSheetTitle}" not found.`);
        }

        const requests = [];

        // Prepare to delete invoice rows
        const invoicesData = await getSheetData('Invoices!A:A');
        if (invoicesData) {
            for (let i = invoicesData.length - 1; i >= 1; i--) {
                const rowId = invoicesData[i][0];
                if (invoiceIds.includes(rowId)) {
                    requests.push({
                        deleteDimension: {
                            range: {
                                sheetId: invoiceSheetId,
                                dimension: 'ROWS',
                                startIndex: i,
                                endIndex: i + 1,
                            },
                        },
                    });
                }
            }
        }

        // Prepare to delete invoice items rows
        const invoiceItemsData = await getSheetData('InvoiceItems!A:B');
        if(invoiceItemsData){
            for (let i = invoiceItemsData.length - 1; i >= 1; i--) {
                const associatedInvoiceId = invoiceItemsData[i][1];
                if (invoiceIds.includes(associatedInvoiceId)) {
                    requests.push({
                        deleteDimension: {
                            range: {
                                sheetId: invoiceItemsSheetId,
                                dimension: 'ROWS',
                                startIndex: i,
                                endIndex: i + 1,
                            },
                        },
                    });
                }
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
        console.error('Error deleting invoices:', error);
        throw new Error('Could not delete invoices in Google Sheets.');
    }
}
    


