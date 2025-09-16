import React from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  style = {}
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        fontSize: '10px',
        padding: '6px 8px',
        border: '1px solid var(--terminal-border)',
        backgroundColor: 'var(--terminal-bg)',
        color: 'var(--terminal-text)',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth: '80px',
        ...style
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};