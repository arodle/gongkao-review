import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('🔍 检查 question_bank 表结构...');
    
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'question_bank'
    `;
    
    const columnNames = columns.map((c: any) => c.column_name);
    
    if (!columnNames.includes('reference')) {
      console.log('📦 添加 reference 列...');
      await sql`ALTER TABLE question_bank ADD COLUMN reference text`;
      console.log('✅ reference 列添加成功');
    } else {
      console.log('✅ reference 列已存在');
    }
    
    console.log('📋 当前表列:', columnNames.join(', '));
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrate();