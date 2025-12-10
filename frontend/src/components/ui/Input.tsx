"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseInputProps {}

export default function Input({ 
  label, 
  error, 
  hint,
  className = "",
  required = false,
  ...props 
}: InputProps): React.JSX.Element {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
        </label>
      )}
      <input
        className={`input-field ${error ? "border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-[rgba(239,68,68,0.1)]" : ""}`}
        required={required}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--accent-danger)] mt-1">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseInputProps {
  children: ReactNode;
}

export function Select({ 
  label, 
  error, 
  children,
  className = "",
  required = false,
  ...props 
}: SelectProps): React.JSX.Element {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
        </label>
      )}
      <select
        className={`select-field ${error ? "border-[var(--accent-danger)]" : ""}`}
        required={required}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-[var(--accent-danger)] mt-1">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseInputProps {
  rows?: number;
}

export function Textarea({ 
  label, 
  error, 
  hint,
  className = "",
  required = false,
  rows = 3,
  ...props 
}: TextareaProps): React.JSX.Element {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-[var(--accent-danger)] ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`input-field resize-none ${error ? "border-[var(--accent-danger)]" : ""}`}
        rows={rows}
        required={required}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--accent-danger)] mt-1">{error}</p>
      )}
    </div>
  );
}

