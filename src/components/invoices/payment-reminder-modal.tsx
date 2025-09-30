'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wand2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';
import Spinner from '../ui/spinner';
import { paymentReminderAdjustments, type PaymentReminderAdjustmentsOutput } from '@/ai/flows/payment-reminder-adjustments';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type PaymentReminderModalProps = {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
};

export default function PaymentReminderModal({
  invoice,
  isOpen,
  onClose,
}: PaymentReminderModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<PaymentReminderAdjustmentsOutput | null>(null);

  const defaultReminder = `Hi ${invoice.customer.name},\n\nThis is a friendly reminder that invoice #${invoice.invoiceNumber} for ${formatCurrency(invoice.total)} was due on ${invoice.dueDate}.\n\nPlease let us know if you have any questions.\n\nBest,\nInvoiceCraft Team`;

  const [currentMessage, setCurrentMessage] = useState(defaultReminder);

  const handleGenerateSuggestion = async () => {
    setIsLoading(true);
    setAiResponse(null);
    try {
      const response = await paymentReminderAdjustments({
        customerId: invoice.customer.id,
        invoiceId: invoice.id,
        paymentHistory: invoice.paymentHistory,
        customerRelationship: invoice.customerRelationship,
        currentReminderMessage: currentMessage,
      });
      setAiResponse(response);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate suggestion. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Payment Reminder</DialogTitle>
          <DialogDescription>
            Use AI to craft a personalized reminder for invoice #{invoice.invoiceNumber}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Current Reminder</h3>
            <div className="space-y-2">
              <Label htmlFor="current-message">Message</Label>
              <Textarea
                id="current-message"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                rows={10}
              />
            </div>
            <Button onClick={handleGenerateSuggestion} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Suggestion
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">AI Suggestion</h3>
            {isLoading && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                <Spinner />
              </div>
            )}
            {aiResponse && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Optimized Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea value={aiResponse.adjustedReminderMessage} readOnly rows={10} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7"
                      onClick={() => handleCopyToClipboard(aiResponse.adjustedReminderMessage)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Reasoning</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aiResponse.reasoning}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {!isLoading && !aiResponse && (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">AI suggestions will appear here.</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
