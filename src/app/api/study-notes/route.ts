import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllStudyNotes,
  getStudyNotesByNode,
  upsertStudyNote,
  deleteStudyNote,
  type StudyNoteRow,
} from '@/lib/db/neon-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('node_id');

    if (nodeId) {
      const notes = await getStudyNotesByNode(nodeId);
      return NextResponse.json({ notes });
    }

    const notes = await getAllStudyNotes();
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Failed to fetch study notes:', error);
    return NextResponse.json({ error: 'Failed to fetch study notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const note: StudyNoteRow = {
      id: body.id || uuidv4(),
      user_id: body.user_id || 'default_user',
      title: body.title || '',
      content: body.content || '',
      linked_node_id: body.linked_node_id || null,
      linked_node_name: body.linked_node_name || null,
      tags: body.tags || [],
      color_tag: body.color_tag || 'default',
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const saved = await upsertStudyNote(note);
    return NextResponse.json({ note: saved });
  } catch (error) {
    console.error('Failed to save study note:', error);
    return NextResponse.json({ error: 'Failed to save study note' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }
    await deleteStudyNote(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete study note:', error);
    return NextResponse.json({ error: 'Failed to delete study note' }, { status: 500 });
  }
}
