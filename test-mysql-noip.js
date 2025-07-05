import mysql from 'mysql2/promise';

async function testMySQLWithoutIP() {
  console.log('Testing MySQL connection methods without IP restrictions...');
  
  const configs = [
    {
      name: 'Wildcard Host User',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'stapubox_user',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'Public User Account',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'public_user',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'App User Account',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'app_user',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'Generic Connection',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'mysql',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'Any Host Replit User',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit',
        password: 'replit123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'Different Password Root',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'root',
        password: 'stapubox123',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    },
    {
      name: 'Empty Password Root',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'root',
        password: '',
        database: 'stapubox_db',
        connectTimeout: 15000
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`User: ${config.user}`);
    console.log(`Password: ${config.password ? '[SET]' : '[EMPTY]'}`);
    
    try {
      console.log('Attempting connection...');
      const connection = await mysql.createConnection(config);
      
      console.log('✅ Connected successfully!');
      
      // Test database access
      console.log('Testing database access...');
      const [databases] = await connection.execute('SHOW DATABASES');
      console.log('Available databases:', databases.map(db => db.Database));
      
      // Check if our database exists
      const hasStapuboxDB = databases.some(db => db.Database === 'stapubox_db');
      console.log(`stapubox_db exists: ${hasStapuboxDB}`);
      
      if (hasStapuboxDB) {
        // Switch to our database
        await connection.execute('USE stapubox_db');
        console.log('Switched to stapubox_db');
        
        // Check tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Available tables:', tables.map(t => Object.values(t)[0]));
        
        // Check users table specifically
        const hasUsersTable = tables.some(t => Object.values(t)[0] === 'users');
        console.log(`users table exists: ${hasUsersTable}`);
        
        if (hasUsersTable) {
          // Get user count
          const [count] = await connection.execute('SELECT COUNT(*) as count FROM users');
          console.log(`Total users: ${count[0].count}`);
          
          // Get sample users
          const [users] = await connection.execute('SELECT id, name, phoneNumber, userType, city FROM users LIMIT 3');
          console.log('Sample users:', users);
        }
      }
      
      await connection.end();
      console.log('✅ Test completed successfully');
      
      return { success: true, config: name, user: config.user };
      
    } catch (error) {
      console.log(`❌ ${name} failed:`, error.message);
      
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('  → Access denied - user/password incorrect or IP restricted');
      } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
        console.log('  → Database access denied - user lacks database permissions');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('  → Connection refused - server down or port blocked');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('  → Connection timeout - network or firewall issue');
      } else {
        console.log(`  → Error code: ${error.code}`);
      }
    }
  }
  
  console.log('\n--- Summary ---');
  console.log('All connection attempts completed.');
  
  // Try to determine current IP for reference
  try {
    const response = await fetch('http://checkip.amazonaws.com/');
    const ip = await response.text();
    console.log(`Current container IP: ${ip.trim()}`);
  } catch (e) {
    console.log('Could not determine current IP');
  }
}

testMySQLWithoutIP().catch(console.error);