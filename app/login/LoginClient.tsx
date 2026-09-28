"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to login. Please check your credentials.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Form Side */}
      <div className={styles.formSide}>
        <Link href="/" className={styles.brand}>
          Dogfood<span>.</span>dev
        </Link>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div className={styles.formWrapper}>
            <h1 className={styles.title}>Login</h1>
            <p className={styles.subtitle}>& start building your hackathon project.</p>
            
            {error && (
              <div style={{ color: 'var(--color-error)', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className={styles.input} 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={isLoading}
                />
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className={styles.input} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={isLoading}
                />
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Get Started'}
              </button>
            </form>
            
            <div>
              <Link href="#" className={styles.forgotLink}>
                Forgot Password? <span>Click Here</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Image/Illustration Side */}
      <div className={styles.imageSide}>
        <div className={styles.blob} />
        {/* We use an unsplash image that looks like people building/coding to match the vector illustration vibe */}
        <img 
          src="/login-illustration.jpg" 
          alt="Team collaborating" 
          className={styles.illustration} 
        />
      </div>
    </div>
  );
}
