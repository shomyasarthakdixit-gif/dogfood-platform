import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hover?: boolean;
  as?: React.ElementType;
}

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = false,
  hover = false,
  as: Tag = 'div',
}: CardProps) {
  const classes = [
    styles.card,
    styles[padding],
    shadow ? styles.shadow : '',
    hover ? styles.hover : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}

