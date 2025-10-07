
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCompanyProfile, getInvoiceById } from '@/lib/google-sheets';
import { ImageResponse } from '@vercel/og';
import InvoiceImageTemplate from '@/components/invoices/invoice-image-template';
import * as React from 'react';

const GenerateImageInputSchema = z.object({
  invoiceId: z.string(),
  format: z.enum(['png', 'jpeg']).default('png'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string(),
  format: z.enum(['png', 'jpeg']),
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
  async ({ invoiceId, format }) => {
    const [invoice, companyProfile] = await Promise.all([
      getInvoiceById(invoiceId),
      getCompanyProfile(),
    ]);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const interRegular = await fetch(
        new URL('../../../assets/fonts/Inter-Regular.ttf', import.meta.url)
      ).then((res) => res.arrayBuffer());
  
    const interBold = await fetch(
        new URL('../../../assets/fonts/Inter-Bold.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer());
    

    const imageResponse = new ImageResponse(
      React.createElement(InvoiceImageTemplate, { invoice, companyProfile }),
      {
        width: 1200,
        height: 630,
        format,
        fonts: [
          {
            name: 'Inter',
            data: interRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
    
    // Convert the image to a data URL
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageUrl = `data:image/${format};base64,${Buffer.from(imageBuffer).toString('base64')}`;

    return {
      imageUrl: imageUrl,
      format,
    };
  }
);
