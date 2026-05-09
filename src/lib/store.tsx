'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { KnowledgeNode, PracticeSet, AnswerRecord, ExamResult } from './types';
import { SAMPLE_MIND_MAP, SAMPLE_PRACTICE_SETS } from './sample-data';

interface AppState {
  mindMap: KnowledgeNode;
  practiceSets: PracticeSet[];
  answerRecords: AnswerRecord[];
  examResults: ExamResult[];
  nodeStats: Record<string, { correctCount: number; wrongCount: number }>;
}

type Action =
  | { type: 'SET_MIND_MAP'; payload: KnowledgeNode }
  | { type: 'ADD_PRACTICE_SET'; payload: PracticeSet }
  | { type: 'UPDATE_PRACTICE_SET'; payload: PracticeSet }
  | { type: 'DELETE_PRACTICE_SET'; payload: string }
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

  // Build a map from angleId to questionIds
  const angleQuestionMap: Record<string, string[]> = {};
  function mapQuestions(node: KnowledgeNode): void {
    for (const q of node.questions) {
      if (!angleQuestionMap[node.id]) angleQuestionMap[node.id] = [];
      angleQuestionMap[node.id].push(q.id);
    }
    for (const child of node.children) {
      mapQuestions(child);
    }
  }
  mapQuestions(mindMap);

  // Count correct/wrong per angle node based on answer records
  for (const record of answerRecords) {
    // Find which angle this question belongs to
    for (const [angleId, questionIds] of Object.entries(angleQuestionMap)) {
      if (questionIds.includes(record.questionId)) {
        if (stats[angleId]) {
          if (record.isCorrect) {
            stats[angleId].correctCount++;
          } else {
            stats[angleId].wrongCount++;
          }
        }
      }
    }
    // Also check practice set questions
    for (const [_angleId, questionIds] of Object.entries(angleQuestionMap)) {
      if (questionIds.includes(record.questionId)) {
        if (stats[_angleId]) {
          if (record.isCorrect) {
            stats[_angleId].correctCount++;
          } else {
            stats[_angleId].wrongCount++;
          }
        }
      }
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
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } else {
        // Initialize node stats for sample data
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
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}
