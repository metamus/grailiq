import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

/** Loading spinner component */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-grailiq-purple', sizeStyles[size], className)} />
  );
}
