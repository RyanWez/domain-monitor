-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions table (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- Insert default permissions
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
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator with full access'),
('user', 'Regular user with limited access')
ON CONFLICT (name) DO NOTHING;

-- Get role IDs
DO $$
DECLARE
  admin_role_id INTEGER;
  user_role_id INTEGER;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  -- Assign all permissions to admin role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;
  
  -- Assign limited permissions to user role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT user_role_id, id FROM permissions 
  WHERE name IN ('view_domains', 'view_groups', 'check_domain', 'view_reports')
  ON CONFLICT DO NOTHING;
END $$;

-- Create default admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'Ryan') THEN
    INSERT INTO users (username, email, password_hash, role_id)
    VALUES (
      'Ryan', 
      'admin@domain-monitor.com',
      -- Password: Domain25@#
      '$2a$10$8KzaNdKIMyOkASCUqYSYGONjwBJtjUoU5i8gxA1xUHlP3FQpKEVey',
      (SELECT id FROM roles WHERE name = 'admin')
    );
  END IF;
END $$;