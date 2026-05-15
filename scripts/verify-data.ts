import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function verifyData() {
  console.log('验证数据...\n');

  // 查询题库数量
  const questionCount = await sql`SELECT COUNT(*) as count FROM question_bank`;
  console.log(`题库题目数: ${(questionCount as any)[0].count}`);

  // 查询前5题
  const questions = await sql`SELECT id, question_text, correct_answer FROM question_bank LIMIT 5`;
  console.log('\n前5题:');
  for (const q of questions as any[]) {
    console.log(`  - ${q.question_text.substring(0, 50)}... (${q.correct_answer})`);
  }

  // 查询思维导图数量
  const mapCount = await sql`SELECT COUNT(*) as count FROM mind_maps`;
  console.log(`\n思维导图数: ${(mapCount as any)[0].count}`);

  // 查询练习套题数量
  const setCount = await sql`SELECT COUNT(*) as count FROM practice_sets`;
  console.log(`练习套题数: ${(setCount as any)[0].count}`);

  const sets = await sql`SELECT * FROM practice_sets`;
  console.log('\n套题详情:');
  for (const s of sets as any[]) {
    console.log(`  - ${s.name}: ${s.question_ids?.length || 0} 题`);
  }

  console.log('\n✅ 数据验证完成！');
}

verifyData().catch(err => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
