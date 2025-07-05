import mysql from 'mysql2/promise';

async function captureDetailedMySQLError() {
  console.log('📋 Capturing detailed MySQL connection error...\n');
  
  try {
    console.log('🔗 Attempting MySQL connection with mysql2...');
    
    const connection = await mysql.createConnection({
      host: '147.93.107.184',
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      port: 3306,
      connectTimeout: 30000,
      acquireTimeout: 30000
    });
    
    console.log('✅ Connection successful!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    
    await connection.end();
    
  } catch (error) {
    console.log('❌ MySQL Connection Error Captured:\n');
    console.log('═'.repeat(60));
    console.log('Error Object Details:');
    console.log('═'.repeat(60));
    console.log('error.message:', error.message);
    console.log('error.code:', error.code);
    console.log('error.errno:', error.errno);
    console.log('error.sqlState:', error.sqlState);
    console.log('error.sqlMessage:', error.sqlMessage);
    console.log('error.name:', error.name);
    console.log('error.stack:\n', error.stack);
    
    console.log('\n' + '═'.repeat(60));
    console.log('Full Error Object:');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(error, null, 2));
    
    console.log('\n' + '═'.repeat(60));
    console.log('Error Analysis:');
    console.log('═'.repeat(60));
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔒 ACCESS DENIED ERROR');
      console.log('   → MySQL server rejected authentication');
      console.log('   → Credentials may be valid for command line but not Node.js');
      console.log('   → Possible host-based authentication restriction');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚫 CONNECTION REFUSED');
      console.log('   → MySQL server not accepting connections');
      console.log('   → Port may be blocked or service down');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ CONNECTION TIMEOUT');
      console.log('   → Network connectivity issue');
      console.log('   → Firewall blocking connection');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🔍 HOST NOT FOUND');
      console.log('   → DNS resolution failed');
      console.log('   → Hostname incorrect');
    } else {
      console.log('❓ UNKNOWN ERROR TYPE');
      console.log('   → Review full error details above');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('Comparison with Command Line:');
    console.log('═'.repeat(60));
    console.log('Command line command that WORKS:');
    console.log('mysql -h 147.93.107.184 -u replit-app -p\'#S!t@pubox007!#\' stapubox_replit');
    console.log('\nNode.js connection that FAILS:');
    console.log('mysql.createConnection({ host: "147.93.107.184", user: "replit-app", ... })');
  }
}

captureDetailedMySQLError();