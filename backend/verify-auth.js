async function test() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const testUser = {
        name: 'Test Agent ' + Date.now(),
        email: 'agent_' + Date.now() + '@contextai.com',
        password: 'Password123!',
        role: 'agent'
    };

    try {
        console.log('Testing Signup...');
        const signupRes = await fetch(`${baseUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const signupData = await signupRes.json();
        if (signupRes.status !== 201) {
            throw new Error(`Signup failed (${signupRes.status}): ${JSON.stringify(signupData)}`);
        }
        console.log('✅ Signup Success:', signupData.message);

        console.log('Testing Login...');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        const loginData = await loginRes.json();
        if (loginRes.status !== 200) {
            throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginData)}`);
        }
        console.log('✅ Login Success: Received token');
        console.log('User Role:', loginData.user.role);

        if (loginData.user.role !== 'agent') {
            throw new Error(`Role mismatch: expected agent, got ${loginData.user.role}`);
        }

        console.log('ALL TESTS PASSED! 🎉');
        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

test();
