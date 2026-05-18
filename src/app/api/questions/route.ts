import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import type { QuestionBankItem, QuestionOption } from '@/types';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(process.env.DATABASE_URL);
}

function rowToQuestion(row: any): QuestionBankItem {
  return {
    id: row.id,
    content: row.question_text,
    options: [
      { label: 'A', text: row.option_a },
      { label: 'B', text: row.option_b } as QuestionOption,
      row.option_c ? ({ label: 'C', text: row.option_c } as QuestionOption) : null,
      row.option_d ? ({ label: 'D', text: row.option_d } as QuestionOption) : null,
    ].filter((o): o is QuestionOption => o !== null),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    linkedAngleId: row.linked_angle_id,
    linkedAngleName: '',
    knowledgePath: row.knowledge_path,
    source: row.source,
    type: row.type || 'real',
    reference: row.reference || '',
    createdAt: row.created_at,
    images: [],
  };
}

export async function GET() {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT * FROM question_bank
      ORDER BY created_at DESC
    `;
    const questions: QuestionBankItem[] = result.map(rowToQuestion);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSql();
    const question: Omit<QuestionBankItem, 'id' | 'createdAt'> = await request.json();
    const id = uuidv4();

    await sql`
      INSERT INTO question_bank (
        id, user_id, question_text, option_a, option_b, option_c, option_d,
        correct_answer, explanation, knowledge_path, linked_angle_id, source,
        type, reference, created_at
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
        ${(question as any).type || 'real'},
        ${(question as any).reference || ''},
        NOW()
      )
    `;

    const [row] = await sql`SELECT * FROM question_bank WHERE id = ${id}` as any;
    return NextResponse.json({ question: rowToQuestion(row) });
  } catch (error) {
    console.error('Failed to add question:', error);
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const sql = getSql();
    const question: QuestionBankItem = await request.json();

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
        source = ${question.source},
        type = ${(question as any).type || 'real'},
        reference = ${(question as any).reference || ''}
      WHERE id = ${question.id}
    `;

    const [row] = await sql`SELECT * FROM question_bank WHERE id = ${question.id}` as any;
    return NextResponse.json({ question: rowToQuestion(row) });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Question id is required' }, { status: 400 });
    }
    await sql`DELETE FROM question_bank WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
