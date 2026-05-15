import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import { SAMPLE_QUESTION_BANK, SAMPLE_MIND_MAP } from '../src/lib/sample-data';

const sql = neon(process.env.DATABASE_URL!);

async function importData() {
  console.log('开始导入数据...');

  // 1. 先清空现有数据（可选，方便重新导入）
  console.log('清空现有数据...');
  await sql`DELETE FROM answer_records`;
  await sql`DELETE FROM question_bank`;
  await sql`DELETE FROM mind_maps`;
  await sql`DELETE FROM practice_sets`;

  // 2. 导入知识节点（从 SAMPLE_MIND_MAP 提取）
  console.log('导入知识节点...');
  const nodesToInsert: any[] = [];
  const nodeIdMapping: Record<string, string> = {}; // 旧ID -> 新UUID

  function traverseNode(node: any, parentId: string | null = null) {
    const newId = uuidv4();
    nodeIdMapping[node.id] = newId;

    nodesToInsert.push({
      id: newId,
      user_id: 'default_user',
      name: node.name,
      // 把树形结构扁平化，只保存基本信息
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (node.children) {
      for (const child of node.children) {
        traverseNode(child, newId);
      }
    }
  }
  traverseNode(SAMPLE_MIND_MAP);

  // 由于我们的数据库表结构简化了，先只插入一些示例思维导图
  console.log('插入思维导图...');
  await sql`
    INSERT INTO mind_maps (id, user_id, name, data, created_at, updated_at)
    VALUES (
      ${uuidv4()}, 
      'default_user', 
      '行测知识体系', 
      ${JSON.stringify(SAMPLE_MIND_MAP)}::jsonb, 
      NOW(), 
      NOW()
    )
  `;

  // 3. 导入题库
  console.log('导入题库...');
  const insertedQuestionIds: string[] = [];

  for (const question of SAMPLE_QUESTION_BANK) {
    const newId = uuidv4();
    insertedQuestionIds.push(newId);
    
    // 处理 linkedAngleId 映射
    const mappedLinkedAngleId = nodeIdMapping[question.linkedAngleId] || question.linkedAngleId;

    await sql`
      INSERT INTO question_bank (
        id, user_id, question_text, option_a, option_b, option_c, option_d,
        correct_answer, explanation, knowledge_path, linked_angle_id, source,
        created_at
      ) VALUES (
        ${newId},
        'default_user',
        ${question.content},
        ${question.options[0]?.text || null},
        ${question.options[1]?.text || null},
        ${question.options[2]?.text || null},
        ${question.options[3]?.text || null},
        ${question.correctAnswer},
        ${question.explanation || null},
        ${question.knowledgePath || null},
        ${mappedLinkedAngleId || null},
        ${question.source || 'manual'},
        NOW()
      )
    `;
  }

  // 4. 导入练习套题
  console.log('导入练习套题...');
  for (const set of (await import('../src/lib/sample-data')).SAMPLE_PRACTICE_SETS) {
    const newSetId = uuidv4();

    // 把套题中的题目映射到已插入的题目ID
    const questionIdsInSet: string[] = [];
    for (let i = 0; i < Math.min(set.questions.length, insertedQuestionIds.length); i++) {
      questionIdsInSet.push(insertedQuestionIds[i]);
    }

    await sql`
      INSERT INTO practice_sets (
        id, user_id, name, question_ids, mode, time_limit, created_at
      ) VALUES (
        ${newSetId},
        'default_user',
        ${set.name},
        ${JSON.stringify(questionIdsInSet)}::jsonb,
        'exam',
        null,
        NOW()
      )
    `;
  }

  console.log(`✅ 数据导入完成！`);
  console.log(`- 题库题目: ${insertedQuestionIds.length} 条`);
  console.log(`- 练习套题: ${(await import('../src/lib/sample-data')).SAMPLE_PRACTICE_SETS.length} 套`);
}

importData().catch(err => {
  console.error('❌ 导入失败:', err);
  process.exit(1);
});
