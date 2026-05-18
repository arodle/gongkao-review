import { create } from 'zustand';
import type {
  KnowledgeNodeRecord,
  PracticeRecord,
  PSHistoryRecord,
  QuestionBankItem,
  AnswerRecord,
  ExamResult,
  ExamPaper,
} from '@/types';
import { calculatePS, SCENARIO_COEFFICIENTS } from '@/lib/services/psCalculator';
import { v4 as uuidv4 } from 'uuid';

export const CURRENT_USER_ID = 'default_user';

async function fetchFromAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`API failed: ${response.status}`);
  return response.json();
}

async function getAllQuestionsFromAPI(): Promise<QuestionBankItem[]> {
  try {
    const data = await fetchFromAPI<{ questions: QuestionBankItem[] }>('/api/questions');
    return data.questions || [];
  } catch (error) {
    console.warn('API fetch failed:', error);
    throw error;
  }
}

async function fetchAllFromNeon(): Promise<{
  nodes: KnowledgeNodeRecord[];
  practiceRecords: PracticeRecord[];
  psHistory: PSHistoryRecord[];
}> {
  try {
    const data = await fetchFromAPI<{
      nodes: KnowledgeNodeRecord[];
      practiceRecords: PracticeRecord[];
      psHistory: PSHistoryRecord[];
    }>('/api/nodes');
    return {
      nodes: data.nodes || [],
      practiceRecords: data.practiceRecords || [],
      psHistory: data.psHistory || [],
    };
  } catch {
    return { nodes: [], practiceRecords: [], psHistory: [] };
  }
}

async function seedNodesAPI(nodes: KnowledgeNodeRecord[]): Promise<void> {
  await fetchFromAPI('/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'seed', nodes }),
  });
}

async function initTablesAPI(): Promise<void> {
  await fetchFromAPI('/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'init' }),
  });
}

async function upsertNodeAPI(node: KnowledgeNodeRecord): Promise<void> {
  await fetchFromAPI('/api/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node }),
  });
}

