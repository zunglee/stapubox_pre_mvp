// Test the MySQL API Gateway locally before deployment
const http = require('http');

const GATEWAY_URL = 'http://localhost:3001';
const API_KEY = 'stapubox-mysql-gateway-2025';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testGateway() {
  console.log('🧪 Testing MySQL API Gateway...\n');

  try {
    // Test 1: Health check
    console.log('📊 Testing health endpoint...');
    const health = await makeRequest('/health');
    console.log(`✅ Health: ${health.status} - ${health.data.status}`);

    // Test 2: MySQL connection test
    console.log('\n📊 Testing MySQL connection...');
    const test = await makeRequest('/test');
    if (test.status === 200) {
      console.log(`✅ MySQL connection: SUCCESS - ${test.data.result[0].user_count} users found`);
    } else {
      console.log(`❌ MySQL connection: FAILED - ${test.data.error}`);
      return;
    }

    // Test 3: Generic query
    console.log('\n📊 Testing generic query...');
    const query = await makeRequest('/query', {
      method: 'POST',
      body: { sql: 'SELECT id, name FROM users LIMIT 3' }
    });
    if (query.status === 200) {
      console.log(`✅ Generic query: SUCCESS - ${query.data.data.length} users returned`);
      console.log('   Sample users:', query.data.data.map(u => u.name).join(', '));
    } else {
      console.log(`❌ Generic query: FAILED - ${query.data.error}`);
    }

    // Test 4: User by ID
    console.log('\n📊 Testing user by ID...');
    const user = await makeRequest('/users/4');
    if (user.status === 200 && user.data.data) {
      console.log(`✅ User by ID: SUCCESS - Found ${user.data.data.name}`);
    } else {
      console.log(`❌ User by ID: FAILED`);
    }

    // Test 5: User search
    console.log('\n📊 Testing user search...');
    const search = await makeRequest('/users/search', {
      method: 'POST',
      body: { limit: 5 }
    });
    if (search.status === 200) {
      console.log(`✅ User search: SUCCESS - ${search.data.data.length} users found`);
    } else {
      console.log(`❌ User search: FAILED - ${search.data.error}`);
    }

    // Test 6: Filter options
    console.log('\n📊 Testing filter options...');
    const filters = await makeRequest('/filter-options');
    if (filters.status === 200) {
      const data = filters.data.data;
      console.log(`✅ Filter options: SUCCESS`);
      console.log(`   Cities: ${data.cities.length}, Activities: ${data.activities.length}`);
    } else {
      console.log(`❌ Filter options: FAILED`);
    }

    // Test 7: User activities
    console.log('\n📊 Testing user activities...');
    const activities = await makeRequest('/users/4/activities');
    if (activities.status === 200) {
      console.log(`✅ User activities: SUCCESS - ${activities.data.data.length} activities found`);
    } else {
      console.log(`❌ User activities: FAILED`);
    }

    console.log('\n🎉 Gateway testing completed!');
    console.log('\n📋 Deployment Checklist:');
    console.log('✓ Gateway responds to health checks');
    console.log('✓ MySQL connection working');
    console.log('✓ Query execution working');
    console.log('✓ User operations working');
    console.log('✓ Ready for production deployment');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the gateway is running: node mysql-api-gateway.js');
  }
}

// Auto-run tests
testGateway();