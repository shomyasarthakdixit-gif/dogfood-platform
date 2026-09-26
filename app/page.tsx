export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dogfood Platform</h1>
        <p style={{ fontSize: '1.2rem', color: '#555', marginTop: '0' }}>
          An open-source, self-hostable hackathon submission and judging platform.
        </p>
      </header>

      <main style={{ marginTop: '2rem' }}>
        <section style={{ padding: '1rem', border: '1px solid #eaeaea', borderRadius: '8px', maxWidth: '600px' }}>
          <h2>System Status</h2>
          <p>
            Local Development Foundation is <strong>Active</strong>.
          </p>
          <ul style={{ lineHeight: '1.6' }}>
            <li>API Health Check: <a href="/api/health" style={{ color: '#0070f3' }}>/api/health</a></li>
            <li>PostgreSQL: Configured</li>
            <li>Docker: Configured</li>
          </ul>
        </section>
      </main>

      <footer style={{ marginTop: '4rem', fontSize: '0.9rem', color: '#888' }}>
        <p>&copy; 2026 Dogfood Challenge Team</p>
      </footer>
    </div>
  );
}
