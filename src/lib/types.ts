export type NodeType = 'subject' | 'knowledge' | 'subknowledge' | 'angle';

export interface KnowledgeNode {
  id: string;
  name: string;
  type: NodeType;
  children: KnowledgeNode[];
  questions: Question[];
  /** 知识点内容描述 */
  content?: string;
  /** 注释/备注 */
  annotation?: string;
  /** 图片URL列表 */
  images?: string[];
}

export interface Question {
  id: string;
  content: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface PracticeSet {
  id: string;
  name: string;
  questions: PracticeQuestion[];
  createdAt: string;
}

export interface PracticeQuestion {
  id: string;
  content: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  linkedAngleId: string;
  linkedAngleName: string;
}

export interface AnswerRecord {
  questionId: string;
  practiceSetId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface ExamResult {
  id: string;
  practiceSetId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  completedAt: string;
  wrongQuestionIds: string[];
}

export type AppTab = 'mindmap' | 'practice' | 'exam';
