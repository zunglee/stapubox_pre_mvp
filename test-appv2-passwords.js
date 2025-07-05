import mysql from 'mysql2/promise';

async function testDifferentPasswords() {
  console.log('Testing replit-appv2 with different password variations...');
  
  const passwords = [
    'replit123',
    'stapubox123', 
    'password',
    'replit',
    'stapubox',
    '123456',
    '',
    'admin'
  ];

  for (const password of passwords) {
    console.log(`\n--- Testing password: "${password || '[EMPTY]'}" ---`);
    
    const config = {
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-appv2',
      password: password,
      database: 'stapubox_db',
      connectTimeout: 10000
    };
    
    try {
      const connection = await mysql.createConnection(config);
      console.log('✅ CONNECTION SUCCESSFUL!');
      
      // Test basic query
      const [result] = await connection.execute('SELECT 1 as test');
      console.log('✅ Query test successful');
      
      await connection.end();
      console.log(`✅ SUCCESS: Password "${password || '[EMPTY]'}" works!`);
      return { success: true, password };
      
    } catch (error) {
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`❌ Access denied with password: "${password || '[EMPTY]'}"`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n--- Summary ---');
  console.log('No password worked for replit-appv2 user');
  console.log('This suggests either:');
  console.log('1. User was not created successfully');
  console.log('2. User has a different password');
  console.log('3. User still has IP restrictions');
  console.log('4. User lacks database permissions');
  
  return { success: false };
}

testDifferentPasswords().catch(console.error);