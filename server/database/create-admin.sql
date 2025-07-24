-- Create default admin user if not exists
DO $$
DECLARE
  admin_role_id INTEGER;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Create default admin user if not exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'Ryan') THEN
    INSERT INTO users (username, email, password_hash, role_id)
    VALUES (
      'Ryan', 
      'admin@domain-monitor.com',
      -- Password: Domain25@#
      '$2a$10$8KzaNdKIMyOkASCUqYSYGONjwBJtjUoU5i8gxA1xUHlP3FQpKEVey',
      admin_role_id
    );
  END IF;
END $$;