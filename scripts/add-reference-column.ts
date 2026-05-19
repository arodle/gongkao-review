import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function addReferenceColumn() {
  try {
    console.log('🔍 检查并添加 reference 列...');
    await sql`ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reference text`;
    console.log('✅ 成功添加 reference 列');
    
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'question_bank'
    `;
    console.log('📋 当前表列:', columns.map((c: any) => c.column_name).join(', '));
  } catch (error) {
    console.error('❌ 添加列失败:', error);
    process.exit(1);
  }
}

addReferenceColumn();