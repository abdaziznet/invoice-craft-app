
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, compact = false) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(amount);
}

export function formatDate(date: Date, lang: string) {
    if (lang === 'id') {
        return format(date, 'dd-MMM-yyyy', { locale: id });
    }
    return format(date, 'dd-MMM-yyyy');
}
