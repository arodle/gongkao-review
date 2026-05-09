'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { KnowledgeNode, PracticeSet, AnswerRecord, ExamResult, QuestionBankItem } from './types';
import { SAMPLE_MIND_MAP, SAMPLE_PRACTICE_SETS, SAMPLE_QUESTION_BANK } from './sample-data';

interface AppState {
  mindMap: KnowledgeNode;
  practiceSets: PracticeSet[];
  questionBank: QuestionBankItem[];
  answerRecords: AnswerRecord[];
  examResults: ExamResult[];
  nodeStats: Record<string, { correctCount: number; wrongCount: number }>;
}

type Action =
  | { type: 'SET_MIND_MAP'; payload: KnowledgeNode }
  | { type: 'ADD_PRACTICE_SET'; payload: PracticeSet }
  | { type: 'UPDATE_PRACTICE_SET'; payload: PracticeSet }
  | { type: 'DELETE_PRACTICE_SET'; payload: string }
  | { type: 'ADD_QUESTION_BANK_ITEMS'; payload: QuestionBankItem[] }
  | { type: 'REMOVE_QUESTION_BANK_ITEM'; payload: string }
  | { type: 'ADD_ANSWER_RECORD'; payload: AnswerRecord }
  | { type: 'ADD_EXAM_RESULT'; payload: ExamResult }
  | { type: 'UPDATE_NODE_STATS'; payload: Record<string, { correctCount: number; wrongCount: number }> }
  | { type: 'LOAD_STATE'; payload: AppState };

const STORAGE_KEY = 'civil-exam-app-state';

