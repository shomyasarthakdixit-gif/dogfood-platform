'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
          zIndex: 9999, maxWidth: 360,
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-accent)',
    warning: 'var(--color-warning)',
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        borderLeft: `4px solid ${colorMap[toast.type]}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onRemove}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', padding: 0, lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
