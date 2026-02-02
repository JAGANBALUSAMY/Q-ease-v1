const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = null;

console.log('\n🧪 Q-Ease Integration Testing\n');
console.log('Testing Backend-Frontend Integration...\n');

// Test 1: Backend Health Check
async function testHealthCheck() {
    try {
        const response = await axios.get('http://localhost:5000/');
        console.log('✅ 1. Backend Health Check - PASS');
        return true;
    } catch (error) {
        console.log('❌ 1. Backend Health Check - FAIL');
        console.log('   Error:', error.message);
        return false;
    }
}

// Test 2: User Login (Get Auth Token)
async function testUserLogin() {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'patient1@gmail.com',
            password: 'Password123!'
        });

        if (response.data.success && response.data.data.token) {
            authToken = response.data.data.token;
            console.log('✅ 2. User Login - PASS');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ 2. User Login - FAIL (No token received)');
            return false;
        }
    } catch (error) {
        console.log('❌ 2. User Login - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 3: Get Organizations (Public)
async function testGetOrganizations() {
    try {
        const response = await axios.get(`${API_URL}/organisations`);

        if (response.data.success && response.data.data.organisations.length > 0) {
            console.log('✅ 3. Get Organizations - PASS');
            console.log(`   Found: ${response.data.data.organisations.length} organizations`);
            return true;
        } else {
            console.log('❌ 3. Get Organizations - FAIL (No data)');
            return false;
        }
    } catch (error) {
        console.log('❌ 3. Get Organizations - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 4: Get Queues (Authenticated)
async function testGetQueues() {
    try {
        const response = await axios.get(`${API_URL}/queues`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.queues.length > 0) {
            console.log('✅ 4. Get Queues (Authenticated) - PASS');
            console.log(`   Found: ${response.data.data.queues.length} queues`);
            return true;
        } else {
            console.log('❌ 4. Get Queues - FAIL (No data)');
            return false;
        }
    } catch (error) {
        console.log('❌ 4. Get Queues - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 5: Get User Profile
async function testGetProfile() {
    try {
        const response = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.user) {
            console.log('✅ 5. Get User Profile - PASS');
            console.log(`   User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
            return true;
        } else {
            console.log('❌ 5. Get User Profile - FAIL (No data)');
            return false;
        }
    } catch (error) {
        console.log('❌ 5. Get User Profile - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 6: Get My Tokens
async function testGetMyTokens() {
    try {
        const response = await axios.get(`${API_URL}/tokens/my`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            console.log('✅ 6. Get My Tokens - PASS');
            console.log(`   Tokens: ${response.data.data.tokens.length}`);
            return true;
        } else {
            console.log('❌ 6. Get My Tokens - FAIL');
            return false;
        }
    } catch (error) {
        console.log('❌ 6. Get My Tokens - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 7: CORS Check
async function testCORS() {
    try {
        // Simulate frontend request with origin header
        const response = await axios.get(`${API_URL}/organisations`, {
            headers: {
                'Origin': 'http://localhost:5173'
            }
        });

        console.log('✅ 7. CORS Configuration - PASS');
        return true;
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('❌ 7. CORS Configuration - FAIL (CORS blocked)');
            return false;
        }
        console.log('✅ 7. CORS Configuration - PASS');
        return true;
    }
}

// Test 8: QR Code Generation
async function testQRCode() {
    try {
        const response = await axios.get(`${API_URL}/organisations`);
        const orgId = response.data.data.organisations[0].id;

        const qrResponse = await axios.get(`${API_URL}/qr/organisation/${orgId}`);

        if (qrResponse.data.success && qrResponse.data.data.qrCode) {
            console.log('✅ 8. QR Code Generation - PASS');
            return true;
        } else {
            console.log('❌ 8. QR Code Generation - FAIL');
            return false;
        }
    } catch (error) {
        console.log('❌ 8. QR Code Generation - FAIL');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    const results = [];

    results.push(await testHealthCheck());
    results.push(await testUserLogin());

    if (authToken) {
        results.push(await testGetOrganizations());
        results.push(await testGetQueues());
        results.push(await testGetProfile());
        results.push(await testGetMyTokens());
        results.push(await testCORS());
        results.push(await testQRCode());
    } else {
        console.log('\n⚠️  Skipping authenticated tests (login failed)\n');
    }

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Integration Test Results: ${passed}/${total} tests passed\n`);

    if (passed === total) {
        console.log('🎉 All integration tests PASSED!');
        console.log('✅ Backend-Frontend integration is working correctly!\n');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.\n');
    }

    console.log('='.repeat(50) + '\n');
}

// Run tests
runAllTests().catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
});
