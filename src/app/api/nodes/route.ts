import { NextResponse } from 'next/server';
import {
  getNodesByUser,
  upsertNode,
  bulkUpsertNodes,
  getAllPracticeRecords,
  getPSHistoryByUser,
  getDataStatus,
} from '@/lib/db/neon-service';
import { initTables } from '@/lib/db/neon-service';

export async function GET() {
  try {
    const nodes = await getNodesByUser();
    const practiceRecords = await getAllPracticeRecords();
    const psHistory = await getPSHistoryByUser();
    const status = await getDataStatus();
    return NextResponse.json({ nodes, practiceRecords, psHistory, status });
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, node, nodes } = body;

    if (action === 'init') {
      await initTables();
      return NextResponse.json({ success: true, message: 'Tables initialized' });
    }

    if (action === 'seed' && nodes) {
      await bulkUpsertNodes(nodes);
      return NextResponse.json({ success: true, message: `Seeded ${nodes.length} nodes` });
    }

    if (node) {
      await upsertNode(node);
      return NextResponse.json({ success: true });
    }

    if (nodes && action === 'bulk') {
      await bulkUpsertNodes(nodes);
      return NextResponse.json({ success: true, count: nodes.length });
    }

    return NextResponse.json({ error: 'Invalid request. Provide node, nodes, or action.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process node request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
