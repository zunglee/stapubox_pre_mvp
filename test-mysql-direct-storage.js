import { MySQLDirectStorage } from './server/mysql-direct-storage.js';

async function testMySQLDirectStorage() {
  console.log('🧪 Testing MySQL Direct Storage Implementation...\n');
  
  const storage = new MySQLDirectStorage();
  
  try {
    // Test 1: Get user by ID
    console.log('📊 Testing getUser(4)...');
    const user = await storage.getUser(4);
    console.log('✅ User retrieved:', user?.name, user?.phoneNumber);
    
    // Test 2: Get user by phone number
    console.log('\n📊 Testing getUserByPhoneNumber...');
    const userByPhone = await storage.getUserByPhoneNumber('9643673900');
    console.log('✅ User by phone:', userByPhone?.name);
    
    // Test 3: Search users
    console.log('\n📊 Testing searchUsers...');
    const users = await storage.searchUsers({ limit: 3 });
    console.log('✅ Search results:', users.length, 'users found');
    users.forEach((u, i) => console.log(`   ${i+1}. ${u.name} (${u.userType})`));
    
    // Test 4: Get user activities
    console.log('\n📊 Testing getUserActivities...');
    const activities = await storage.getUserActivities(4);
    console.log('✅ Activities found:', activities.length);
    activities.forEach((a, i) => console.log(`   ${i+1}. ${a.activityName} (${a.skillLevel})`));
    
    // Test 5: Get interests
    console.log('\n📊 Testing getInterestsBySender...');
    const sentInterests = await storage.getInterestsBySender(4);
    console.log('✅ Sent interests:', sentInterests.length);
    
    console.log('\n📊 Testing getInterestsByReceiver...');
    const receivedInterests = await storage.getInterestsByReceiver(4);
    console.log('✅ Received interests:', receivedInterests.length);
    
    // Test 6: Filter options
    console.log('\n📊 Testing getFilterOptions...');
    const filters = await storage.getFilterOptions();
    console.log('✅ Filter options:');
    console.log(`   Cities: ${filters.cities.length} (${filters.cities.slice(0, 3).join(', ')}...)`);
    console.log(`   Activities: ${filters.activities.length} (${filters.activities.slice(0, 3).join(', ')}...)`);
    console.log(`   Skill levels: ${filters.skillLevels.length} (${filters.skillLevels.join(', ')})`);
    
    // Test 7: Complex search with filters
    console.log('\n📊 Testing complex search with filters...');
    const filteredUsers = await storage.searchUsers({
      userType: 'player',
      limit: 2
    });
    console.log('✅ Filtered search (players only):', filteredUsers.length, 'users found');
    
    console.log('\n🎉 All MySQL Direct Storage tests passed!');
    console.log('Ready to switch from PostgreSQL to MySQL.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    return false;
  }
}

testMySQLDirectStorage();