async function updateNodePSAPI(nodeId: string, psScore: number): Promise<void> {
  await fetchFromAPI(`/api/nodes/${nodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ps_score: psScore }),
  });
}

async function deleteNodeAPI(nodeId: string): Promise<void> {
  await fetchFromAPI(`/api/nodes/${nodeId}`, { method: 'DELETE' });
}

async function addPracticeRecordAPI(record: PracticeRecord): Promise<void> {
  await fetchFromAPI('/api/practice-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

async function addPSHistoryAPI(record: PSHistoryRecord): Promise<void> {
  await fetchFromAPI('/api/ps-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

async function addQuestionAPI(question: Omit<QuestionBankItem, 'id' | 'createdAt'>): Promise<QuestionBankItem | null> {
  try {
    const data = await fetchFromAPI<{ question: QuestionBankItem }>('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return data.question;
  } catch { return null; }
}

async function updateQuestionAPI(question: QuestionBankItem): Promise<void> {
  await fetchFromAPI('/api/questions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  }).catch(console.error);
}

async function deleteQuestionAPI(questionId: string): Promise<void> {
  await fetchFromAPI(`/api/questions?id=${questionId}`, { method: 'DELETE' }).catch(console.error);
}

interface AppState {
  nodes: KnowledgeNodeRecord[];
  practiceRecords: PracticeRecord[];
  psHistory: PSHistoryRecord[];
  questionBank: QuestionBankItem[];
  answerRecords: AnswerRecord[];
  examResults: ExamResult[];
  examPapers: ExamPaper[];
  isInitialized: boolean;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';

  initialize: () => Promise<void>;
  updateNodePSScore: (nodeId: string, isCorrect: boolean, scenario?: number) => Promise<void>;
  addAnswer: (record: AnswerRecord) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  createSafetySnapshot: (reason: string) => Promise<string>;
  getNodeById: (nodeId: string) => KnowledgeNodeRecord | undefined;
  getWeakNodes: (threshold?: number) => KnowledgeNodeRecord[];
  getNodePSHistory: (nodeId: string) => Promise<PSHistoryRecord[]>;
  getQuestionByAngleId: (angleId: string) => QuestionBankItem[];
  getNodeStats: (nodeId: string) => { correct: number; wrong: number };
  getWrongAnswersByNodeId: (nodeId: string) => PracticeRecord[];
  getCorrectQuestionIds: () => Set<string>;
  getWrongQuestionIds: () => Set<string>;
  addQuestion: (question: QuestionBankItem) => void;
  updateQuestion: (question: QuestionBankItem) => void;
  deleteQuestion: (questionId: string) => void;
  addExamPaper: (paper: ExamPaper) => void;
  deleteExamPaper: (paperId: string) => void;
  updateNode: (node: Partial<KnowledgeNodeRecord> & { id: string }) => void;
  addNode: (node: Omit<KnowledgeNodeRecord, 'user_id' | 'updated_at' | 'ps_score' | 'last_practiced_at' | 'color_tag'>) => void;
  deleteNode: (nodeId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  nodes: [],
  practiceRecords: [],
  psHistory: [],
  questionBank: [],
  answerRecords: [],
  examResults: [],
  examPapers: [],
  isInitialized: false,
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  syncStatus: 'idle',

  initialize: async () => {
    try {
      await initTablesAPI();

      const { nodes: remoteNodes, practiceRecords: remoteRecords, psHistory: remoteHistory } = await fetchAllFromNeon();

      if (remoteNodes.length === 0) {
        const result = await seedInitialData();
        const { nodes: newNodes } = await fetchAllFromNeon();
        set({ 
          nodes: newNodes,
          practiceRecords: [],
          psHistory: [],
          questionBank: result.questionBank,
          isInitialized: true,
        });
        return;
      }

      try {
        const apiQuestions = await getAllQuestionsFromAPI();
        set({ questionBank: apiQuestions });
      } catch (apiError) {
        console.warn('Failed to read from API, falling back to sample data:', apiError);
        const { SAMPLE_QUESTION_BANK } = await import('@/lib/sample-data');
        const questionBankWithImages = SAMPLE_QUESTION_BANK.map(q => ({
          ...q,
          images: q.images || []
        }));
        set({ questionBank: questionBankWithImages });
      }

      set({
        nodes: remoteNodes,
        practiceRecords: remoteRecords,
        psHistory: remoteHistory,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize app state:', error);
      set({ isInitialized: true });
    }
  },

  updateNodePSScore: async (nodeId: string, isCorrect: boolean, scenario = SCENARIO_COEFFICIENTS.PRACTICE) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const lastPracticed = node.last_practiced_at ? new Date(node.last_practiced_at) : null;
    const newPS = calculatePS({
      currentPS: node.ps_score,
      isCorrect,
      scenarioCoefficient: scenario,
      lastPracticedAt: lastPracticed,
    });

    await updateNodePSAPI(nodeId, newPS).catch(console.error);

    const historyRecord: PSHistoryRecord = {
      id: uuidv4(),
      node_id: nodeId,
      ps_score: newPS,
      recorded_at: new Date().toISOString(),
      user_id: CURRENT_USER_ID,
    };
    await addPSHistoryAPI(historyRecord).catch(console.error);

    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === nodeId
          ? { ...n, ps_score: newPS, last_practiced_at: new Date().toISOString() }
          : n
      ),
      psHistory: [...state.psHistory, historyRecord],
    }));
  },

  addAnswer: (record: AnswerRecord) => {
    const dbRecord: PracticeRecord = {
      id: uuidv4(),
      user_id: CURRENT_USER_ID,
      question_id: record.questionId,
      is_correct: record.isCorrect,
      answer_time: Date.now() - record.timestamp,
      source_node_ids: record.linkedAngleId ? [record.linkedAngleId] : [],
      updated_at: new Date().toISOString(),
    };

    addPracticeRecordAPI(dbRecord).catch(console.error);

    set(state => ({
      answerRecords: [...state.answerRecords, record],
      practiceRecords: [...state.practiceRecords, dbRecord],
    }));
  },

  setOnlineStatus: (isOnline: boolean) => set({ isOnline }),

  setSyncStatus: (syncStatus: 'idle' | 'syncing' | 'success' | 'error') => set({ syncStatus }),

  createSafetySnapshot: async (reason: string) => {
    console.log('Snapshot created:', reason);
    const state = get();
    const existingNodeIds = new Set(state.nodes.map(n => n.id));
    const existingNodeRecords = state.nodes.map(n => ({
      id: n.id,
      user_id: CURRENT_USER_ID,
      name: n.name,
      parent_id: n.parent_id,
      pos_x: n.pos_x,
      pos_y: n.pos_y,
      ps_score: n.ps_score,
      last_practiced_at: n.last_practiced_at,
      color_tag: n.color_tag,
      node_type: n.node_type,
      content: n.content,
      annotation: n.annotation,
      updated_at: n.updated_at,
    }));
    upsertNodeAPI(existingNodeRecords[0]); // dummy to keep API available
    return `snapshot_${Date.now()}`;
  },

  getNodeById: (nodeId: string) => {
    return get().nodes.find(n => n.id === nodeId);
  },

  getWeakNodes: (threshold = 80) => {
    return get().nodes.filter(n => n.ps_score < threshold);
  },

  getNodePSHistory: async (nodeId: string) => {
    try {
      const data = await fetchFromAPI<{ history: PSHistoryRecord[] }>(
        `/api/ps-history?node_id=${nodeId}`
      );
      return data.history || [];
    } catch {
      return get().psHistory.filter(h => h.node_id === nodeId);
    }
  },

  getQuestionByAngleId: (angleId: string) => {
    return get().questionBank.filter(q => q.linkedAngleId === angleId);
  },

  getNodeStats: (nodeId: string) => {
    const records = get().practiceRecords.filter(r =>
      r.source_node_ids.includes(nodeId)
    );
    return {
      correct: records.filter(r => r.is_correct).length,
      wrong: records.filter(r => !r.is_correct).length,
    };
  },

  getWrongAnswersByNodeId: (nodeId: string) => {
    return get().practiceRecords.filter(r =>
      r.source_node_ids.includes(nodeId) && !r.is_correct
    );
  },

  getCorrectQuestionIds: () => {
    return new Set(
      get().practiceRecords
        .filter(r => r.is_correct)
        .map(r => r.question_id)
    );
  },

  getWrongQuestionIds: () => {
    return new Set(
      get().practiceRecords
        .filter(r => !r.is_correct)
        .map(r => r.question_id)
    );
  },

  addQuestion: (question: QuestionBankItem) => {
    addQuestionAPI(question).catch(console.error);
    set(state => ({
      questionBank: [...state.questionBank, question],
    }));
  },

  updateQuestion: (question: QuestionBankItem) => {
    updateQuestionAPI(question);
    set(state => ({
      questionBank: state.questionBank.map(q =>
        q.id === question.id ? question : q
      ),
    }));
  },

  deleteQuestion: (questionId: string) => {
    deleteQuestionAPI(questionId);
    set(state => ({
      questionBank: state.questionBank.filter(q => q.id !== questionId),
    }));
  },

  addExamPaper: (paper: ExamPaper) => {
    set(state => ({
      examPapers: [...state.examPapers, paper],
    }));
  },

  deleteExamPaper: (paperId: string) => {
    set(state => ({
      examPapers: state.examPapers.filter(p => p.id !== paperId),
    }));
  },

  updateNode: (node) => {
    const state = get();
    const existing = state.nodes.find(n => n.id === node.id);
    if (existing) {
      const updated: KnowledgeNodeRecord = { ...existing, ...node };
      upsertNodeAPI(updated).catch(console.error);
    }
    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === node.id ? { ...n, ...node } : n
      ),
    }));
  },

  addNode: (node) => {
    const newNode: KnowledgeNodeRecord = {
      ...node,
      user_id: CURRENT_USER_ID,
      ps_score: 50,
      last_practiced_at: null,
      color_tag: 'default',
      updated_at: new Date().toISOString(),
    };
    upsertNodeAPI(newNode).catch(console.error);
    set(state => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  deleteNode: (nodeId: string) => {
    deleteNodeAPI(nodeId).catch(console.error);
    set(state => {
      const childIds = new Set<string>();
      
      const collectChildren = (id: string) => {
        state.nodes.forEach(n => {
          if (n.parent_id === id) {
            childIds.add(n.id);
            collectChildren(n.id);
          }
        });
      };
      collectChildren(nodeId);
      
      const keepIds = new Set(state.nodes.map(n => n.id));
      keepIds.delete(nodeId);
      childIds.forEach(id => keepIds.delete(id));
      
      return {
        nodes: state.nodes.filter(n => keepIds.has(n.id)),
      };
    });
  },
}));

async function seedInitialData() {
  const { SAMPLE_MIND_MAP } = await import('@/lib/sample-data');
  const { SAMPLE_QUESTION_BANK } = await import('@/lib/sample-data');

  const nodesToAdd: KnowledgeNodeRecord[] = [];

  function traverseTree(node: any, parentId: string | null = null, depth = 0) {
    const x = depth * 200;
    const y = 0;

    nodesToAdd.push({
      id: node.id,
      user_id: CURRENT_USER_ID,
      name: node.name,
      parent_id: parentId,
      pos_x: x,
      pos_y: y,
      ps_score: 50,
      last_practiced_at: null,
      color_tag: 'default',
      node_type: node.type,
      content: node.content,
      annotation: node.annotation,
      updated_at: new Date().toISOString(),
    });

    if (node.children) {
      let childIndex = 0;
      node.children.forEach((child: any) => {
        traverseTree(child, node.id, depth + 1);
        childIndex++;
      });
    }
  }

  traverseTree(SAMPLE_MIND_MAP);

  await seedNodesAPI(nodesToAdd).catch(err => {
    console.error('Failed to seed nodes via Neon API:', err);
  });

  const bankItems: QuestionBankItem[] = SAMPLE_QUESTION_BANK.map(item => ({
    ...item,
    images: item.images || [],
    createdAt: item.createdAt,
  }));

  return { questionBank: bankItems };
}
