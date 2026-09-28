import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        styles.badge,
        styles[variant],
        dot ? styles.dot : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}
