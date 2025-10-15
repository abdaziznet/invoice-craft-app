'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCompanyProfile, getInvoiceById } from '@/lib/google-sheets';
import { ImageResponse } from '@vercel/og';
import InvoiceImageTemplate from '@/components/invoices/invoice-image-template';
import * as React from 'react';
import en from '@/locales/en.json';
import id from '@/locales/id.json';

const translations = { en, id };

const GenerateImageInputSchema = z.object({
  invoiceId: z.string(),
  format: z.enum(['png', 'jpeg']).default('png'),
  language: z.enum(['en', 'id']),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;
export type GenerateImageOutput = {
  imageUrl: string;
  format: 'png' | 'jpeg';
};

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.object({
      imageUrl: z.string(),
      format: z.enum(['png', 'jpeg']),
    }),
  },
  async ({ invoiceId, format, language }) => {
    const t = (key: string) => {
        const keys = key.split('.');
        let result = translations[language] as any;
        for (const k of keys) {
            result = result?.[k];
        }
        return result || key;
    };

    const [invoice, companyProfile] = await Promise.all([
      getInvoiceById(invoiceId),
      getCompanyProfile(),
    ]);

    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const imageResponse = new ImageResponse(
      React.createElement(InvoiceImageTemplate, { invoice, companyProfile, t }),
      {
        width: 800,
        height: 1131,
        format,
      }
    );

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageUrl = `data:image/${format};base64,${Buffer.from(imageBuffer).toString('base64')}`;

    return { imageUrl, format };
  }
);
