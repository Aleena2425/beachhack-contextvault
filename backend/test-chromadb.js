/**
 * Test ChromaDB Integration
 * Comprehensive test of all ChromaDB features
 */

import * as chromaClient from './src/data/vector/chromaClient.js';
import * as embeddings from './src/ai/embeddings.js';
import * as conversationVectorRepository from './src/data/vector/conversationVectorRepository.js';
import logger from './src/utils/logger.js';

async function testChromaDB() {
    console.log('=== ChromaDB Integration Test ===\n');

    try {
        // Test 1: Server Connection
        console.log('1. Testing ChromaDB server connection...');
        await chromaClient.testConnection();
        console.log('✅ ChromaDB server connected\n');

        // Test 2: Embedding Generation
        console.log('2. Testing embedding generation...');
        const testText = 'Hello, I need help with my order';
        const embedding = await embeddings.generateEmbedding(testText);
        console.log(`✅ Embedding generated: ${embedding.length} dimensions\n`);

        // Test 3: Initialize Collection
        console.log('3. Testing collection initialization...');
        await conversationVectorRepository.initializeCollection();
        console.log('✅ Collection initialized\n');

        // Test 4: Store Embedding
        console.log('4. Testing embedding storage...');
        const testMessage = {
            id: 'test-msg-' + Date.now(),
            content: testText,
            sentiment: 'neutral',
            intent: 'question',
            created_at: new Date()
        };
        const testCustomer = { id: 'test-customer-123' };
        const testSession = { id: 'test-session-456' };

        await conversationVectorRepository.storeMessageEmbedding(
            testMessage,
            testCustomer,
            testSession
        );
        console.log('✅ Embedding stored\n');

        // Test 5: Semantic Search
        console.log('5. Testing semantic search...');
        const searchResults = await conversationVectorRepository.searchSimilarMessages(
            'I have a problem with my purchase',
            3
        );
        console.log(`✅ Search completed: ${searchResults.length} results found\n`);

        if (searchResults.length > 0) {
            console.log('Top result:');
            console.log(`  Content: ${searchResults[0].content}`);
            console.log(`  Similarity: ${searchResults[0].similarity}`);
            console.log();
        }

        // Test 6: Collection Stats
        console.log('6. Testing collection statistics...');
        const stats = await conversationVectorRepository.getStats();
        console.log(`✅ Collection has ${stats.count} embeddings\n`);

        console.log('=== All Tests Passed ✅ ===');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testChromaDB();
