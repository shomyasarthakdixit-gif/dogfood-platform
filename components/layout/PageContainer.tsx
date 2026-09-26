import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PageContainer({ children, size = 'lg', className }: PageContainerProps) {
  return (
    <main className={[styles.container, styles[size], className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </main>
  );
}
