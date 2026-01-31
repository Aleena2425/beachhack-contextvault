/**
 * Simple Embedding Test
 * Test Gemini embedding generation directly
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testEmbedding() {
    console.log('=== Testing Gemini Embedding API ===\n');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', apiKey ? 'YES' : 'NO');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log();

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'embedding-001' });

        console.log('Generating embedding for: "Hello world"');
        const result = await model.embedContent('Hello world');

        console.log('✅ Success!');
        console.log('Embedding dimensions:', result.embedding.values.length);
        console.log('First 5 values:', result.embedding.values.slice(0, 5));

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed!');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testEmbedding();