function buildNodeStats(
  mindMap: KnowledgeNode,
  answerRecords: AnswerRecord[],
): Record<string, { correctCount: number; wrongCount: number }> {
  const stats: Record<string, { correctCount: number; wrongCount: number }> = {};

  function traverse(node: KnowledgeNode): void {
    stats[node.id] = { correctCount: 0, wrongCount: 0 };
    for (const child of node.children) {
      traverse(child);
    }
  }
  traverse(mindMap);

  // Build a map from angleId to questionIds (from mind map)
  const angleQuestionMap: Record<string, Set<string>> = {};
  function mapQuestions(node: KnowledgeNode): void {
    if (!angleQuestionMap[node.id]) angleQuestionMap[node.id] = new Set();
    for (const q of node.questions) {
      angleQuestionMap[node.id].add(q.id);
    }
    for (const child of node.children) {
      mapQuestions(child);
    }
  }
  mapQuestions(mindMap);

  // Count correct/wrong per angle node based on answer records
  for (const record of answerRecords) {
    for (const [angleId, questionIds] of Object.entries(angleQuestionMap)) {
      if (questionIds.has(record.questionId) && stats[angleId]) {
        if (record.isCorrect) {
          stats[angleId].correctCount++;
        } else {
          stats[angleId].wrongCount++;
        }
      }
    }
    // Also track by linkedAngleId for practice set questions
    // Find the linked angle from practice sets
    if (record.practiceSetId !== 'mindmap-inline') {
      // The answer record questionId may match a practice question with linkedAngleId
      // We'll handle this through the practiceSet questions lookup
    }
  }

  return stats;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MIND_MAP': {
      const nodeStats = buildNodeStats(action.payload, state.answerRecords);
      return { ...state, mindMap: action.payload, nodeStats };
    }
    case 'ADD_PRACTICE_SET':
      return { ...state, practiceSets: [...state.practiceSets, action.payload] };
    case 'UPDATE_PRACTICE_SET':
      return {
        ...state,
        practiceSets: state.practiceSets.map((ps) =>
          ps.id === action.payload.id ? action.payload : ps,
        ),
      };
    case 'DELETE_PRACTICE_SET':
      return {
        ...state,
        practiceSets: state.practiceSets.filter((ps) => ps.id !== action.payload),
      };
    case 'ADD_QUESTION_BANK_ITEMS':
      return { ...state, questionBank: [...state.questionBank, ...action.payload] };
    case 'REMOVE_QUESTION_BANK_ITEM':
      return {
        ...state,
        questionBank: state.questionBank.filter((q) => q.id !== action.payload),
      };
    case 'ADD_ANSWER_RECORD': {
      const newRecords = [...state.answerRecords, action.payload];
      const nodeStats = buildNodeStats(state.mindMap, newRecords);
      return { ...state, answerRecords: newRecords, nodeStats };
    }
    case 'ADD_EXAM_RESULT':
      return { ...state, examResults: [...state.examResults, action.payload] };
    case 'UPDATE_NODE_STATS':
      return { ...state, nodeStats: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

const initialState: AppState = {
  mindMap: SAMPLE_MIND_MAP,
  practiceSets: SAMPLE_PRACTICE_SETS,
  questionBank: SAMPLE_QUESTION_BANK,
  answerRecords: [],
  examResults: [],
  nodeStats: {},
};

function checkPathLitUp(
  node: KnowledgeNode,
  nodeStats: Record<string, { correctCount: number; wrongCount: number }>,
): boolean {
  const stats = nodeStats[node.id];
  if (stats && stats.correctCount > 0) return true;
  return node.children.some((child) => checkPathLitUp(child, nodeStats));
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getNodeStats: (nodeId: string) => { correctCount: number; wrongCount: number };
  isPathLitUp: (node: KnowledgeNode) => boolean;
  addAnswerRecord: (record: AnswerRecord) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // Ensure questionBank exists for backwards compat
        if (!parsed.questionBank) parsed.questionBank = SAMPLE_QUESTION_BANK;
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } else {
        const nodeStats = buildNodeStats(SAMPLE_MIND_MAP, []);
        dispatch({ type: 'UPDATE_NODE_STATS', payload: nodeStats });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const getNodeStats = useCallback(
    (nodeId: string) => {
      return state.nodeStats[nodeId] || { correctCount: 0, wrongCount: 0 };
    },
    [state.nodeStats],
  );

  const isPathLitUp = useCallback(
    (node: KnowledgeNode): boolean => checkPathLitUp(node, state.nodeStats),
    [state.nodeStats],
  );

  const addAnswerRecord = useCallback(
    (record: AnswerRecord) => {
      dispatch({ type: 'ADD_ANSWER_RECORD', payload: record });
    },
    [],
  );

  return (
    <AppContext.Provider value={{ state, dispatch, getNodeStats, isPathLitUp, addAnswerRecord }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

/** Get all angle nodes from a knowledge tree with their path */
export function getAllAngles(mindMap: KnowledgeNode): Array<{ id: string; name: string; path: string }> {
  const result: Array<{ id: string; name: string; path: string }> = [];
  function traverse(node: KnowledgeNode, pathParts: string[]): void {
    const currentPath = [...pathParts, node.name];
    if (node.type === 'angle') {
      result.push({ id: node.id, name: node.name, path: currentPath.join(' / ') });
    }
    for (const child of node.children) {
      traverse(child, currentPath);
    }
  }
  traverse(mindMap, []);
  return result;
}

/** Get all nodes at a specific depth level for selection */
export function getNodesByLevel(mindMap: KnowledgeNode, level: number): Array<{ id: string; name: string; parentPath: string }> {
  const result: Array<{ id: string; name: string; parentPath: string }> = [];
  function traverse(node: KnowledgeNode, depth: number, pathParts: string[]): void {
    if (depth === level) {
      result.push({ id: node.id, name: node.name, parentPath: pathParts.join(' / ') });
      return;
    }
    for (const child of node.children) {
      traverse(child, depth + 1, [...pathParts, node.name]);
    }
  }
  traverse(mindMap, 0, []);
  return result;
}

/** Get all descendant angles of a node */
export function getDescendantAngles(node: KnowledgeNode): Array<{ id: string; name: string; path: string }> {
  const result: Array<{ id: string; name: string; path: string }> = [];
  function traverse(n: KnowledgeNode, pathParts: string[]): void {
    const currentPath = [...pathParts, n.name];
    if (n.type === 'angle') {
      result.push({ id: n.id, name: n.name, path: currentPath.join(' / ') });
    }
    for (const child of n.children) {
      traverse(child, currentPath);
    }
  }
  traverse(node, []);
  return result;
}

/** Find a node by ID */
export function findNodeById(root: KnowledgeNode, id: string): KnowledgeNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
