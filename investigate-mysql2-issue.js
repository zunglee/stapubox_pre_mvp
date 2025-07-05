import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function investigateMySQL2Issue() {
  console.log('🔍 Investigating mysql2 library issue...\n');
  
  // 1. Test different mysql2 configurations
  const configs = [
    {
      name: 'Basic Connection',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit'
      }
    },
    {
      name: 'With SSL Disabled',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        ssl: false
      }
    },
    {
      name: 'With Timeout Settings',
      config: {
        host: '147.93.107.184',
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit',
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000
      }
    },
    {
      name: 'With Different Port',
      config: {
        host: '147.93.107.184',
        port: 3306,
        user: 'replit-app',
        password: '#S!t@pubox007!#',
        database: 'stapubox_replit'
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`📊 Testing: ${name}`);
    try {
      const connection = await mysql.createConnection(config);
      const [rows] = await connection.execute('SELECT 1 as test');
      await connection.end();
      console.log(`✅ ${name}: SUCCESS`);
    } catch (error) {
      console.log(`❌ ${name}: ${error.code || error.message}`);
      
      // Log detailed error information
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
      if (error.errno) {
        console.log(`   Error Number: ${error.errno}`);
      }
      if (error.sqlState) {
        console.log(`   SQL State: ${error.sqlState}`);
      }
    }
    console.log('');
  }

  // 2. Test network connectivity
  console.log('🌐 Testing network connectivity...');
  
  try {
    const { stdout } = await execAsync('ping -c 3 147.93.107.184');
    console.log('✅ Ping test: SUCCESS');
    console.log(stdout.split('\n').slice(-2).join('\n'));
  } catch (error) {
    console.log('❌ Ping test: FAILED');
    console.log(error.message);
  }

  // 3. Test telnet to MySQL port
  console.log('\n🔌 Testing MySQL port accessibility...');
  
  try {
    const { stdout, stderr } = await execAsync('timeout 5 telnet 147.93.107.184 3306 || echo "Connection failed"');
    if (stdout.includes('Connected') || stderr.includes('Connected')) {
      console.log('✅ Port 3306: ACCESSIBLE');
    } else {
      console.log('❌ Port 3306: NOT ACCESSIBLE');
      console.log('Output:', stdout, stderr);
    }
  } catch (error) {
    console.log('❌ Port test: FAILED');
    console.log(error.message);
  }

  // 4. Check environment and Node.js version
  console.log('\n🔧 Environment Information:');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  
  // 5. Test with different mysql libraries
  console.log('\n📦 Testing alternative MySQL libraries...');
  
  try {
    // Check if mysql (not mysql2) works
    const mysql1 = await import('mysql');
    console.log('✅ mysql library: Available');
  } catch (error) {
    console.log('❌ mysql library: Not available');
  }

  // 6. Check for firewall or security restrictions
  console.log('\n🛡️ Checking for security restrictions...');
  
  try {
    const { stdout } = await execAsync('curl -v telnet://147.93.107.184:3306 2>&1 | head -10');
    console.log('cURL test output:');
    console.log(stdout);
  } catch (error) {
    console.log('cURL test failed:', error.message);
  }
}

investigateMySQL2Issue();