/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rowCount } = await pool.query('SELECT id FROM migrations WHERE name = $1', [file]);
      if (rowCount === 0) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await pool.query('BEGIN');
        try {
          await pool.query(sql);
          await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await pool.query('COMMIT');
          console.log(`Migration ${file} completed.`);
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`Migration ${file} failed:`, err);
          throw err;
        }
      }
    }
    console.log('All migrations applied successfully.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrate };
