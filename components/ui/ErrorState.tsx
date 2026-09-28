import styles from './EmptyState.module.css';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem persists, contact support.',
  action,
}: ErrorStateProps) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.icon} aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <h3 className={styles.title} style={{ color: 'var(--color-error)' }}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
}
