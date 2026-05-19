import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS study_notes (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(36) NOT NULL DEFAULT 'default_user',
      title VARCHAR(255) NOT NULL,
      content TEXT,
      linked_node_id VARCHAR(36),
      linked_node_name VARCHAR(255),
      tags JSONB DEFAULT '[]'::jsonb,
      color_tag VARCHAR(50) DEFAULT 'default',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ study_notes table created');

  await sql`CREATE INDEX IF NOT EXISTS sn_user_id_idx ON study_notes(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS sn_linked_node_idx ON study_notes(linked_node_id)`;
  await sql`CREATE INDEX IF NOT EXISTS sn_created_at_idx ON study_notes(created_at)`;
  console.log('✅ indexes created');
}

main();
