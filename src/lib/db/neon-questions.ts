import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import type { QuestionBankItem } from '@/types';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

// 获取所有题目
export async function getAllQuestions(): Promise<QuestionBankItem[]> {
  const result = await sql`
    SELECT * FROM question_bank
    ORDER BY created_at DESC
  `;

  // 转换为应用需要的格式
  return result.map((row: any) => ({
    id: row.id,
    content: row.question_text,
    options: [
      { label: 'A', text: row.option_a },
      { label: 'B', text: row.option_b },
      row.option_c ? { label: 'C', text: row.option_c } : null,
      row.option_d ? { label: 'D', text: row.option_d } : null,
    ].filter(Boolean),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    linkedAngleId: row.linked_angle_id,
    linkedAngleName: '', // 这个需要从节点表获取
    knowledgePath: row.knowledge_path,
    source: row.source,
    createdAt: row.created_at,
    images: [], // 当前数据库没有这个字段
  }));
}

// 添加新题目
export async function addQuestion(question: Omit<QuestionBankItem, 'id' | 'createdAt'>): Promise<string> {
  const id = uuidv4();
  
  await sql`
    INSERT INTO question_bank (
      id, user_id, question_text, option_a, option_b, option_c, option_d,
      correct_answer, explanation, knowledge_path, linked_angle_id, source,
      created_at
    ) VALUES (
      ${id},
      'default_user',
      ${question.content},
      ${question.options.find(o => o.label === 'A')?.text},
      ${question.options.find(o => o.label === 'B')?.text},
      ${question.options.find(o => o.label === 'C')?.text},
      ${question.options.find(o => o.label === 'D')?.text},
      ${question.correctAnswer},
      ${question.explanation},
      ${question.knowledgePath},
      ${question.linkedAngleId},
      ${question.source || 'manual'},
      NOW()
    )
  `;

  return id;
}

// 更新题目
export async function updateQuestion(question: QuestionBankItem): Promise<void> {
  await sql`
    UPDATE question_bank SET
      question_text = ${question.content},
      option_a = ${question.options.find(o => o.label === 'A')?.text},
      option_b = ${question.options.find(o => o.label === 'B')?.text},
      option_c = ${question.options.find(o => o.label === 'C')?.text},
      option_d = ${question.options.find(o => o.label === 'D')?.text},
      correct_answer = ${question.correctAnswer},
      explanation = ${question.explanation},
      knowledge_path = ${question.knowledgePath},
      linked_angle_id = ${question.linkedAngleId},
      source = ${question.source}
    WHERE id = ${question.id}
  `;
}

// 删除题目
export async function deleteQuestion(questionId: string): Promise<void> {
  await sql`
    DELETE FROM question_bank WHERE id = ${questionId}
  `;
}
