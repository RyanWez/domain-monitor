const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { checkDomain } = require('../services/checker');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all domains with group info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             g.name as group_name,
             COUNT(sl.id) as total_checks,
             COUNT(CASE WHEN sl.status = 'up' THEN 1 END) as up_checks
      FROM domains d
      LEFT JOIN domain_groups g ON d.group_id = g.id
      LEFT JOIN status_logs sl ON d.id = sl.domain_id
      GROUP BY d.id, g.id, g.name
      ORDER BY g.name NULLS LAST, d.created_at DESC
    `);

    const domains = result.rows.map(domain => ({
      ...domain,
      uptime_percentage: domain.total_checks > 0 
        ? Math.round((domain.up_checks / domain.total_checks) * 100) 
        : 0
    }));

    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get domain by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM domains WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new domain
router.post('/', async (req, res) => {
  try {
    const { name, url, group_id } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await pool.query(
      'INSERT INTO domains (name, url, group_id) VALUES ($1, $2, $3) RETURNING *',
      [name, url, group_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update domain
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, group_id } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await pool.query(
      'UPDATE domains SET name = $1, url = $2, group_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, url, group_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete domain
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM domains WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual check domain
router.post('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get domain
    const domainResult = await pool.query('SELECT * FROM domains WHERE id = $1', [id]);
    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const domain = domainResult.rows[0];
    const checkResult = await checkDomain(domain);

    res.json(checkResult);
  } catch (error) {
    console.error('Error checking domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get domain logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    const result = await pool.query(
      'SELECT * FROM status_logs WHERE domain_id = $1 ORDER BY checked_at DESC LIMIT $2',
      [id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domain logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;