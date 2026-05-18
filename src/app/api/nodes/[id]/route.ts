import { NextResponse } from 'next/server';
import { updateNodePS, deleteNode } from '@/lib/db/neon-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.ps_score !== undefined) {
      await updateNodePS(id, body.ps_score);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update node:', error);
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteNode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }
}
