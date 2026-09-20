import pool from './src/config/db.js';
import { seedDatabase } from './src/seed/seedData.js';
import { seedEnhancements } from './src/seed/seedEnhancements.js';

async function forceSeed() {
  await pool.query('TRUNCATE users CASCADE');
  await pool.query('TRUNCATE courses CASCADE');
  console.log("Database truncated");
  
  await seedDatabase();
  await seedEnhancements();
  console.log("Database seeded successfully with C Programming content!");
  process.exit(0);
}

forceSeed();
