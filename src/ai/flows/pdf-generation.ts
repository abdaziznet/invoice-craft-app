'use server';

/**
 * @fileOverview A Genkit flow for generating PDF invoices.
 *
 * - generatePdf - A function that generates a PDF for a given invoice ID.
 * - GeneratePdfInput - The input type for the generatePdf function.
 * - GeneratePdfOutput - The return type for the generatePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {getInvoiceById} from '@/lib/google-sheets';
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

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const {width, height} = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 10;
    const headerFontSize = 24;
    const subHeaderFontSize = 12;
    const smallFontSize = 8;

    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // Header
    page.drawText('Invoice', {
      x: margin,
      y: y,
      font: boldFont,
      size: headerFontSize,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Sumber Rejeki Frozen Foods`, {
      x: width - margin - 200,
      y: y,
      font: boldFont,
      size: subHeaderFontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Pasar Patra`, {
      x: width - margin - 200,
      y: y - 15,
      font: font,
      size: fontSize,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(`West Jakarta 11510`, {
      x: width - margin - 200,
      y: y - 30,
      font: font,
      size: fontSize,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 30;
    page.drawText(`#${invoice.invoiceNumber}`, {
      x: margin,
      y: y,
      font: font,
      size: fontSize,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 50;

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
    page.drawText(invoice.client.address, {
      x: margin,
      y: y,
      font: font,
      size: smallFontSize,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 12;
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

    // Invoice Meta
    const metaY = height - margin - 80;
    const metaX = width - margin - 200;

    const metaInfo = [
      {label: 'Status:', value: invoice.status},
      {label: 'Invoice Date:', value: format(parseISO(invoice.createdAt), 'PPP')},
      {label: 'Due Date:', value: format(parseISO(invoice.dueDate), 'PPP')},
    ];

    let currentMetaY = metaY;
    metaInfo.forEach(info => {
      page.drawText(info.label, {x: metaX, y: currentMetaY, font: boldFont, size: fontSize});
      page.drawText(info.value, {
        x: metaX + 80,
        y: currentMetaY,
        font: font,
        size: fontSize,
        color: rgb(0.3, 0.3, 0.3),
      });
      currentMetaY -= 20;
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
      page.drawText(header, {
        x: currentX,
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
        page.drawText(cell, {
          x: currentX,
          y: y,
          font: font,
          size: fontSize,
        });
        currentX += colWidths[i];
      });
      y -= 25;
    });

    y -= 20;
    // Separator
    page.drawLine({
      start: {x: margin, y: y},
      end: {x: width - margin, y: y},
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 20;

    // Summary
    const summaryX = width / 2 + 50;
    const summaryLabelX = summaryX;
    const summaryValueX = width - margin - 100;

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
      page.drawText(item.value, {
        x: summaryValueX,
        y: y,
        font: font,
        size: fontSize,
      });
      y -= 20;
    });

    y -= 5;
    page.drawLine({
      start: {x: summaryX, y: y},
      end: {x: width - margin, y: y},
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    page.drawText('Total', {x: summaryLabelX, y: y, font: boldFont, size: subHeaderFontSize});
    page.drawText(formatCurrency(invoice.total), {
      x: summaryValueX,
      y: y,
      font: boldFont,
      size: subHeaderFontSize,
    });

    // Notes
    if (invoice.notes) {
      const notesY = y;
      const notesX = margin;
      page.drawText('Notes', {x: notesX, y: notesY, font: boldFont, size: fontSize});
      const notesLines = invoice.notes.split('\n');
      let currentNotesY = notesY - 15;
      notesLines.forEach(line => {
        page.drawText(line, {
          x: notesX,
          y: currentNotesY,
          font: font,
          size: smallFontSize,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentNotesY -= 12;
      });
    }

    // Footer
    const footerY = margin;
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
