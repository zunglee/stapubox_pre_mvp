import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class MySQLBridge {
  constructor() {
    this.connectionString = "mysql -h 147.93.107.184 -u replit-app -p'#S!t@pubox007!#' stapubox_replit";
  }

  async query(sql) {
    try {
      const command = `${this.connectionString} -e "${sql.replace(/"/g, '\\"')}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr);
      }
      
      return this.parseResults(stdout);
    } catch (error) {
      throw new Error(`MySQL query failed: ${error.message}`);
    }
  }

  parseResults(output) {
    const lines = output.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split('\t');
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] === 'NULL' ? null : values[index];
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  async testConnection() {
    try {
      const result = await this.query('SELECT 1 as test, COUNT(*) as user_count FROM users');
      console.log('✅ MySQL Bridge Connection Test:', result);
      return true;
    } catch (error) {
      console.log('❌ MySQL Bridge Failed:', error.message);
      return false;
    }
  }
}

async function testBridge() {
  const bridge = new MySQLBridge();
  const success = await bridge.testConnection();
  
  if (success) {
    // Test user query
    const users = await bridge.query('SELECT id, name, phone_number FROM users LIMIT 3');
    console.log('✅ Sample users:', users);
  }
}

testBridge();