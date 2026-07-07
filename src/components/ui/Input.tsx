import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-2 mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`input-base ${icon ? 'pl-11' : ''} ${suffix ? 'pr-12' : ''} ${error ? 'border-power' : ''} ${className || ''}`}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-power">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-2 mb-1.5">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`input-base resize-none ${error ? 'border-power' : ''} ${className || ''}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-power">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
