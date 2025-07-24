const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Drop all tables
    await pool.query(`
      DROP TABLE IF EXISTS status_logs CASCADE;
      DROP TABLE IF EXISTS domains CASCADE;
      DROP TABLE IF EXISTS domain_groups CASCADE;
      DROP TABLE IF EXISTS role_permissions CASCADE;
      DROP TABLE IF EXISTS permissions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
    `);
    
    console.log('All tables dropped successfully');
    
    // Read and execute SQL files
    const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    await pool.query(initSql);
    console.log('Database initialized successfully');
    
    const permissionsSql = fs.readFileSync(path.join(__dirname, 'permissions-schema.sql'), 'utf8');
    await pool.query(permissionsSql);
    console.log('Permissions schema created successfully');
    
    const adminSql = fs.readFileSync(path.join(__dirname, 'create-admin.sql'), 'utf8');
    await pool.query(adminSql);
    console.log('Admin user created successfully');
    
    console.log('Database reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();