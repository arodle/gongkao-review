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
    const body = await request.json();
    const id = body.id || uuidv4();

    await sql`
      INSERT INTO question_bank (
        id, user_id, question_text, option_a, option_b, option_c, option_d,
        correct_answer, explanation, knowledge_path, linked_angle_id, source,
        type, reference, created_at
      ) VALUES (
        ${id},
        'default_user',
        ${body.content},
        ${body.options?.find((o: any) => o.label === 'A')?.text},
        ${body.options?.find((o: any) => o.label === 'B')?.text},
        ${body.options?.find((o: any) => o.label === 'C')?.text},
        ${body.options?.find((o: any) => o.label === 'D')?.text},
        ${body.correctAnswer},
        ${body.explanation},
        ${body.knowledgePath},
        ${body.linkedAngleId},
        ${body.source || 'manual'},
        ${body.type || 'real'},
        ${body.reference || ''},
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
    const body = await request.json();

    await sql`
      UPDATE question_bank SET
        question_text = ${body.content},
        option_a = ${body.options?.find((o: any) => o.label === 'A')?.text},
        option_b = ${body.options?.find((o: any) => o.label === 'B')?.text},
        option_c = ${body.options?.find((o: any) => o.label === 'C')?.text},
        option_d = ${body.options?.find((o: any) => o.label === 'D')?.text},
        correct_answer = ${body.correctAnswer},
        explanation = ${body.explanation},
        knowledge_path = ${body.knowledgePath},
        linked_angle_id = ${body.linkedAngleId},
        source = ${body.source},
        type = ${body.type || 'real'},
        reference = ${body.reference || ''}
      WHERE id = ${body.id}
    `;

    const [row] = await sql`SELECT * FROM question_bank WHERE id = ${body.id}` as any;
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
