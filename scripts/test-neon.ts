import { db } from '@/lib/db/neon';
import { questionBank, answerRecords, mindMaps } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

async function testNeonOperations() {
  console.log('🔄 测试 Neon 数据库操作...\n');

  try {
    // 1. 测试插入题库
    console.log('1. 测试插入题库...');
    const [newQuestion] = await db.insert(questionBank).values({
      question_text: '测试题目：1+1=?',
      option_a: '1',
      option_b: '2',
      option_c: '3',
      option_d: '4',
      correct_answer: 'B',
      explanation: '1+1=2，这是基础数学知识',
      knowledge_path: '数学/基础运算',
      source: 'test',
    }).returning();
    console.log('✅ 插入成功:', newQuestion?.id);

    // 2. 测试查询
    console.log('\n2. 测试查询题库...');
    const questions = await db.select().from(questionBank).limit(5);
    console.log('✅ 查询成功，共', questions.length, '条记录');

    // 3. 测试插入答题记录
    console.log('\n3. 测试插入答题记录...');
    const [newRecord] = await db.insert(answerRecords).values({
      question_id: newQuestion?.id,
      selected_answer: 'B',
      is_correct: true,
      practice_mode: 'single',
    }).returning();
    console.log('✅ 答题记录插入成功:', newRecord?.id);

    // 4. 测试关联查询
    console.log('\n4. 测试关联查询...');
    const recordsWithQuestions = await db.select({
      record: answerRecords,
      question: questionBank,
    })
    .from(answerRecords)
    .leftJoin(questionBank, eq(answerRecords.question_id, questionBank.id))
    .limit(5);
    console.log('✅ 关联查询成功，共', recordsWithQuestions.length, '条记录');

    // 5. 清理测试数据
    console.log('\n5. 清理测试数据...');
    if (newRecord?.id) {
      await db.delete(answerRecords).where(eq(answerRecords.id, newRecord.id));
      console.log('✅ 答题记录已删除');
    }
    if (newQuestion?.id) {
      await db.delete(questionBank).where(eq(questionBank.id, newQuestion.id));
      console.log('✅ 题目已删除');
    }

    console.log('\n🎉 所有测试通过！ Neon 数据库集成成功！');

  } catch (error) {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  }
}

testNeonOperations();
