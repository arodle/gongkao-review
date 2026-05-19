import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import type { QuestionBankItem, QuestionOption } from '@/types';

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

    const questions: QuestionBankItem[] = result.map((row: any) => {
      const options: QuestionOption[] = [
        { label: 'A', text: row.option_a },
        { label: 'B', text: row.option_b },
      ];
      
      if (row.option_c) {
        options.push({ label: 'C', text: row.option_c });
      }
      if (row.option_d) {
        options.push({ label: 'D', text: row.option_d });
      }

      return {
        id: row.id,
        content: row.question_text,
        options,
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
        linkedAngleId: row.linked_angle_id || '',
        linkedAngleName: '',
        knowledgePath: row.knowledge_path || '',
        source: row.source || 'manual',
        createdAt: row.created_at,
        images: [],
      };
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not configured' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();
    const { action, question } = body;

    if (action === 'update' || action === 'add') {
      if (action === 'update') {
        await sql`
          UPDATE question_bank SET
            question_text = ${question.content},
            option_a = ${question.options?.find((o: any) => o.label === 'A')?.text || null},
            option_b = ${question.options?.find((o: any) => o.label === 'B')?.text || null},
            option_c = ${question.options?.find((o: any) => o.label === 'C')?.text || null},
            option_d = ${question.options?.find((o: any) => o.label === 'D')?.text || null},
            correct_answer = ${question.correctAnswer},
            explanation = ${question.explanation || null},
            knowledge_path = ${question.knowledgePath || null},
            linked_angle_id = ${question.linkedAngleId || null},
            source = ${question.source || 'manual'}
          WHERE id = ${question.id}
        `;
        return NextResponse.json({ success: true, action: 'update', id: question.id });
      }

      if (action === 'add') {
        const newId = question.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await sql`
          INSERT INTO question_bank (
            id, user_id, question_text, option_a, option_b, option_c, option_d,
            correct_answer, explanation, knowledge_path, linked_angle_id, source,
            created_at
          ) VALUES (
            ${newId},
            'default_user',
            ${question.content},
            ${question.options?.find((o: any) => o.label === 'A')?.text || null},
            ${question.options?.find((o: any) => o.label === 'B')?.text || null},
            ${question.options?.find((o: any) => o.label === 'C')?.text || null},
            ${question.options?.find((o: any) => o.label === 'D')?.text || null},
            ${question.correctAnswer},
            ${question.explanation || null},
            ${question.knowledgePath || null},
            ${question.linkedAngleId || null},
            ${question.source || 'manual'},
            NOW()
          )
        `;
        return NextResponse.json({ success: true, action: 'add', id: newId });
      }
    }

    if (action === 'delete') {
      await sql`DELETE FROM question_bank WHERE id = ${question.id}`;
      return NextResponse.json({ success: true, action: 'delete', id: question.id });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to save question:', error);
    return NextResponse.json(
      { error: 'Failed to save question' },
      { status: 500 }
    );
  }
}
