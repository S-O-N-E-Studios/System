import { forwardRef } from 'react';

export interface DatePickerProps {
  label?: string;
  value?: string;            // YYYY-MM-DD or YYYY-MM-DDTHH:MM
  onChange?: (value: string) => void;
  type?: 'date' | 'datetime-local' | 'time';
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** If true, the label sits inline (for compact grids) */
  compact?: boolean;
}

/**
 * Atlas Sahara–styled date / datetime / time picker.
 * Wraps the native <input type="date|datetime-local|time"> with the design
 * system's token-driven styling (globally set in globals.css) and adds an
 * accessible label + error display that matches FormInput.
 */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      type = 'date',
      min,
      max,
      placeholder,
      required,
      disabled,
      error,
      className = '',
      compact = false,
    },
    ref,
  ) => {
    return (
      <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col gap-1'} ${className}`}>
        {label && (
          <label
            className={`text-eyebrow text-[var(--text-muted)] ${compact ? 'shrink-0 w-24 text-right' : ''}`}
          >
            {label}
            {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
          </label>
        )}

        {/* The <input> styling is handled globally via globals.css */}
        <input
          ref={ref}
          type={type}
          value={value ?? ''}
          min={min}
          max={max}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `dp-err-${label}` : undefined}
          style={{
            background: disabled ? 'var(--bg-secondary)' : undefined,
            cursor: disabled ? 'not-allowed' : undefined,
            opacity: disabled ? 0.55 : undefined,
            borderColor: error ? 'var(--danger)' : undefined,
          }}
        />

        {error && (
          <p id={`dp-err-${label}`} className="text-[0.7rem] text-[var(--danger)] mt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
export default DatePicker;
