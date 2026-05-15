import { db } from '@/lib/db/neon';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('测试 Neon 数据库连接...\n');
  
  try {
    // 测试查询
    const result = await sql`SELECT version()`;
    console.log('✅ 连接成功!');
    console.log('数据库版本:', result[0]?.version);
    
    // 测试表是否存在
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('\n已有表:', tables.length > 0 ? tables.map((t: any) => t.table_name).join(', ') : '无');
    
  } catch (error) {
    console.error('❌ 连接失败:', error);
    process.exit(1);
  }
}

testConnection();
