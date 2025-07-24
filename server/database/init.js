const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const initDatabase = async () => {
  try {
    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions table (many-to-many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create domain_groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS domain_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create domains table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        group_id INTEGER REFERENCES domain_groups(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'unknown',
        last_checked TIMESTAMP,
        response_time INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create status_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS status_logs (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        response_time INTEGER,
        error_message TEXT,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default permissions
    await pool.query(`
      INSERT INTO permissions (name, description) VALUES
      ('view_domains', 'View domains list and details'),
      ('add_domain', 'Add new domains'),
      ('edit_domain', 'Edit existing domains'),
      ('delete_domain', 'Delete domains'),
      ('check_domain', 'Manually check domain status'),
      ('view_groups', 'View domain groups'),
      ('add_group', 'Add new domain groups'),
      ('edit_group', 'Edit existing domain groups'),
      ('delete_group', 'Delete domain groups'),
      ('check_group', 'Check all domains in a group'),
      ('view_settings', 'View application settings'),
      ('edit_settings', 'Edit application settings'),
      ('view_reports', 'View domain reports and analytics'),
      ('manage_users', 'Manage user accounts')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default roles
    await pool.query(`
      INSERT INTO roles (name, description) VALUES
      ('admin', 'Administrator with full access'),
      ('user', 'Regular user with limited access')
      ON CONFLICT (name) DO NOTHING
    `);

    // Get role IDs and assign permissions
    const adminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const userRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['user']);
    
    if (adminRole.rows.length > 0) {
      const adminRoleId = adminRole.rows[0].id;
      
      // Assign all permissions to admin role
      const allPermissions = await pool.query('SELECT id FROM permissions');
      for (const permission of allPermissions.rows) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [adminRoleId, permission.id]
        );
      }
    }
    
    if (userRole.rows.length > 0) {
      const userRoleId = userRole.rows[0].id;
      
      // Assign limited permissions to user role
      const limitedPermissions = await pool.query(
        'SELECT id FROM permissions WHERE name IN ($1, $2, $3, $4)',
        ['view_domains', 'view_groups', 'check_domain', 'view_reports']
      );
      
      for (const permission of limitedPermissions.rows) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userRoleId, permission.id]
        );
      }
    }

    // Create default admin user if not exists
    const defaultAdmin = await pool.query('SELECT id FROM users WHERE username = $1', ['Ryan']);
    
    if (defaultAdmin.rows.length === 0 && adminRole.rows.length > 0) {
      // Password: Domain25@#
      const passwordHash = '$2a$10$8KzaNdKIMyOkASCUqYSYGONjwBJtjUoU5i8gxA1xUHlP3FQpKEVey';
      
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)',
        ['Ryan', 'admin@domain-monitor.com', passwordHash, adminRole.rows[0].id]
      );
    }

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool, initDatabase };