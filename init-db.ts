
import 'dotenv/config';
import { initTables } from './src/lib/db/migrations';

async function main() {
  console.log('Initializing database tables...');
  try {
    await initTables();
    console.log('Database tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();

