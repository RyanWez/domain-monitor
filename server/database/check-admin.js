const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkAdmin() {
  try {
    console.log('Checking database for admin user...');
    
    // Check if roles table exists
    const rolesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'roles'
      );
    `);
    
    console.log('Roles table exists:', rolesTableCheck.rows[0].exists);
    
    if (rolesTableCheck.rows[0].exists) {
      // Check for admin role
      const adminRoleCheck = await pool.query(`
        SELECT * FROM roles WHERE name = 'admin';
      `);
      
      console.log('Admin role found:', adminRoleCheck.rows.length > 0);
      
      if (adminRoleCheck.rows.length > 0) {
        console.log('Admin role ID:', adminRoleCheck.rows[0].id);
      }
    }
    
    // Check if users table exists
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', usersTableCheck.rows[0].exists);
    
    if (usersTableCheck.rows[0].exists) {
      // Check for Ryan user
      const userCheck = await pool.query(`
        SELECT * FROM users WHERE username = 'Ryan';
      `);
      
      console.log('Ryan user found:', userCheck.rows.length > 0);
      
      if (userCheck.rows.length > 0) {
        console.log('User details:', {
          id: userCheck.rows[0].id,
          username: userCheck.rows[0].username,
          role_id: userCheck.rows[0].role_id
        });
      }
    }
    
    // Create admin user manually if needed
    if (usersTableCheck.rows[0].exists && rolesTableCheck.rows[0].exists) {
      const adminRoleResult = await pool.query(`SELECT id FROM roles WHERE name = 'admin'`);
      
      if (adminRoleResult.rows.length > 0) {
        const adminRoleId = adminRoleResult.rows[0].id;
        
        // Check if Ryan user exists
        const userCheck = await pool.query(`SELECT id FROM users WHERE username = 'Ryan'`);
        
        if (userCheck.rows.length === 0) {
          // Create Ryan user
          console.log('Creating Ryan admin user...');
          
          // Password: Domain25@#
          const passwordHash = '$2a$10$8KzaNdKIMyOkASCUqYSYGONjwBJtjUoU5i8gxA1xUHlP3FQpKEVey';
          
          await pool.query(`
            INSERT INTO users (username, email, password_hash, role_id)
            VALUES ('Ryan', 'admin@domain-monitor.com', $1, $2)
          `, [passwordHash, adminRoleId]);
          
          console.log('Ryan admin user created successfully');
        } else {
          // Update Ryan user to have admin role
          console.log('Updating Ryan user to admin role...');
          
          await pool.query(`
            UPDATE users SET role_id = $1 WHERE username = 'Ryan'
          `, [adminRoleId]);
          
          console.log('Ryan user updated to admin role');
        }
      }
    }
    
    console.log('Database check completed');
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkAdmin();