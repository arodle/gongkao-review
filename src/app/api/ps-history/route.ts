import { NextResponse } from 'next/server';
import { getPSHistoryByUser, getPSHistoryByNode, addPSHistory } from '@/lib/db/neon-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('node_id');

    if (nodeId) {
      const history = await getPSHistoryByNode(nodeId);
      return NextResponse.json({ history });
    }

    const history = await getPSHistoryByUser();
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to fetch PS history:', error);
    return NextResponse.json({ error: 'Failed to fetch PS history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await addPSHistory(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add PS history:', error);
    return NextResponse.json({ error: 'Failed to add PS history' }, { status: 500 });
  }
}
