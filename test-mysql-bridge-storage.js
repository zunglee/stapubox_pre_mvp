import { MySQLBridgeStorage } from './server/mysql-bridge-storage.js';

async function testMySQLBridgeStorage() {
  console.log('🔄 Testing MySQL Bridge Storage...');
  
  const storage = new MySQLBridgeStorage();
  
  try {
    // Test basic user retrieval
    console.log('📊 Testing user retrieval...');
    const user = await storage.getUser(4); // Navin Kumar
    console.log('✅ User retrieved:', user?.name, user?.phoneNumber);
    
    // Test user search
    console.log('📊 Testing user search...');
    const users = await storage.searchUsers({ limit: 3 });
    console.log('✅ Search results:', users.length, 'users found');
    
    // Test user activities
    console.log('📊 Testing user activities...');
    const activities = await storage.getUserActivities(4);
    console.log('✅ Activities found:', activities.length);
    
    // Test interests
    console.log('📊 Testing interests...');
    const interests = await storage.getInterestsBySender(4);
    console.log('✅ Interests found:', interests.length);
    
    // Test filter options
    console.log('📊 Testing filter options...');
    const filters = await storage.getFilterOptions();
    console.log('✅ Filter options:', {
      cities: filters.cities.length,
      activities: filters.activities.length
    });
    
    console.log('🎉 MySQL Bridge Storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMySQLBridgeStorage();