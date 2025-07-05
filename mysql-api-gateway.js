// MySQL API Gateway Server
// Deploy this on any VPS or cloud service that can connect to MySQL

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const execAsync = promisify(exec);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MySQL connection via command line (since it works)
const MYSQL_CMD = "mysql -h 147.93.107.184 -u replit-app -p'#S!t@pubox007!#' stapubox_replit";

// Parse MySQL command line output
function parseResults(output) {
  const lines = output.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split('\t');
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index];
      if (value === 'NULL') {
        row[header] = null;
      } else if (value === '1' || value === '0') {
        row[header] = value === '1';
      } else if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value);
      } else {
        row[header] = value;
      }
    });
    
    rows.push(row);
  }
  
  return rows;
}

// Execute MySQL query
async function executeQuery(sql) {
  try {
    const command = `${MYSQL_CMD} -e "${sql.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('Warning')) {
      throw new Error(stderr);
    }
    
    return parseResults(stdout);
  } catch (error) {
    throw new Error(`MySQL query failed: ${error.message}`);
  }
}

// Security middleware - add API key protection
const API_KEY = process.env.MYSQL_GATEWAY_API_KEY || 'stapubox-mysql-gateway-2025';

function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test MySQL connection
app.get('/test', requireApiKey, async (req, res) => {
  try {
    const result = await executeQuery('SELECT COUNT(*) as user_count FROM users');
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic query endpoint
app.post('/query', requireApiKey, async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // Basic SQL injection protection
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperSQL = sql.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        return res.status(403).json({ error: `Dangerous SQL keyword detected: ${keyword}` });
      }
    }
    
    const result = await executeQuery(sql);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Specific endpoints for StapuBox operations

// Get user by ID
app.get('/users/:id', requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(`SELECT * FROM users WHERE id = ${parseInt(id)}`);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
app.post('/users/search', requireApiKey, async (req, res) => {
  try {
    const { userType, city, societyArea, activityName, skillLevel, excludeUserIds, limit = 20, offset = 0 } = req.body;
    
    let sql = `
      SELECT DISTINCT u.* FROM users u 
      LEFT JOIN user_activities ua ON u.id = ua.user_id 
      WHERE u.is_active = 1
    `;
    
    if (userType) sql += ` AND u.user_type = '${userType}'`;
    if (city) sql += ` AND u.city = '${city.replace(/'/g, "''")}'`;
    if (societyArea) sql += ` AND u.society_area = '${societyArea.replace(/'/g, "''")}'`;
    if (activityName) sql += ` AND ua.activity_name = '${activityName.replace(/'/g, "''")}'`;
    if (skillLevel) sql += ` AND ua.skill_level = '${skillLevel}'`;
    if (excludeUserIds && excludeUserIds.length > 0) {
      sql += ` AND u.id NOT IN (${excludeUserIds.map(id => parseInt(id)).join(',')})`;
    }
    
    sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const result = await executeQuery(sql);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activities
app.get('/users/:id/activities', requireApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(`SELECT * FROM user_activities WHERE user_id = ${parseInt(id)}`);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interests
app.get('/interests/sent/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await executeQuery(`SELECT * FROM interests WHERE sender_id = ${parseInt(userId)}`);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/interests/received/:userId', requireApiKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await executeQuery(`SELECT * FROM interests WHERE receiver_id = ${parseInt(userId)}`);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filter options
app.get('/filter-options', requireApiKey, async (req, res) => {
  try {
    const [cities, areas, activities, skills] = await Promise.all([
      executeQuery(`SELECT DISTINCT city FROM users WHERE city IS NOT NULL AND city != '' ORDER BY city`),
      executeQuery(`SELECT DISTINCT society_area FROM users WHERE society_area IS NOT NULL AND society_area != '' ORDER BY society_area`),
      executeQuery(`SELECT DISTINCT activity_name FROM user_activities ORDER BY activity_name`),
      executeQuery(`SELECT DISTINCT skill_level FROM user_activities ORDER BY skill_level`)
    ]);
    
    res.json({
      success: true,
      data: {
        cities: cities.map(r => r.city),
        societyAreas: areas.map(r => r.society_area),
        activities: activities.map(r => r.activity_name),
        skillLevels: skills.map(r => r.skill_level),
        workplaces: [] // Add if needed
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Gateway Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MySQL API Gateway running on port ${PORT}`);
  console.log(`API Key: ${API_KEY}`);
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /test');
  console.log('  POST /query');
  console.log('  GET  /users/:id');
  console.log('  POST /users/search');
  console.log('  GET  /users/:id/activities');
  console.log('  GET  /interests/sent/:userId');
  console.log('  GET  /interests/received/:userId');
  console.log('  GET  /filter-options');
});

module.exports = app;