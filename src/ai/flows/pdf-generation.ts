

'use server';

/**
 * @fileOverview A Genkit flow for generating PDF invoices.
 *
 * - generatePdf - A function that generates a PDF for a given invoice ID.
 * - GeneratePdfInput - The input type for the generatePdf function.
 * - GeneratePdfOutput - The return type for the generatePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {getCompanyProfile, getInvoiceById} from '@/lib/google-sheets';
import {formatCurrency} from '@/lib/utils';
import {format, parseISO} from 'date-fns';

const GeneratePdfInputSchema = z.object({
  invoiceId: z.string(),
});
export type GeneratePdfInput = z.infer<typeof GeneratePdfInputSchema>;

const GeneratePdfOutputSchema = z.object({
  pdfBase64: z.string(),
});
export type GeneratePdfOutput = z.infer<typeof GeneratePdfOutputSchema>;

export async function generatePdf(
  input: GeneratePdfInput
): Promise<GeneratePdfOutput> {
  return generatePdfFlow(input);
}

const generatePdfFlow = ai.defineFlow(
  {
    name: 'generatePdfFlow',
    inputSchema: GeneratePdfInputSchema,
    outputSchema: GeneratePdfOutputSchema,
  },
  async ({invoiceId}) => {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const companyProfile = await getCompanyProfile();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const {width, height} = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let logoImage;
    let logoDims = { width: 0, height: 0 };
    if (companyProfile.logoUrl) {
      try {
        const logoImageBytes = await fetch(companyProfile.logoUrl).then(res => res.arrayBuffer());
        if (companyProfile.logoUrl.endsWith('.png')) {
          logoImage = await pdfDoc.embedPng(logoImageBytes);
        } else if (companyProfile.logoUrl.endsWith('.jpg') || companyProfile.logoUrl.endsWith('.jpeg')) {
          logoImage = await pdfDoc.embedJpg(logoImageBytes);
        }
        if (logoImage) {
           const scaleFactor = 80 / logoImage.height;
           logoDims = logoImage.scale(scaleFactor);
        }
      } catch (e) {
        console.error("Failed to embed logo:", e);
      }
    }


    const fontSize = 10;
    const headerFontSize = 24;
    const subHeaderFontSize = 12;
    const smallFontSize = 8;

    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;
    
    // Header Section
    let rightY = y;
    
    // Right side: Invoice Title and Info
    const invoiceTitle = 'Invoice';
    const titleWidth = boldFont.widthOfTextAtSize(invoiceTitle, headerFontSize);
    page.drawText(invoiceTitle, {
      x: width - margin - titleWidth,
      y: rightY,
      font: boldFont,
      size: headerFontSize,
      color: rgb(0, 0, 0),
    });
    rightY -= 30;

    const invoiceNumberText = `#${invoice.invoiceNumber}`;
    const invoiceNumberWidth = font.widthOfTextAtSize(invoiceNumberText, fontSize);
    page.drawText(invoiceNumberText, {
      x: width - margin - invoiceNumberWidth,
      y: rightY,
      font: font,
      size: fontSize,
      color: rgb(0.5, 0.5, 0.5),
    });
    rightY -= 20;

    // Left side: Logo and Company Info
    let leftX = margin;
    if (logoImage) {
        page.drawImage(logoImage, {
            x: leftX,
            y: y - logoDims.height + 10,
            width: logoDims.width,
            height: logoDims.height,
        });
        leftX += logoDims.width + 15;
    }
    
    let leftY = y;
    page.drawText(companyProfile.name, {
      x: leftX,
      y: leftY,
      font: boldFont,
      size: subHeaderFontSize
    });
    leftY -= 15;

    const companyAddressLines = companyProfile.address.split('\n');
    companyAddressLines.forEach(line => {
       page.drawText(line, {
        x: leftX,
        y: leftY,
        font: font,
        size: fontSize,
        color: rgb(0.3, 0.3, 0.3),
        lineHeight: 15
      });
      leftY -= 15;
    });

    const metaInfo = [
      {label: 'Status:', value: invoice.status},
      {label: 'Invoice Date:', value: format(parseISO(invoice.createdAt), 'PPP')},
      {label: 'Due Date:', value: format(parseISO(invoice.dueDate), 'PPP')},
    ];

    metaInfo.forEach(info => {
      const labelWidth = boldFont.widthOfTextAtSize(info.label, fontSize);
      page.drawText(info.label, {x: width - margin - 150, y: rightY, font: boldFont, size: fontSize});
      const valueWidth = font.widthOfTextAtSize(info.value, fontSize);
      page.drawText(info.value, {
        x: width - margin - valueWidth,
        y: rightY,
        font: font,
        size: fontSize,
        color: rgb(0.3, 0.3, 0.3),
      });
      rightY -= 20;
    });
    
    // Position `y` for the next section based on the longest column
    const minLeftY = y - logoDims.height - 20;
    y = Math.min(minLeftY, rightY) - 20;

    // Billing Info
    page.drawText('Bill To:', {
      x: margin,
      y: y,
      font: boldFont,
      size: fontSize,
    });
    y -= 15;
    page.drawText(invoice.client.name, {
      x: margin,
      y: y,
      font: font,
      size: fontSize,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 15;
    
    // Handle multi-line address
    const addressLines = invoice.client.address.split('\n');
    addressLines.forEach(line => {
      page.drawText(line, {
        x: margin,
        y: y,
        font: font,
        size: smallFontSize,
        color: rgb(0.3, 0.3, 0.3),
        lineHeight: 12
      });
      y -= 12;
    });
    y -= 3; // Extra space after address

    page.drawText(invoice.client.email, {
      x: margin,
      y: y,
      font: font,
      size: smallFontSize,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 12;
    page.drawText(invoice.client.phone, {
      x: margin,
      y: y,
      font: font,
      size: smallFontSize,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 50;


    // Table Header
    const tableTop = y;
    page.drawRectangle({
      x: margin,
      y: tableTop - 20,
      width: contentWidth,
      height: 30,
      color: rgb(0.95, 0.95, 0.95),
    });

    const tableHeaders = ['Item', 'Quantity', 'Unit Price', 'Total'];
    const colWidths = [
      contentWidth * 0.5,
      contentWidth * 0.15,
      contentWidth * 0.2,
      contentWidth * 0.15,
    ];
    let currentX = margin + 10;

    tableHeaders.forEach((header, i) => {
       let xPos = currentX;
      if (i > 0) { // Right align headers other than item
         const colEnd = margin + colWidths.slice(0, i + 1).reduce((a, b) => a + b);
         const textWidth = boldFont.widthOfTextAtSize(header, fontSize);
         xPos = colEnd - textWidth - 10;
      }
      page.drawText(header, {
        x: xPos,
        y: tableTop - 5,
        font: boldFont,
        size: fontSize,
      });
      currentX += colWidths[i];
    });

    y -= 45;

    // Table Body
    invoice.lineItems.forEach(item => {
      const itemTotal = item.product.unitPrice * item.quantity;
      const rowData = [
        item.product.name,
        item.quantity.toString(),
        formatCurrency(item.product.unitPrice),
        formatCurrency(itemTotal),
      ];

      currentX = margin + 10;
      rowData.forEach((cell, i) => {
        let xPos = currentX;
        let cellFont = font;
        if (i > 0) { // right align numbers
            const textWidth = cellFont.widthOfTextAtSize(cell, fontSize);
            const colEnd = margin + colWidths.slice(0, i + 1).reduce((a, b) => a + b);
            xPos = colEnd - textWidth - 10;
        }

        page.drawText(cell, {
          x: xPos,
          y: y,
          font: cellFont,
          size: fontSize,
        });
        currentX += colWidths[i];
      });
      y -= 25;
    });

    // Move y for summary section, ensuring it's below the table
    y -= 20;

    // Summary Section
    const summaryLabelX = width / 2 + 50;
    const summaryValueXEnd = width - margin;
    
    const summaryItems = [
      {label: 'Subtotal', value: formatCurrency(invoice.subtotal)},
      {
        label: `Tax (${invoice.tax}%)`,
        value: formatCurrency((invoice.subtotal * invoice.tax) / 100),
      },
    ];
    if (invoice.discount > 0) {
      summaryItems.push({label: 'Discount', value: `- ${formatCurrency(invoice.discount)}`});
    }

    summaryItems.forEach(item => {
      page.drawText(item.label, {x: summaryLabelX, y: y, font: font, size: fontSize});
      const valueWidth = font.widthOfTextAtSize(item.value, fontSize);
      page.drawText(item.value, {
        x: summaryValueXEnd - valueWidth,
        y: y,
        font: font,
        size: fontSize,
      });
      y -= 20;
    });

    y -= 5;
    page.drawLine({
      start: {x: summaryLabelX, y: y},
      end: {x: width - margin, y: y},
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    y -= 20;
    
    const totalText = formatCurrency(invoice.total);
    const totalWidth = boldFont.widthOfTextAtSize(totalText, subHeaderFontSize);
    page.drawText('Total', {x: summaryLabelX, y: y, font: boldFont, size: subHeaderFontSize});
    page.drawText(totalText, {
      x: summaryValueXEnd - totalWidth,
      y: y,
      font: boldFont,
      size: subHeaderFontSize,
    });
    
    // Move y below summary for notes
    y -= 40;
    
    // Notes
    if (invoice.notes) {
      const notesX = margin;
      page.drawText('Notes', {x: notesX, y: y, font: boldFont, size: fontSize});
      y -= 15;
      
      const notesLines = invoice.notes.split('\n');
      notesLines.forEach(line => {
        page.drawText(line, {
          x: notesX,
          y: y,
          font: font,
          size: smallFontSize,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 12;
      });
    }

    // Footer
    const footerY = margin / 2;
    const footerText = 'Thank you for your business!';
    const textWidth = font.widthOfTextAtSize(footerText, smallFontSize);
    page.drawText(footerText, {
      x: (width - textWidth) / 2,
      y: footerY,
      font: font,
      size: smallFontSize,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    };
  }
);
