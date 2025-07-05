import mysql from 'mysql2/promise';

async function testAuthenticationMethods() {
  console.log('🔐 Testing different MySQL authentication methods...\n');
  
  const configs = [
    {
      name: 'URI Format',
      config: 'mysql://replit-app:%23S%21t%40pubox007%21%23@147.93.107.184:3306/stapubox_replit'
    },
    {
      name: 'With Charset UTF8',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        charset: 'utf8'
      }
    },
    {
      name: 'With Charset UTF8MB4',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        charset: 'utf8mb4'
      }
    },
    {
      name: 'With insecureAuth',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        insecureAuth: true
      }
    },
    {
      name: 'With authSwitchHandler',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        authSwitchHandler: (data, cb) => {
          if (data.pluginName === 'mysql_native_password') {
            const password = Buffer.from('#S!t@pubox007!#');
            const passwordHash = mysql.createConnection({}).passwordSha1(password);
            return cb(null, passwordHash);
          }
          cb();
        }
      }
    },
    {
      name: 'With SQL Mode',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        sql_mode: 'TRADITIONAL'
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`📊 Testing: ${name}`);
    try {
      const connection = await mysql.createConnection(config);
      const [rows] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
      await connection.end();
      console.log(`✅ ${name}: SUCCESS - Found ${rows[0].user_count} users`);
      console.log(`   This configuration works! 🎉\n`);
      
      // If we found a working config, test a more complex query
      console.log('🔄 Testing complex query with working config...');
      const testConnection = await mysql.createConnection(config);
      const [users] = await testConnection.execute('SELECT id, name, phone_number FROM users LIMIT 3');
      console.log('✅ Complex query results:', users);
      await testConnection.end();
      return { success: true, workingConfig: config, configName: name };
      
    } catch (error) {
      console.log(`❌ ${name}: ${error.code || error.message}`);
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('   → Authentication failed');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   → Connection refused');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   → Connection timeout');
      }
    }
    console.log('');
  }

  return { success: false };
}

// Test and report results
testAuthenticationMethods().then(result => {
  if (result.success) {
    console.log('\n🎯 SOLUTION FOUND!');
    console.log('Working configuration:', result.configName);
    console.log('Config details:', JSON.stringify(result.workingConfig, null, 2));
  } else {
    console.log('\n❌ No authentication method worked');
    console.log('All configurations failed - likely a server-side restriction');
  }
});