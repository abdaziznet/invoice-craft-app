'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getInvoiceById } from '@/lib/google-sheets';
import { formatCurrency } from '@/lib/utils';

const GenerateImageInputSchema = z.object({
  invoiceId: z.string(),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string(),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ invoiceId }) => {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const prompt = `Generate a visually appealing and professional image that summarizes an invoice.

    The image should be clean, modern, and easy to read. Use a clear hierarchy of information.
    
    Invoice Details:
    - Invoice Number: ${invoice.invoiceNumber}
    - Customer Name: ${invoice.customer.name}
    - Total Amount: ${formatCurrency(invoice.total)}
    - Due Date: ${invoice.dueDate}
    - Status: ${invoice.status}
    
    The overall tone should be professional but friendly. The image should prominently feature the total amount and the due date.
    Use icons to represent key information where appropriate (e.g., a calendar for the due date, a tag for the invoice number).
    The status should be color-coded: green for Paid, yellow for Unpaid, red for Overdue.
    
    Do not include any text other than the invoice details provided above. The output should be just the generated image.`;

    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt,
        config: {
            aspectRatio: '16:9',
        },
    });

    if (!media.url) {
        throw new Error('Image generation failed');
    }

    return {
      imageUrl: media.url,
    };
  }
);
