import { NextResponse } from 'next/server';
import { getAllPracticeRecords, addPracticeRecord } from '@/lib/db/neon-service';

export async function GET() {
  try {
    const records = await getAllPracticeRecords();
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Failed to fetch practice records:', error);
    return NextResponse.json({ error: 'Failed to fetch practice records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await addPracticeRecord(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add practice record:', error);
    return NextResponse.json({ error: 'Failed to add practice record' }, { status: 500 });
  }
}
