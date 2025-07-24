const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Read and execute init-db.sql
    const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    await pool.query(initSql);
    console.log('✅ Database tables created');
    
    // Create default roles and permissions
    await createDefaultRolesAndPermissions();
    console.log('✅ Default roles and permissions created');
    
    // Create default admin user
    await createDefaultAdmin();
    console.log('✅ Default admin user created');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createDefaultRolesAndPermissions() {
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
}

async function createDefaultAdmin() {
  const bcrypt = require('bcryptjs');
  
  // Check if admin user already exists
  const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', ['Ryan']);
  
  if (existingAdmin.rows.length === 0) {
    // Get admin role ID
    const adminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    
    if (adminRole.rows.length > 0) {
      // Hash password: Domain25@#
      const passwordHash = await bcrypt.hash('Domain25@#', 10);
      
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)',
        ['Ryan', 'admin@domain-monitor.com', passwordHash, adminRole.rows[0].id]
      );
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };