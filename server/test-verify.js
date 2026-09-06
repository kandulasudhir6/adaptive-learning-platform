import http from 'node:http';
import { seedDatabase } from './src/seed/seedData.js';

async function runTests() {
  console.log('Testing Server Seed & Verification...');
  await seedDatabase();
  console.log('Seed verification passed!');
}

runTests().catch(console.error);
