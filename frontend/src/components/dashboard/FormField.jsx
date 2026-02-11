/**
 * FormField Component
 * Reusable form field with label
 */

import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export const FormField = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  type = 'text',
  multiline = false,
  rows = 3,
  placeholder = '',
  className = ''
}) => {
  const InputComponent = multiline ? Textarea : Input;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <InputComponent
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className="bg-black/20 border-white/10 disabled:opacity-70"
      />
    </div>
  );
};