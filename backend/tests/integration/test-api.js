/**
 * Q-Ease API Testing Script
 * Tests all major API endpoints to verify functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} ${name}`);
    if (message) {
        console.log(`  ${colors.yellow}${message}${colors.reset}`);
    }

    results.tests.push({ name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
}

// Test data
let authToken = null;
let adminToken = null;
let testUserId = null;
let testOrganisationId = null;
let testQueueId = null;
let testTokenId = null;

console.log(`\n${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.cyan}Q-Ease API Testing${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}\n`);

async function runTests() {
    // Test 1: Health Check
    console.log(`\n${colors.blue}--- Health Check ---${colors.reset}`);
    const health = await axios.get(`${BASE_URL}/health`).catch(e => null);
    logTest('Health endpoint', health?.status === 200, health?.data?.message);

    // Test 2: User Registration
    console.log(`\n${colors.blue}--- Authentication Tests ---${colors.reset}`);
    const registerData = {
        email: `testuser_${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890'
    };

    const registerResult = await apiRequest('POST', '/auth/register', registerData);
    logTest(
        'User registration',
        registerResult.success && registerResult.data.success,
        registerResult.success ? `User ID: ${registerResult.data.data?.user?.id}` : registerResult.error.message
    );

    if (registerResult.success) {
        testUserId = registerResult.data.data?.user?.id;
    }

    // Test 3: User Login
    const loginData = {
        email: 'patient1@gmail.com',
        password: 'Password123!'
    };

    const loginResult = await apiRequest('POST', '/auth/login', loginData);
    logTest(
        'User login',
        loginResult.success && loginResult.data.success,
        loginResult.success ? 'Token received' : loginResult.error.message
    );

    if (loginResult.success) {
        authToken = loginResult.data.data?.token;
    }

    // Test 4: Admin Login
    const adminLoginData = {
        email: 'admin@cityhospital.com',
        password: 'Password123!'
    };

    const adminLoginResult = await apiRequest('POST', '/auth/login', adminLoginData);
    logTest(
        'Admin login',
        adminLoginResult.success && adminLoginResult.data.success,
        adminLoginResult.success ? 'Admin token received' : adminLoginResult.error.message
    );

    if (adminLoginResult.success) {
        adminToken = adminLoginResult.data.data?.token;
    }

    // Test 5: Get All Organizations
    console.log(`\n${colors.blue}--- Organization Tests ---${colors.reset}`);
    const orgsResult = await apiRequest('GET', '/organisations');
    logTest(
        'Get all organizations',
        orgsResult.success && orgsResult.data.success,
        orgsResult.success ? `Found ${orgsResult.data.data?.organisations?.length} organizations` : orgsResult.error.message
    );

    if (orgsResult.success && orgsResult.data.data?.organisations?.length > 0) {
        testOrganisationId = orgsResult.data.data.organisations[0].id;
    }

    // Test 6: Get Organization by Code
    const orgByCodeResult = await apiRequest('GET', '/organisations/code/HOSP01');
    logTest(
        'Get organization by code',
        orgByCodeResult.success && orgByCodeResult.data.success,
        orgByCodeResult.success ? `Found: ${orgByCodeResult.data.data?.organisation?.name}` : orgByCodeResult.error.message
    );

    // Test 7: Search Organizations
    const searchResult = await apiRequest('GET', '/organisations/search?q=hospital');
    logTest(
        'Search organizations',
        searchResult.success && searchResult.data.success,
        searchResult.success ? `Found ${searchResult.data.data?.organisations?.length} results` : searchResult.error.message
    );

    // Test 8: Get All Queues
    console.log(`\n${colors.blue}--- Queue Tests ---${colors.reset}`);
    const queuesResult = await apiRequest('GET', '/queues');
    logTest(
        'Get all queues',
        queuesResult.success && queuesResult.data.success,
        queuesResult.success ? `Found ${queuesResult.data.data?.queues?.length} queues` : queuesResult.error.message
    );

    if (queuesResult.success && queuesResult.data.data?.queues?.length > 0) {
        testQueueId = queuesResult.data.data.queues[0].id;
    }

    // Test 9: Get Queue by ID
    if (testQueueId) {
        const queueByIdResult = await apiRequest('GET', `/queues/${testQueueId}`);
        logTest(
            'Get queue by ID',
            queueByIdResult.success && queueByIdResult.data.success,
            queueByIdResult.success ? `Queue: ${queueByIdResult.data.data?.queue?.name}` : queueByIdResult.error.message
        );
    }

    // Test 10: Create Token (Join Queue)
    console.log(`\n${colors.blue}--- Token Tests ---${colors.reset}`);
    if (authToken && testQueueId) {
        const tokenData = {
            queueId: testQueueId,
            priority: 'NORMAL'
        };

        const createTokenResult = await apiRequest('POST', '/tokens', tokenData, authToken);
        logTest(
            'Create token (join queue)',
            createTokenResult.success && createTokenResult.data.success,
            createTokenResult.success
                ? `Token: ${createTokenResult.data.data?.token?.tokenId}, Position: ${createTokenResult.data.data?.token?.position}`
                : createTokenResult.error.message
        );

        if (createTokenResult.success) {
            testTokenId = createTokenResult.data.data?.token?.id;
        }
    } else {
        logTest('Create token (join queue)', false, 'Missing auth token or queue ID');
    }

    // Test 11: Get My Tokens
    if (authToken) {
        const myTokensResult = await apiRequest('GET', '/tokens/my', null, authToken);
        logTest(
            'Get my tokens',
            myTokensResult.success && myTokensResult.data.success,
            myTokensResult.success ? `Found ${myTokensResult.data.data?.tokens?.length} tokens` : myTokensResult.error.message
        );
    }

    // Test 12: Get Token by ID
    if (authToken && testTokenId) {
        const tokenByIdResult = await apiRequest('GET', `/tokens/${testTokenId}`, null, authToken);
        logTest(
            'Get token by ID',
            tokenByIdResult.success && tokenByIdResult.data.success,
            tokenByIdResult.success ? `Token status: ${tokenByIdResult.data.data?.token?.status}` : tokenByIdResult.error.message
        );
    }

    // Test 13: Call Next Token (Staff)
    if (adminToken && testQueueId) {
        const callNextResult = await apiRequest('POST', `/tokens/queue/${testQueueId}/call-next`, null, adminToken);
        logTest(
            'Call next token (staff)',
            callNextResult.success && callNextResult.data.success,
            callNextResult.success ? `Called token: ${callNextResult.data.data?.token?.tokenId}` : callNextResult.error.message
        );
    }

    // Test 14: Unauthorized Access
    console.log(`\n${colors.blue}--- Security Tests ---${colors.reset}`);
    const unauthorizedResult = await apiRequest('GET', '/tokens/my');
    logTest(
        'Unauthorized access blocked',
        !unauthorizedResult.success && unauthorizedResult.status === 401,
        unauthorizedResult.status === 401 ? 'Correctly blocked' : 'Security issue!'
    );

    // Test 15: Invalid Token
    const invalidTokenResult = await apiRequest('GET', '/tokens/my', null, 'invalid-token-123');
    logTest(
        'Invalid token rejected',
        !invalidTokenResult.success && invalidTokenResult.status === 401,
        invalidTokenResult.status === 401 ? 'Correctly rejected' : 'Security issue!'
    );

    // Print Summary
    console.log(`\n${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}Test Summary${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Total: ${results.tests.length}`);
    console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);

    if (results.failed > 0) {
        console.log(`${colors.red}Failed Tests:${colors.reset}`);
        results.tests.filter(t => !t.passed).forEach(t => {
            console.log(`  - ${t.name}: ${t.message}`);
        });
        console.log();
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error(`${colors.red}Test execution failed:${colors.reset}`, error.message);
    process.exit(1);
});
