import mysql from 'mysql2/promise';

async function testNewMySQLUser() {
  console.log('🔑 Testing new MySQL user for IP-specific access...\n');
  
  console.log('Previous error was:');
  console.log('❌ Access denied for user \'replit-app\'@\'34.169.173.67\'');
  console.log('');
  console.log('You created user:');
  console.log('✅ CREATE USER \'replit-app\'@\'34.169.173.67\' IDENTIFIED BY \'#S!t@pubox007!#\';');
  console.log('');

  try {
    console.log('🔗 Testing Node.js mysql2 connection...');
    
    const connection = await mysql.createConnection({
      host: '147.93.107.184',
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      port: 3306
    });
    
    console.log('✅ Connection successful!');
    
    // Test basic query
    const [testResult] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Basic query successful:', testResult[0]);
    
    // Test user count
    const [countResult] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ User count query:', countResult[0]);
    
    // Test user data retrieval
    const [usersResult] = await connection.execute('SELECT id, name, phone_number FROM users LIMIT 3');
    console.log('✅ User data retrieval:');
    usersResult.forEach(user => {
      console.log(`   User ${user.id}: ${user.name} (${user.phone_number})`);
    });
    
    // Test user activities
    const [activitiesResult] = await connection.execute('SELECT COUNT(*) as activity_count FROM user_activities');
    console.log('✅ Activities count:', activitiesResult[0]);
    
    // Test interests
    const [interestsResult] = await connection.execute('SELECT COUNT(*) as interest_count FROM interests');
    console.log('✅ Interests count:', interestsResult[0]);
    
    await connection.end();
    
    console.log('\n🎉 SUCCESS! MySQL connection is now working!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. ✅ MySQL user created with correct IP');
    console.log('2. ✅ Node.js mysql2 library connection working');
    console.log('3. 🔄 Can now switch from PostgreSQL to MySQL');
    console.log('4. 🔄 No need for API Gateway - direct connection works!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection still failed:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Grant privileges: GRANT ALL PRIVILEGES ON stapubox_replit.* TO \'replit-app\'@\'34.169.173.67\';');
      console.log('2. Flush privileges: FLUSH PRIVILEGES;');
      console.log('3. Check if user exists: SELECT User, Host FROM mysql.user WHERE User=\'replit-app\';');
    }
    
    return false;
  }
}

testNewMySQLUser();