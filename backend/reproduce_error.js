import * as customerRepository from './src/data/postgres/repositories/customerRepository.js';
import * as agentRepository from './src/data/postgres/repositories/agentRepository.js';
import * as sessionRepository from './src/data/postgres/repositories/sessionRepository.js';
import * as messageRepository from './src/data/postgres/repositories/messageRepository.js';

async function test() {
    const customerUuid = 'c0570b4c-1e24-4e31-9a7a-6f691680d2f1';
    const agentId = 'agent_001';
    const message = 'Test message';
    const sender = 'customer';

    try {
        console.log('1. Identify or creating customer...');
        const { customer } = await customerRepository.identifyOrCreate(customerUuid, {
            email: customerUuid,
            name: null
        });
        console.log('Customer ID:', customer.id);

        console.log('2. Getting or creating agent...');
        const { agent } = await agentRepository.getOrCreate(agentId, {
            name: `Agent ${agentId}`
        });
        console.log('Agent ID:', agent.id);

        console.log('3. Finding or creating session...');
        let session = await sessionRepository.findActiveByCustomer(customer.id);
        if (!session) {
            session = await sessionRepository.create(customer.id, agent.id, 'web');
        }
        console.log('Session ID:', session.id);

        console.log('4. Creating message...');
        const storedMessage = await messageRepository.create(
            session.id,
            sender,
            message
        );
        console.log('Message ID:', storedMessage.id);

        console.log('SUCCESS!');
    } catch (e) {
        console.error('FAILED at step:', e.message);
        console.log('ERROR_JSON_START');
        console.log(JSON.stringify(e, Object.getOwnPropertyNames(e)));
        console.log('ERROR_JSON_END');
    }
}

test();
