import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  required,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, error ? styles.error : '', className ?? ''].filter(Boolean).join(' ')}
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
