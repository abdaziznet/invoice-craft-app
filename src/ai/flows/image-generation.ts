'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCompanyProfile, getInvoiceById } from '@/lib/google-sheets';
import { ImageResponse } from '@vercel/og';
import InvoiceImageTemplate from '@/components/invoices/invoice-image-template';
import * as React from 'react';
import fs from 'fs';
import path from 'path';

const GenerateImageInputSchema = z.object({
  invoiceId: z.string(),
  format: z.enum(['png', 'jpeg']).default('png'),
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
  async ({ invoiceId, format }) => {
    const [invoice, companyProfile] = await Promise.all([
      getInvoiceById(invoiceId),
      getCompanyProfile(),
    ]);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // ✅ Gunakan font lokal (pastikan file ada di folder public/fonts)
    const interRegularPath = path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf');
    const interBoldPath = path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf');

    const interRegular = fs.readFileSync(interRegularPath);
    const interBold = fs.readFileSync(interBoldPath);

    // ✅ Buat gambar
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

    // ✅ Ubah ke Base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageUrl = `data:image/${format};base64,${Buffer.from(imageBuffer).toString('base64')}`;

    return {
      imageUrl,
      format,
    };
  }
);
