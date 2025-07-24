const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { checkDomain } = require('../services/checker');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all domain groups
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, 
             COUNT(d.id) as domain_count,
             COUNT(CASE WHEN d.status = 'up' THEN 1 END) as up_count,
             COUNT(CASE WHEN d.status = 'down' THEN 1 END) as down_count
      FROM domain_groups g
      LEFT JOIN domains d ON g.id = d.group_id
      GROUP BY g.id
      ORDER BY g.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domain groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group by ID with its domains
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get group details
    const groupResult = await pool.query('SELECT * FROM domain_groups WHERE id = $1', [id]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get domains in this group
    const domainsResult = await pool.query(`
      SELECT d.*, 
             COUNT(sl.id) as total_checks,
             COUNT(CASE WHEN sl.status = 'up' THEN 1 END) as up_checks
      FROM domains d
      LEFT JOIN status_logs sl ON d.id = sl.domain_id
      WHERE d.group_id = $1
      GROUP BY d.id
      ORDER BY d.name
    `, [id]);
    
    const domains = domainsResult.rows.map(domain => ({
      ...domain,
      uptime_percentage: domain.total_checks > 0 
        ? Math.round((domain.up_checks / domain.total_checks) * 100) 
        : 0
    }));

    res.json({
      ...groupResult.rows[0],
      domains
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new group
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await pool.query(
      'INSERT INTO domain_groups (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await pool.query(
      'UPDATE domain_groups SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First update all domains in this group to have null group_id
    await pool.query('UPDATE domains SET group_id = NULL WHERE group_id = $1', [id]);
    
    // Then delete the group
    const result = await pool.query('DELETE FROM domain_groups WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check all domains in a group
router.post('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all domains in this group
    const domainsResult = await pool.query('SELECT * FROM domains WHERE group_id = $1', [id]);
    
    if (domainsResult.rows.length === 0) {
      return res.json({ message: 'No domains in this group to check' });
    }

    // Check all domains concurrently
    const checkPromises = domainsResult.rows.map(domain => 
      checkDomain(domain).catch(error => {
        console.error(`Error checking domain ${domain.name}:`, error);
        return null;
      })
    );

    const results = await Promise.all(checkPromises);
    const successfulChecks = results.filter(result => result !== null).length;
    
    res.json({ 
      message: `Checked ${successfulChecks}/${domainsResult.rows.length} domains in this group`,
      results: results.filter(r => r !== null)
    });
  } catch (error) {
    console.error('Error checking group domains:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;