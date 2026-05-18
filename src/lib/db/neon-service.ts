import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

const CURRENT_USER = 'default_user';

export async function initTables(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_nodes (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL DEFAULT 'default_user',
      name VARCHAR(255) NOT NULL,
      parent_id VARCHAR(36),
      pos_x INTEGER DEFAULT 0,
      pos_y INTEGER DEFAULT 0,
      ps_score INTEGER DEFAULT 50 NOT NULL,
      last_practiced_at TIMESTAMPTZ,
      color_tag VARCHAR(50) DEFAULT 'default',
      node_type VARCHAR(20) NOT NULL,
      content TEXT,
      annotation TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS kn_user_id_idx ON knowledge_nodes(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS kn_parent_id_idx ON knowledge_nodes(parent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS kn_node_type_idx ON knowledge_nodes(node_type)`;
  await sql`CREATE INDEX IF NOT EXISTS kn_ps_score_idx ON knowledge_nodes(ps_score)`;

  await sql`
    CREATE TABLE IF NOT EXISTS practice_records (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL DEFAULT 'default_user',
      question_id VARCHAR(36) NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answer_time INTEGER DEFAULT 0,
      source_node_ids JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS pr_user_id_idx ON practice_records(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS pr_question_id_idx ON practice_records(question_id)`;
  await sql`CREATE INDEX IF NOT EXISTS pr_created_at_idx ON practice_records(created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ps_history (
      id VARCHAR(36) PRIMARY KEY,
      node_id VARCHAR(36) NOT NULL,
      ps_score INTEGER NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      user_id VARCHAR(36) NOT NULL DEFAULT 'default_user'
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS psh_node_id_idx ON ps_history(node_id)`;
  await sql`CREATE INDEX IF NOT EXISTS psh_user_id_idx ON ps_history(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS psh_recorded_at_idx ON ps_history(recorded_at)`;
}

export interface KnowledgeNodeRow {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  pos_x: number;
  pos_y: number;
  ps_score: number;
  last_practiced_at: string | null;
  color_tag: string;
  node_type: string;
  content: string | null;
  annotation: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeRecordRow {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  answer_time: number;
  source_node_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PSHistoryRow {
  id: string;
  node_id: string;
  ps_score: number;
  recorded_at: string;
  user_id: string;
}

// ==================== Knowledge Nodes ====================

export async function getAllNodes(): Promise<KnowledgeNodeRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM knowledge_nodes ORDER BY created_at ASC` as any;
  return rows.map(mapNodeRow);
}

export async function getNodesByUser(userId = CURRENT_USER): Promise<KnowledgeNodeRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM knowledge_nodes WHERE user_id = ${userId} ORDER BY created_at ASC` as any;
  return rows.map(mapNodeRow);
}

export async function getNodeById(id: string): Promise<KnowledgeNodeRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM knowledge_nodes WHERE id = ${id}` as any;
  return rows.length > 0 ? mapNodeRow(rows[0]) : null;
}

export async function getWeakNodes(threshold = 80, userId = CURRENT_USER): Promise<KnowledgeNodeRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM knowledge_nodes WHERE user_id = ${userId} AND ps_score < ${threshold} ORDER BY ps_score ASC` as any;
  return rows.map(mapNodeRow);
}

export async function upsertNode(node: KnowledgeNodeRow): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO knowledge_nodes (
      id, user_id, name, parent_id, pos_x, pos_y,
      ps_score, last_practiced_at, color_tag, node_type,
      content, annotation, updated_at
    ) VALUES (
      ${node.id}, ${node.user_id || CURRENT_USER}, ${node.name}, ${node.parent_id}, ${node.pos_x}, ${node.pos_y},
      ${node.ps_score}, ${node.last_practiced_at ? new Date(node.last_practiced_at).toISOString() : null}, ${node.color_tag}, ${node.node_type},
      ${node.content}, ${node.annotation}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      parent_id = EXCLUDED.parent_id,
      pos_x = EXCLUDED.pos_x,
      pos_y = EXCLUDED.pos_y,
      ps_score = EXCLUDED.ps_score,
      last_practiced_at = EXCLUDED.last_practiced_at,
      color_tag = EXCLUDED.color_tag,
      node_type = EXCLUDED.node_type,
      content = EXCLUDED.content,
      annotation = EXCLUDED.annotation,
      updated_at = NOW()
  `;
}

export async function updateNodePS(
  nodeId: string,
  psScore: number,
  userId = CURRENT_USER
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE knowledge_nodes
    SET ps_score = ${psScore}, last_practiced_at = NOW(), updated_at = NOW()
    WHERE id = ${nodeId} AND user_id = ${userId}
  `;
}

export async function updateNode(
  nodeId: string,
  updates: Partial<Pick<KnowledgeNodeRow, 'name' | 'parent_id' | 'pos_x' | 'pos_y' | 'ps_score' | 'color_tag' | 'node_type' | 'content' | 'annotation'>>
): Promise<void> {
  const sql = getSql();
  const setParts: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { setParts.push('name = $' + (values.length + 1)); values.push(updates.name); }
  if (updates.parent_id !== undefined) { setParts.push('parent_id = $' + (values.length + 1)); values.push(updates.parent_id); }
  if (updates.pos_x !== undefined) { setParts.push('pos_x = $' + (values.length + 1)); values.push(updates.pos_x); }
  if (updates.pos_y !== undefined) { setParts.push('pos_y = $' + (values.length + 1)); values.push(updates.pos_y); }
  if (updates.ps_score !== undefined) { setParts.push('ps_score = $' + (values.length + 1)); values.push(updates.ps_score); }
  if (updates.color_tag !== undefined) { setParts.push('color_tag = $' + (values.length + 1)); values.push(updates.color_tag); }
  if (updates.node_type !== undefined) { setParts.push('node_type = $' + (values.length + 1)); values.push(updates.node_type); }
  if (updates.content !== undefined) { setParts.push('content = $' + (values.length + 1)); values.push(updates.content); }
  if (updates.annotation !== undefined) { setParts.push('annotation = $' + (values.length + 1)); values.push(updates.annotation); }

  if (setParts.length === 0) return;

  values.push(nodeId);
  await sql.query(
    `UPDATE knowledge_nodes SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
    values
  );
}

export async function deleteNode(nodeId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM knowledge_nodes WHERE id = ${nodeId}`;
  await sql`DELETE FROM knowledge_nodes WHERE parent_id = ${nodeId}`;
}

export async function bulkUpsertNodes(nodes: KnowledgeNodeRow[]): Promise<void> {
  if (nodes.length === 0) return;
  const sql = getSql();
  for (const node of nodes) {
    await sql`
      INSERT INTO knowledge_nodes (
        id, user_id, name, parent_id, pos_x, pos_y,
        ps_score, last_practiced_at, color_tag, node_type,
        content, annotation, updated_at
      ) VALUES (
        ${node.id}, ${node.user_id || CURRENT_USER}, ${node.name}, ${node.parent_id}, ${node.pos_x}, ${node.pos_y},
        ${node.ps_score}, ${node.last_practiced_at ? new Date(node.last_practiced_at).toISOString() : null}, ${node.color_tag}, ${node.node_type},
        ${node.content}, ${node.annotation}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        parent_id = EXCLUDED.parent_id,
        pos_x = EXCLUDED.pos_x,
        pos_y = EXCLUDED.pos_y,
        ps_score = EXCLUDED.ps_score,
        last_practiced_at = EXCLUDED.last_practiced_at,
        color_tag = EXCLUDED.color_tag,
        node_type = EXCLUDED.node_type,
        content = EXCLUDED.content,
        annotation = EXCLUDED.annotation,
        updated_at = NOW()
    `;
  }
}

// ==================== Practice Records ====================

export async function getAllPracticeRecords(userId = CURRENT_USER): Promise<PracticeRecordRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM practice_records WHERE user_id = ${userId} ORDER BY created_at DESC` as any;
  return rows.map(mapPracticeRow);
}

export async function addPracticeRecord(record: Omit<PracticeRecordRow, 'created_at' | 'updated_at'>): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO practice_records (
      id, user_id, question_id, is_correct, answer_time, source_node_ids, created_at, updated_at
    ) VALUES (
      ${record.id}, ${record.user_id || CURRENT_USER}, ${record.question_id}, ${record.is_correct},
      ${record.answer_time}, ${JSON.stringify(record.source_node_ids)}, NOW(), NOW()
    )
  `;
}

// ==================== PS History ====================

export async function getPSHistoryByNode(nodeId: string, userId = CURRENT_USER): Promise<PSHistoryRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM ps_history WHERE node_id = ${nodeId} AND user_id = ${userId} ORDER BY recorded_at ASC` as any;
  return rows.map(mapPSHistoryRow);
}

export async function getPSHistoryByUser(userId = CURRENT_USER): Promise<PSHistoryRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM ps_history WHERE user_id = ${userId} ORDER BY recorded_at DESC` as any;
  return rows.map(mapPSHistoryRow);
}

export async function addPSHistory(record: Omit<PSHistoryRow, 'user_id'> & { user_id?: string }): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO ps_history (id, node_id, ps_score, recorded_at, user_id)
    VALUES (${record.id}, ${record.node_id}, ${record.ps_score}, ${new Date(record.recorded_at).toISOString()}, ${record.user_id || CURRENT_USER})
  `;
}

// ==================== Status ====================

export async function getDataStatus(): Promise<{ nodeCount: number; practiceCount: number; psHistoryCount: number; questionCount: number }> {
  const sql = getSql();
  const [nodeResult, practiceResult, psResult, qResult] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM knowledge_nodes` as any,
    sql`SELECT COUNT(*) as count FROM practice_records` as any,
    sql`SELECT COUNT(*) as count FROM ps_history` as any,
    sql`SELECT COUNT(*) as count FROM question_bank` as any,
  ]);
  return {
    nodeCount: parseInt(nodeResult[0]?.count || '0'),
    practiceCount: parseInt(practiceResult[0]?.count || '0'),
    psHistoryCount: parseInt(psResult[0]?.count || '0'),
    questionCount: parseInt(qResult[0]?.count || '0'),
  };
}

// ==================== Helpers ====================

function mapNodeRow(row: any): KnowledgeNodeRow {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    parent_id: row.parent_id,
    pos_x: row.pos_x ?? 0,
    pos_y: row.pos_y ?? 0,
    ps_score: row.ps_score ?? 50,
    last_practiced_at: row.last_practiced_at ? (row.last_practiced_at instanceof Date ? row.last_practiced_at.toISOString() : String(row.last_practiced_at)) : null,
    color_tag: row.color_tag || 'default',
    node_type: row.node_type,
    content: row.content,
    annotation: row.annotation,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapPracticeRow(row: any): PracticeRecordRow {
  let sourceNodeIds: string[] = [];
  try {
    sourceNodeIds = typeof row.source_node_ids === 'string' ? JSON.parse(row.source_node_ids) : (row.source_node_ids || []);
  } catch { sourceNodeIds = []; }
  return {
    id: row.id,
    user_id: row.user_id,
    question_id: row.question_id,
    is_correct: row.is_correct,
    answer_time: row.answer_time ?? 0,
    source_node_ids: sourceNodeIds,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapPSHistoryRow(row: any): PSHistoryRow {
  return {
    id: row.id,
    node_id: row.node_id,
    ps_score: row.ps_score,
    recorded_at: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : String(row.recorded_at),
    user_id: row.user_id,
  };
}
