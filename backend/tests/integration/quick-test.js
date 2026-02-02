const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function quickTest() {
    console.log('Testing Q-Ease API...\n');

    try {
        // Test 1: Health check
        console.log('1. Health Check...');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✓ Health:', health.data);

        // Test 2: Get organizations
        console.log('\n2. Get Organizations...');
        const orgs = await axios.get(`${BASE_URL}/api/organisations`);
        console.log('✓ Organizations:', orgs.data.data.organisations.length, 'found');

        // Test 3: Login
        console.log('\n3. User Login...');
        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'patient1@gmail.com',
            password: 'Password123!'
        });
        console.log('✓ Login successful, token received');
        const token = login.data.data.token;

        // Test 4: Get queues
        console.log('\n4. Get Queues...');
        const queues = await axios.get(`${BASE_URL}/api/queues`);
        console.log('✓ Queues:', queues.data.data.queues.length, 'found');
        const queueId = queues.data.data.queues[0]?.id;

        // Test 5: Create token
        if (queueId) {
            console.log('\n5. Create Token (Join Queue)...');
            const tokenResult = await axios.post(
                `${BASE_URL}/api/tokens`,
                { queueId, priority: 'NORMAL' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✓ Token created:', tokenResult.data.data.token.tokenId);
            console.log('  Position:', tokenResult.data.data.token.position);
        }

        // Test 6: Get my tokens
        console.log('\n6. Get My Tokens...');
        const myTokens = await axios.get(`${BASE_URL}/api/tokens/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ My tokens:', myTokens.data.data.tokens.length, 'found');

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('Error:', error.response?.data);
    }
}

quickTest();
