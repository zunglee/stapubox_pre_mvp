import mysql from 'mysql2/promise';

async function testDifferentConfigurations() {
  const configs = [
    {
      name: 'Basic Config (Current)',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        connectTimeout: 60000
      }
    },
    {
      name: 'With SSL disabled',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        connectTimeout: 60000,
        ssl: false
      }
    },
    {
      name: 'With additional options',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
        ssl: false,
        authPlugins: {
          mysql_native_password: () => mysql.authPlugins.mysql_native_password
        }
      }
    },
    {
      name: 'With charset and timezone',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        connectTimeout: 60000,
        ssl: false,
        charset: 'utf8mb4',
        timezone: '+00:00'
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\n🔄 Testing: ${name}`);
      const connection = await mysql.createConnection(config);
      
      console.log('✅ Connection successful');
      
      // Test query
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ Query successful:', rows[0]);
      
      await connection.end();
      console.log('✅ Configuration works!');
      break; // Exit on first successful config
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
    }
  }
}

testDifferentConfigurations();