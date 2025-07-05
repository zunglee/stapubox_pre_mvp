import mysql from 'mysql2/promise';

async function testMySQLAppV2() {
  console.log('Testing MySQL connection with new user "replit-appv2"...');
  
  const config = {
    host: '147.93.107.184',
    port: 3306,
    user: 'replit-appv2',
    password: 'replit123',
    database: 'stapubox_db',
    connectTimeout: 15000
  };

  console.log(`Host: ${config.host}`);
  console.log(`User: ${config.user}`);
  console.log(`Database: ${config.database}`);
  
  try {
    console.log('Creating connection...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connected successfully!');
    
    // Test basic query
    console.log('Testing basic query...');
    const [basicTest] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Basic query successful:', basicTest);
    
    // Show databases
    console.log('Checking available databases...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('Available databases:', databases.map(db => db.Database));
    
    // Switch to stapubox_db
    await connection.execute('USE stapubox_db');
    console.log('✅ Switched to stapubox_db');
    
    // Show tables
    console.log('Checking tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Check users table specifically
    const hasUsersTable = tables.some(t => Object.values(t)[0] === 'users');
    console.log(`Users table exists: ${hasUsersTable}`);
    
    if (hasUsersTable) {
      // Get table structure
      console.log('Getting users table structure...');
      const [structure] = await connection.execute('DESCRIBE users');
      console.log('Users table structure:');
      structure.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key}`);
      });
      
      // Count users
      console.log('Counting users...');
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`Total users in MySQL database: ${count[0].count}`);
      
      // Fetch all users
      console.log('Fetching all users...');
      const [users] = await connection.execute('SELECT id, name, phoneNumber, userType, city, createdAt FROM users ORDER BY id');
      console.log('All users in MySQL database:');
      users.forEach(user => {
        console.log(`  ID: ${user.id}, Name: ${user.name}, Phone: ${user.phoneNumber}, Type: ${user.userType}, City: ${user.city}`);
      });
      
      // Test write permissions
      console.log('Testing write permissions...');
      const testUser = {
        name: 'MySQL Test User',
        phoneNumber: '1111111111',
        userType: 'player',
        dateOfBirth: '1990-01-01',
        age: 34,
        workplace: 'Test Company',
        city: 'Test City',
        societyArea: 'Test Area',
        locationCoordinates: '0,0',
        locationName: 'Test Location'
      };
      
      const [insertResult] = await connection.execute(
        'INSERT INTO users (name, phoneNumber, userType, dateOfBirth, age, workplace, city, societyArea, locationCoordinates, locationName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [testUser.name, testUser.phoneNumber, testUser.userType, testUser.dateOfBirth, testUser.age, testUser.workplace, testUser.city, testUser.societyArea, testUser.locationCoordinates, testUser.locationName]
      );
      console.log(`✅ Test user inserted with ID: ${insertResult.insertId}`);
      
      // Delete test user
      await connection.execute('DELETE FROM users WHERE id = ?', [insertResult.insertId]);
      console.log('✅ Test user deleted');
      
    } else {
      console.log('❌ Users table not found');
    }
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
    return { success: true, userCount: hasUsersTable ? count[0].count : 0 };
    
  } catch (error) {
    console.log(`❌ Connection failed:`, error.message);
    console.log('Error code:', error.code);
    console.log('Error errno:', error.errno);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  → Access denied - check user credentials or permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('  → Connection refused - server may be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('  → Connection timeout - network issue');
    }
    
    return { success: false, error: error.message };
  }
}

testMySQLAppV2().then(result => {
  console.log('\n--- Final Result ---');
  if (result.success) {
    console.log('✅ MySQL connection successful!');
    console.log(`Users found: ${result.userCount}`);
  } else {
    console.log('❌ MySQL connection failed');
    console.log(`Error: ${result.error}`);
  }
}).catch(console.error);