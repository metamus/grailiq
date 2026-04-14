import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency */
export function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

/** Format a date string */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

/** Format a number as percentage */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Get color class based on percentage change */
export function getChangeColor(value: number | null | undefined): string {
  if (value == null) return 'text-gray-500';
  if (value > 0) return 'text-grailiq-green';
  if (value < 0) return 'text-grailiq-red';
  return 'text-gray-500';
}

/** Get badge variant for investment signal */
export function getSignalVariant(signal: string | null): {
  label: string;
  className: string;
} {
  switch (signal) {
    case 'buy':
      return { label: 'Buy', className: 'bg-green-100 text-green-800' };
    case 'hold':
      return { label: 'Hold', className: 'bg-blue-100 text-blue-800' };
    case 'watch':
      return { label: 'Watch', className: 'bg-amber-100 text-amber-800' };
    case 'avoid':
      return { label: 'Avoid', className: 'bg-red-100 text-red-800' };
    default:
      return { label: '—', className: 'bg-gray-100 text-gray-800' };
  }
}
