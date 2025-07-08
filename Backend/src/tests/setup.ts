import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for testing
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Global test setup
beforeAll(async () => {
  // Any global setup before all tests
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Any global cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Increase timeout for database operations
jest.setTimeout(10000); 