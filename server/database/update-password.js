const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function updatePassword() {
  try {
    console.log('Updating Ryan user password...');
    
    const password = 'Domain25@#';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('New password hash:', passwordHash);
    
    // Update Ryan user password
    await pool.query(`
      UPDATE users SET password_hash = $1 WHERE username = 'Ryan'
    `, [passwordHash]);
    
    console.log('Password updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

updatePassword();