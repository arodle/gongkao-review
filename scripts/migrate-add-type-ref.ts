import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'real'`;
  console.log('✅ type column ready');
  await sql`ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reference VARCHAR(500)`;
  console.log('✅ reference column ready');
}

main();
