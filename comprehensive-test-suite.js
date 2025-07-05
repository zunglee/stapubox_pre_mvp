// Comprehensive StapuBox Application Test Suite
import http from 'http';

const BASE_URL = 'http://localhost:5000';
let sessionCookie = '';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Capture session cookies
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'].join('; ');
        }
        
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
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

async function runComprehensiveTests() {
  console.log('🧪 StapuBox Comprehensive Test Suite\n');
  console.log('Testing MySQL database integration and all application features...\n');

  let testCount = 0;
  let passedTests = 0;
  
  function test(name, passed, details = '') {
    testCount++;
    if (passed) {
      passedTests++;
      console.log(`✅ Test ${testCount}: ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.log(`❌ Test ${testCount}: ${name}`);
      if (details) console.log(`   ${details}`);
    }
  }

  try {
    // === DATABASE CONNECTIVITY TESTS ===
    console.log('🗄️  DATABASE CONNECTIVITY TESTS\n');

    // Test 1: Filter Options
    const filterOptions = await makeRequest('/api/users/filter-options');
    test('Filter Options API', 
         filterOptions.status === 200 && filterOptions.data.cities.length > 0,
         `Found ${filterOptions.data?.cities?.length || 0} cities, ${filterOptions.data?.activities?.length || 0} activities`);

    // Test 2: User Search
    const userSearch = await makeRequest('/api/users/search?limit=5');
    test('User Search API', 
         userSearch.status === 200 && userSearch.data.users.length > 0,
         `Retrieved ${userSearch.data?.users?.length || 0} users`);

    // Test 3: User by ID
    const userById = await makeRequest('/api/users/4');
    test('User by ID API', 
         userById.status === 200 && userById.data?.name,
         `Found user: ${userById.data?.name || 'Unknown'}`);

    // === AUTHENTICATION TESTS ===
    console.log('\n🔐 AUTHENTICATION TESTS\n');

    // Test 4: OTP Send (without real SMS)
    const otpSend = await makeRequest('/api/auth/send-otp', {
      method: 'POST',
      body: { phoneNumber: '9999999999' }
    });
    test('OTP Send API', 
         otpSend.status === 200,
         'OTP send endpoint responding');

    // Test 5: Protected Route (should fail without auth)
    const protectedRoute = await makeRequest('/api/users/profile');
    test('Protected Route Security', 
         protectedRoute.status === 401,
         'Correctly blocks unauthenticated access');

    // === USER MANAGEMENT TESTS ===
    console.log('\n👥 USER MANAGEMENT TESTS\n');

    // Test 6: User Activities
    const userActivities = await makeRequest('/api/users/4/activities');
    test('User Activities API', 
         userActivities.status === 200,
         `Found ${userActivities.data?.length || 0} activities`);

    // Test 7: User Search with Filters
    const filteredSearch = await makeRequest('/api/users/search?userType=player&limit=3');
    test('Filtered User Search', 
         filteredSearch.status === 200,
         `Player search returned ${filteredSearch.data?.users?.length || 0} results`);

    // === INTEREST SYSTEM TESTS ===
    console.log('\n💝 INTEREST SYSTEM TESTS\n');

    // Test 8: Interest Send (should fail without auth)
    const interestSend = await makeRequest('/api/interests/send', {
      method: 'POST',
      body: { receiverId: 5 }
    });
    test('Interest Send Protection', 
         interestSend.status === 401,
         'Interest sending properly protected');

    // === BUSINESS FEATURES TESTS ===
    console.log('\n💼 BUSINESS FEATURES TESTS\n');

    // Test 9: Career Application
    const careerApp = await makeRequest('/api/applications/career', {
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '9999999999',
        position: 'Developer',
        experience: '2 years',
        currentRole: 'Software Engineer',
        currentCompany: 'Tech Corp'
      }
    });
    test('Career Application API', 
         careerApp.status === 200,
         'Career application submission working');

    // Test 10: Investor Inquiry
    const investorInquiry = await makeRequest('/api/applications/investor', {
      method: 'POST',
      body: {
        fullName: 'Test Investor',
        email: 'investor@example.com',
        phoneNumber: '9999999999',
        company: 'Investment Firm',
        inquiryType: 'Funding',
        message: 'Interested in investment opportunities'
      }
    });
    test('Investor Inquiry API', 
         investorInquiry.status === 200,
         'Investor inquiry submission working');

    // === FEED SYSTEM TESTS ===
    console.log('\n📰 FEED SYSTEM TESTS\n');

    // Test 11: Feed Items
    const feedItems = await makeRequest('/api/feed?limit=5');
    test('Feed Items API', 
         feedItems.status === 200,
         `Feed endpoint responding with ${feedItems.data?.length || 0} items`);

    // === STAPUBUZZ INTEGRATION TESTS ===
    console.log('\n📺 STAPUBUZZ INTEGRATION TESTS\n');

    // Test 12: StapuBuzz News
    const stapubuzzNews = await makeRequest('/api/stapubuzz/news?sports=Cricket&limit=5');
    test('StapuBuzz News API', 
         stapubuzzNews.status === 200,
         `StapuBuzz integration working`);

    // === DATA INTEGRITY TESTS ===
    console.log('\n🔍 DATA INTEGRITY TESTS\n');

    // Test 13: User Data Completeness
    if (userSearch.data?.users?.length > 0) {
      const firstUser = userSearch.data.users[0];
      const hasRequiredFields = firstUser.id && firstUser.name && firstUser.phoneNumber && firstUser.userType;
      test('User Data Completeness', 
           hasRequiredFields,
           `User records contain all required fields`);
    }

    // Test 14: Activities Association
    if (userSearch.data?.users?.length > 0) {
      const usersWithActivities = userSearch.data.users.filter(u => u.activities && u.activities.length > 0);
      test('User-Activity Association', 
           usersWithActivities.length > 0,
           `${usersWithActivities.length} users have associated activities`);
    }

    // === MIGRATION VERIFICATION TESTS ===
    console.log('\n🔄 MIGRATION VERIFICATION TESTS\n');

    // Test 15: Expected User Count
    const allUsers = await makeRequest('/api/users/search?limit=50');
    test('Migration Data Completeness', 
         allUsers.data?.users?.length >= 5,
         `Found ${allUsers.data?.users?.length || 0} users (expected 5+ from migration)`);

    // Test 16: User Types Distribution
    if (allUsers.data?.users) {
      const players = allUsers.data.users.filter(u => u.userType === 'player').length;
      const coaches = allUsers.data.users.filter(u => u.userType === 'coach').length;
      test('User Types Present', 
           players > 0 && coaches > 0,
           `Players: ${players}, Coaches: ${coaches}`);
    }

    // === PERFORMANCE TESTS ===
    console.log('\n⚡ PERFORMANCE TESTS\n');

    // Test 17: Response Time
    const startTime = Date.now();
    await makeRequest('/api/users/search?limit=10');
    const responseTime = Date.now() - startTime;
    test('Response Time Performance', 
         responseTime < 5000,
         `User search completed in ${responseTime}ms`);

    // Test 18: Filter Options Cache
    const filterStartTime = Date.now();
    await makeRequest('/api/users/filter-options');
    const filterTime = Date.now() - filterStartTime;
    test('Filter Options Performance', 
         filterTime < 3000,
         `Filter options loaded in ${filterTime}ms`);

    // === FINAL RESULTS ===
    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUITE RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testCount}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${testCount - passedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / testCount) * 100)}%`);

    if (passedTests === testCount) {
      console.log('\n🎉 ALL TESTS PASSED! Application is ready for deployment.');
      console.log('\n✅ Deployment Readiness Checklist:');
      console.log('   ✓ MySQL database connectivity verified');
      console.log('   ✓ All API endpoints responding correctly');
      console.log('   ✓ Authentication system working');
      console.log('   ✓ User data migration completed successfully');
      console.log('   ✓ Performance within acceptable limits');
      console.log('   ✓ Data integrity maintained');
    } else {
      console.log('\n⚠️  Some tests failed. Please review before deployment.');
    }

    console.log('\n📋 Next Steps for Deployment:');
    console.log('1. Review any failed tests above');
    console.log('2. Ensure all environment variables are set');
    console.log('3. Click Deploy button in Replit');
    console.log('4. Verify production endpoints after deployment');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

runComprehensiveTests();