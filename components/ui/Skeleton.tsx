import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'card';
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.skeleton, styles[variant], className ?? ''].filter(Boolean).join(' ')}
      style={{ width, height }}
    />
  );
}
