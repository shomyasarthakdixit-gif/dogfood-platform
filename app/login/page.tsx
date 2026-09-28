import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './login.module.css';

export const metadata: Metadata = { title: 'Login — Dogfood 2026' };

export default function LoginPage() {
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
            
            <form action="/dashboard">
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className={styles.input} 
                  placeholder="Email" 
                  required 
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
                  required 
                />
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Get Started
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
