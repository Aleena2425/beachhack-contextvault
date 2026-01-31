/**
 * Test Different Gemini Embedding Models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const testText = 'Hello world, this is a test';

async function testModel(modelName) {
    try {
        console.log(`\nTesting model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.embedContent(testText);

        console.log(`✅ SUCCESS with ${modelName}`);
        console.log(`   Dimensions: ${result.embedding.values.length}`);
        console.log(`   First 3 values: ${result.embedding.values.slice(0, 3)}`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED with ${modelName}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testAllModels() {
    console.log('=== Testing Gemini Embedding Models ===');
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING'}\n`);

    const models = [
        'embedding-001',
        'models/embedding-001',
        'text-embedding-004',
        'models/text-embedding-004',
        'embedding-gecko-001',
        'models/embedding-gecko-001'
    ];

    for (const modelName of models) {
        const success = await testModel(modelName);
        if (success) {
            console.log(`\n🎯 WORKING MODEL FOUND: ${modelName}`);
            process.exit(0);
        }
    }

    console.log('\n❌ No working model found');
    process.exit(1);
}

testAllModels();
