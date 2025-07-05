import mysql from 'mysql2/promise';

async function testMySQLFetch() {
  console.log('Testing MySQL connection and user fetch from 147.93.107.184...');
  
  const configs = [
    {
      name: 'Current Replit IP Config',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
      }
    },
    {
      name: 'Generic Root Config',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'root',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`Host: ${config.host}`);
    console.log(`User: ${config.user}`);
    console.log(`Database: ${config.database}`);
    
    try {
      console.log('Creating connection...');
      const connection = await mysql.createConnection(config);
      
      console.log('✅ Connected successfully!');
      
      // Test basic query
      console.log('Testing basic query...');
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ Basic query successful:', rows);
      
      // Check if users table exists
      console.log('Checking users table...');
      const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
      console.log(`Users table exists: ${tables.length > 0}`);
      
      if (tables.length > 0) {
        // Get table structure
        console.log('Getting table structure...');
        const [structure] = await connection.execute('DESCRIBE users');
        console.log('Table structure:', structure);
        
        // Count users
        console.log('Counting users...');
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`Total users in database: ${count[0].count}`);
        
        // Fetch sample users
        console.log('Fetching sample users...');
        const [users] = await connection.execute('SELECT id, name, phoneNumber, userType, city FROM users LIMIT 5');
        console.log('Sample users:', users);
      }
      
      await connection.end();
      console.log('✅ Connection closed successfully');
      
      return { success: true, config: name };
      
    } catch (error) {
      console.log(`❌ ${name} failed:`, error.message);
      console.log('Error code:', error.code);
      console.log('Error errno:', error.errno);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('  → Connection refused - server may be down or port blocked');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('  → Access denied - invalid credentials or IP not whitelisted');
      } else if (error.code === 'EHOSTUNREACH') {
        console.log('  → Host unreachable - network issue or wrong IP');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('  → Connection timeout - firewall or network issue');
      }
    }
  }
  
  console.log('\n--- Summary ---');
  console.log('All connection attempts failed.');
  console.log('Current IP address of this container:');
  
  // Get current IP
  try {
    const response = await fetch('http://checkip.amazonaws.com/');
    const ip = await response.text();
    console.log(`Current IP: ${ip.trim()}`);
  } catch (e) {
    console.log('Could not determine current IP');
  }
}

testMySQLFetch().catch(console.error);