import styles from './Input.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export default function Textarea({
  label,
  error,
  hint,
  required,
  id,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={[styles.input, error ? styles.error : '', className ?? ''].filter(Boolean).join(' ')}
        style={{ resize: 'vertical', minHeight: '6rem' }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        required={required}
        {...props}
      />
      {error && <span id={`${inputId}-error`} className={styles.errorMsg} role="alert">{error}</span>}
      {!error && hint && <span id={`${inputId}-hint`} className={styles.hint}>{hint}</span>}
    </div>
  );
}
