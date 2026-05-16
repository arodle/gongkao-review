import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkQuestions() {
  console.log('🔍 检查 Neon 数据库中的题目...\n');

  const result = await sql`SELECT id, question_text, created_at FROM question_bank ORDER BY created_at DESC`;
  
  console.log(`📊 数据库中总共有 ${result.length} 道题目\n`);

  if (result.length > 0) {
    console.log('📝 最新添加的题目：\n');
    result.slice(0, 10).forEach((q: any, i: number) => {
      console.log(`${i + 1}. ID: ${q.id}`);
      console.log(`   内容: ${q.question_text?.substring(0, 80)}...`);
      console.log(`   创建时间: ${q.created_at}`);
      console.log();
    });
  }

  if (result.length > 30) {
    console.log('✅ 确实超过30道题！');
  } else if (result.length === 30) {
    console.log('⚠️ 只有30道题，可能是新添加的题目还没同步进来');
  }
}

checkQuestions().catch(console.error);
