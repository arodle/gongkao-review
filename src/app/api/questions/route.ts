import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import type { QuestionBankItem } from '@/types';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not configured' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT * FROM question_bank
      ORDER BY created_at DESC
    `;

    // 转换为应用需要的格式
    const questions: QuestionBankItem[] = result.map((row: any) => ({
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
      linkedAngleName: '',
      knowledgePath: row.knowledge_path,
      source: row.source,
      createdAt: row.created_at,
      images: [],
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
