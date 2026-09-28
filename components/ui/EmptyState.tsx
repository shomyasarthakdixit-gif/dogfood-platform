import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, actions, icon }: EmptyStateProps) {
  return (
    <div className={styles.container} role="status">
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
