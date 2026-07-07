import type { ReactNode } from 'react';

type BadgeVariant = 'gold' | 'teal' | 'green' | 'red' | 'gray' | 'amber';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variants: Record<BadgeVariant, string> = {
  gold: 'bg-primary/15 text-primary-mid border-primary/30',
  teal: 'bg-accent/15 text-accent-mid border-accent/30',
  green: 'bg-success/15 text-success border-success/30',
  red: 'bg-power/15 text-power border-power/30',
  gray: 'bg-bg-3 text-text-2 border-border',
  amber: 'bg-primary-mid/15 text-primary-mid border-primary-mid/30',
};

export function Badge({ variant = 'gray', children, className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${variants[variant]} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${className || ''}`}
    >
      {children}
    </span>
  );
}
