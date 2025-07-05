import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      connectTimeout: 60000
    });
    
    console.log('✅ Node.js MySQL Connection Successful');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Query Test Result:', rows[0]);
    
    // Check existing tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Existing Tables:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();