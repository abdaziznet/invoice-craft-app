'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting personalized adjustments to payment reminders based on client relationships and payment history.
 *
 * - paymentReminderAdjustments - A function that suggests adjustments to payment reminders.
 * - PaymentReminderAdjustmentsInput - The input type for the paymentReminderAdjustments function.
 * - PaymentReminderAdjustmentsOutput - The return type for the paymentReminderAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaymentReminderAdjustmentsInputSchema = z.object({
  clientId: z.string().describe('The ID of the client.'),
  invoiceId: z.string().describe('The ID of the invoice.'),
  paymentHistory: z
    .string()
    .describe(
      'A summary of the client past payment behavior, including on-time payments, late payments, and any disputes.'
    ),
  clientRelationship: z
    .string()
    .describe(
      'A description of the relationship with the client (e.g., long-term, new, high-value)'
    ),
  currentReminderMessage: z
    .string()
    .describe('The current payment reminder message being sent.'),
});
export type PaymentReminderAdjustmentsInput = z.infer<
  typeof PaymentReminderAdjustmentsInputSchema
>;

const PaymentReminderAdjustmentsOutputSchema = z.object({
  adjustedReminderMessage: z
    .string()
    .describe('The adjusted payment reminder message.'),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the adjustments made to the reminder message.'
    ),
});
export type PaymentReminderAdjustmentsOutput = z.infer<
  typeof PaymentReminderAdjustmentsOutputSchema
>;

export async function paymentReminderAdjustments(
  input: PaymentReminderAdjustmentsInput
): Promise<PaymentReminderAdjustmentsOutput> {
  return paymentReminderAdjustmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'paymentReminderAdjustmentsPrompt',
  input: {schema: PaymentReminderAdjustmentsInputSchema},
  output: {schema: PaymentReminderAdjustmentsOutputSchema},
  prompt: `You are an expert in customer relations and communication. Your goal is to optimize payment reminder messages to improve the likelihood of on-time payments, 
  taking into account the client's payment history and the relationship with the client. 

  Here is the information about the client and the invoice:

  Client ID: {{{clientId}}}
  Invoice ID: {{{invoiceId}}}
  Payment History: {{{paymentHistory}}}
  Client Relationship: {{{clientRelationship}}}
  Current Reminder Message: {{{currentReminderMessage}}}

  Based on this information, suggest an adjusted payment reminder message. Explain your reasoning for the adjustments.

  Your response should be concise and professional.
`,
});

const paymentReminderAdjustmentsFlow = ai.defineFlow(
  {
    name: 'paymentReminderAdjustmentsFlow',
    inputSchema: PaymentReminderAdjustmentsInputSchema,
    outputSchema: PaymentReminderAdjustmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
