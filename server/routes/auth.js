const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user with role information
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    const permissionsResult = await pool.query(`
      SELECT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [user.role_id]);

    const permissions = permissionsResult.rows.map(row => row.name);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role_name,
        permissions
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role_name,
        permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate token
router.get('/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    if (!req.user.permissions.includes('manage_users')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.created_at, r.name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    if (!req.user.permissions.includes('manage_users')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { username, email, password, role_name } = req.body;

    if (!username || !email || !password || !role_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role_name]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const roleId = roleResult.rows[0].id;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
      [username, email, passwordHash, roleId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { 
        id: result.rows[0].id, 
        username: result.rows[0].username, 
        email: result.rows[0].email,
        role: role_name
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    if (!req.user.permissions.includes('manage_users')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { id } = req.params;
    const { email, password, role_name } = req.body;

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role_name]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const roleId = roleResult.rows[0].id;

    // Update user
    let query = 'UPDATE users SET email = $1, role_id = $2';
    let params = [email, roleId];

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      query += ', password_hash = $3';
      params.push(passwordHash);
    }

    query += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, username, email';
    params.push(id);

    const result = await pool.query(query, params);

    res.json({
      message: 'User updated successfully',
      user: { 
        id: result.rows[0].id, 
        username: result.rows[0].username, 
        email: result.rows[0].email,
        role: role_name
      }
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    if (!req.user.permissions.includes('manage_users')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { id } = req.params;

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the default admin user
    if (userResult.rows[0].username === 'Ryan') {
      return res.status(403).json({ error: 'Cannot delete default admin user' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available roles
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to manage users
    if (!req.user.permissions.includes('manage_users')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await pool.query('SELECT id, name, description FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;