'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { KnowledgeNode, QuestionBankItem } from '@/lib/types';
import { useAppState, getAllAngles, findNodeById } from '@/lib/store';
import { createId } from '@/lib/sample-data';
import { getWrongColor } from '@/lib/color-utils';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  ArrowLeft,
  Play,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Knowledge Tree Selector (cascading selection) ---
function KnowledgeSelector({
  mindMap,
  selectedPath,
  onPathChange,
  questionBank,
}: {
  mindMap: KnowledgeNode;
  selectedPath: string[];
  onPathChange: (path: string[]) => void;
  questionBank: QuestionBankItem[];
}) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand first level
    const s = new Set<string>();
    s.add(mindMap.id);
    return s;
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Count questions under each node
  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function countForNode(node: KnowledgeNode): number {
      let total = questionBank.filter((q) => q.linkedAngleId === node.id).length;
      for (const child of node.children) {
        total += countForNode(child);
      }
      counts[node.id] = total;
      return total;
    }
    countForNode(mindMap);
    return counts;
  }, [mindMap, questionBank]);

  function renderNode(node: KnowledgeNode, depth: number) {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedPath[depth] === node.id;
    const count = questionCounts[node.id] || 0;

    const typeIcons: Record<string, React.ElementType> = {
      subject: BookOpen,
      knowledge: Brain,
      subknowledge: Target,
      angle: Lightbulb,
    };
    const Icon = typeIcons[node.type] || BookOpen;

    return (
      <div key={node.id}>
        <button
          type="button"
          className={cn(
            'w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors',
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            // Select this node and trim deeper selections
            onPathChange([...selectedPath.slice(0, depth), node.id]);
            if (node.children.length > 0) toggleExpand(node.id);
          }}
        >
          {node.children.length > 0 ? (
            <span className="text-gray-400 text-xs w-4 shrink-0">
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate flex-1">{node.name}</span>
          {count > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
              {count}题
            </Badge>
          )}
        </button>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="py-1">
        {renderNode(mindMap, 0)}
      </div>
    </ScrollArea>
  );
}

// --- Mini Mind Map for result display ---
function ResultMindMap({
  node,
  depth,
  wrongAngleIds,
  litUpIds,
}: {
  node: KnowledgeNode;
  depth: number;
  wrongAngleIds: Set<string>;
  litUpIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState(true);
  const isWrong = wrongAngleIds.has(node.id);
  const isLitUp = litUpIds.has(node.id);
  const hasRelevantChild = node.children.some((c) =>
    wrongAngleIds.has(c.id) || litUpIds.has(c.id) || hasRelevantDescendant(c, wrongAngleIds, litUpIds),
  );

  // Only render nodes that are relevant or ancestors of relevant nodes
  if (depth > 0 && !isWrong && !isLitUp && !hasRelevantChild) return null;

  const typeIcons: Record<string, React.ElementType> = {
    subject: BookOpen,
    knowledge: Brain,
    subknowledge: Target,
    angle: Lightbulb,
  };
  const Icon = typeIcons[node.type] || BookOpen;

  const wrongColor = isWrong && node.type === 'angle' ? getWrongColor(
    // Estimate wrong count from wrongAngleIds presence
    wrongAngleIds.has(node.id) ? 1 : 0,
  ) : null;

  return (
    <div style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors w-full text-left',
          isLitUp && !isWrong && 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-300',
          isWrong && node.type === 'angle',
        )}
        style={wrongColor ? { backgroundColor: wrongColor } : undefined}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children.length > 0 && (
          <span className="text-[10px] text-gray-400">{expanded ? '▼' : '▶'}</span>
        )}
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate font-medium">{node.name}</span>
        {isWrong && node.type === 'angle' && (
          <Badge className="ml-auto text-[9px] h-4 px-1 bg-red-500 text-white">错</Badge>
        )}
        {isLitUp && !isWrong && (
          <Badge className="ml-auto text-[9px] h-4 px-1 bg-yellow-500 text-white">对</Badge>
        )}
      </button>
      {expanded && node.children.length > 0 && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <ResultMindMap
              key={child.id}
              node={child}
              depth={depth + 1}
              wrongAngleIds={wrongAngleIds}
              litUpIds={litUpIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasRelevantDescendant(
  node: KnowledgeNode,
  wrongAngleIds: Set<string>,
  litUpIds: Set<string>,
): boolean {
  if (wrongAngleIds.has(node.id) || litUpIds.has(node.id)) return true;
  return node.children.some((c) => hasRelevantDescendant(c, wrongAngleIds, litUpIds));
}

// --- Question Card for Practice ---
function PracticeQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  mindMap,
}: {
  question: QuestionBankItem;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  mindMap: KnowledgeNode;
}) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    function expandPath(node: KnowledgeNode): boolean {
      if (node.id === question.linkedAngleId) {
        expanded.add(node.id);
        return true;
      }
      for (const child of node.children) {
        if (expandPath(child)) {
          expanded.add(node.id);
          return true;
        }
      }
      return false;
    }
    expandPath(mindMap);
    return expanded;
  });

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isCorrect = selectedAnswer === question.correctAnswer;

  // Build knowledge path display
  const pathParts = question.knowledgePath.split(' / ');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            第 {questionNumber} / {totalQuestions} 题
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {question.linkedAngleName}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev}>
            上一题
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext}>
            下一题
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Knowledge path breadcrumb */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
            <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1">知识点路径</p>
            <div className="flex items-center flex-wrap gap-1">
              {pathParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />}
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      i === pathParts.length - 1
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Question content */}
          <Card className="p-4">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
              {question.content}
            </p>
          </Card>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label;
              const isCorrectOption = opt.label === question.correctAnswer;

              let optionStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300';
              if (showResult) {
                if (isCorrectOption) {
                  optionStyle = 'bg-green-50 dark:bg-green-900/30 border-green-400';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-red-50 dark:bg-red-900/30 border-red-400';
                }
              } else if (isSelected) {
                optionStyle = 'bg-blue-50 dark:bg-blue-900/30 border-blue-400';
              }

              return (
                <button
                  key={opt.label}
                  type="button"
                  className={cn(
                    'w-full text-left p-3 rounded-lg border-2 transition-all duration-200',
                    optionStyle,
                    showResult && 'cursor-default',
                  )}
                  onClick={() => !showResult && onSelectAnswer(opt.label)}
                  disabled={showResult}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                        isSelected
                          ? showResult
                            ? isCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-red-500 bg-red-500 text-white'
                            : 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 dark:border-gray-600',
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">{opt.text}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500 ml-auto shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {showResult && (
            <div
              className={cn(
                'rounded-lg p-4',
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200',
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isCorrect ? 'text-green-700' : 'text-red-700',
                  )}
                >
                  {isCorrect ? '回答正确！' : '回答错误'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Question navigation dots */}
      <div className="border-t bg-white dark:bg-gray-900 p-3 shrink-0">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {Array.from({ length: totalQuestions }, (_, i) => i).map((i) => (
            <button
              key={i}
              type="button"
              className={cn(
                'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                i === questionNumber - 1 && 'ring-2 ring-blue-500',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Practice View ---
type PracticePhase = 'select' | 'quiz' | 'result';

export default function PracticeView() {
  const { state, addAnswerRecord, dispatch } = useAppState();
  const bank = state.questionBank ?? [];
  const [phase, setPhase] = useState<PracticePhase>('select');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [practiceQuestions, setPracticeQuestions] = useState<QuestionBankItem[]>([]);

  // Get questions for selected knowledge path
  const availableQuestions = useMemo(() => {
    if (selectedPath.length === 0) return [];

    const selectedNodeId = selectedPath[selectedPath.length - 1];
    const angles = getAllAngles(state.mindMap);
    const selectedNode = findNodeById(state.mindMap, selectedNodeId);

    if (!selectedNode) return [];

    // If the selected node is an angle, get questions for that angle
    if (selectedNode.type === 'angle') {
      return bank.filter((q: QuestionBankItem) => q.linkedAngleId === selectedNodeId);
    }

    // Otherwise get all questions under descendant angles
    const descendantAngleIds = new Set<string>();
    function collectAngles(node: KnowledgeNode): void {
      if (node.type === 'angle') descendantAngleIds.add(node.id);
      node.children.forEach(collectAngles);
    }
    collectAngles(selectedNode);

    return bank.filter((q: QuestionBankItem) => descendantAngleIds.has(q.linkedAngleId));
  }, [selectedPath, state.mindMap, bank]);

  const selectedPathNames = useMemo(() => {
    const names: string[] = [];
    function findPath(node: KnowledgeNode, depth: number): boolean {
      if (selectedPath[depth] === node.id) {
        names.push(node.name);
        if (depth + 1 < selectedPath.length) {
          for (const child of node.children) {
            if (findPath(child, depth + 1)) return true;
          }
        }
        return true;
      }
      return false;
    }
    if (selectedPath.length > 0) findPath(state.mindMap, 0);
    return names;
  }, [selectedPath, state.mindMap]);

  const handleStartPractice = useCallback(() => {
    // Shuffle and pick questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    setPracticeQuestions(picked);
    setCurrentQIndex(0);
    setAnswers({});
    setShowResults({});
    setPhase('quiz');
  }, [availableQuestions, questionCount]);

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      const q = practiceQuestions[currentQIndex];
      if (!q) return;

      setAnswers((prev) => ({ ...prev, [q.id]: answer }));
      const isCorrect = answer === q.correctAnswer;
      addAnswerRecord({
        questionId: q.id,
        practiceSetId: 'practice-knowledge',
        selectedAnswer: answer,
        isCorrect,
        timestamp: Date.now(),
      });
      setShowResults((prev) => ({ ...prev, [q.id]: true }));
    },
    [practiceQuestions, currentQIndex, addAnswerRecord],
  );

  // Result computation
  const resultData = useMemo(() => {
    if (practiceQuestions.length === 0) return null;
    const wrongAngleIds = new Set<string>();
    const litUpIds = new Set<string>();

    for (const q of practiceQuestions) {
      const userAnswer = answers[q.id];
      if (userAnswer === q.correctAnswer) {
        // Light up the path
        litUpIds.add(q.linkedAngleId);
      } else if (userAnswer !== undefined) {
        wrongAngleIds.add(q.linkedAngleId);
      }
    }

    // Propagate lit-up status up the tree
    function propagateLitUp(node: KnowledgeNode): boolean {
      let hasLit = litUpIds.has(node.id);
      for (const child of node.children) {
        if (propagateLitUp(child)) {
          hasLit = true;
        }
      }
      if (hasLit) litUpIds.add(node.id);
      return hasLit;
    }
    propagateLitUp(state.mindMap);

    // Propagate wrong status up the tree for display
    function propagateWrong(node: KnowledgeNode): boolean {
      let hasWrong = wrongAngleIds.has(node.id);
      for (const child of node.children) {
        if (propagateWrong(child)) hasWrong = true;
      }
      if (hasWrong) wrongAngleIds.add(node.id);
      return hasWrong;
    }
    propagateWrong(state.mindMap);

    const totalAnswered = Object.keys(answers).length;
    const correctCount = practiceQuestions.filter(
      (q) => answers[q.id] === q.correctAnswer,
    ).length;

    return { wrongAngleIds, litUpIds, totalAnswered, correctCount };
  }, [practiceQuestions, answers, state.mindMap]);

  // --- Select Phase ---
  if (phase === 'select') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">真题练习</h2>
          <Badge variant="outline">{bank.length} 题库</Badge>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          从知识点树中选择要练习的考点，系统会从题库中抽取对应题目。支持按科目、知识点、子知识点、出题角度逐级选择。
        </p>

        {/* Knowledge selector */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">选择知识点</h3>
          <KnowledgeSelector
            mindMap={state.mindMap}
            selectedPath={selectedPath}
            onPathChange={setSelectedPath}
            questionBank={bank}
          />
        </Card>

        {/* Selected path display */}
        {selectedPathNames.length > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">已选择路径</p>
            <div className="flex items-center flex-wrap gap-1">
              {selectedPathNames.map((name, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3 text-blue-400" />}
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium">
                    {name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              可用题目：{availableQuestions.length} 道
            </p>
          </Card>
        )}

        {/* Question count selector */}
        {availableQuestions.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">选择题目数量</h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={Math.min(availableQuestions.length, 20)}
                value={Math.min(questionCount, availableQuestions.length)}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 w-12 text-center">
                {Math.min(questionCount, availableQuestions.length)} 题
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              最多可选 {availableQuestions.length} 道（题库中该路径下的题目总数）
            </p>
          </Card>
        )}

        {/* Start button */}
        <Button
          className="w-full"
          size="lg"
          disabled={availableQuestions.length === 0}
          onClick={handleStartPractice}
        >
          <Play className="h-4 w-4 mr-2" />
          开始练习 ({Math.min(questionCount, availableQuestions.length)} 题)
        </Button>
      </div>
    );
  }

  // --- Quiz Phase ---
  if (phase === 'quiz' && practiceQuestions.length > 0) {
    const currentQ = practiceQuestions[currentQIndex];
    const allAnswered = practiceQuestions.every((q) => answers[q.id] !== undefined);

    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setPhase('select')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回选题
          </Button>
          <span className="text-sm font-medium text-gray-600">
            {selectedPathNames.join(' / ')}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {Object.keys(answers).length}/{practiceQuestions.length} 已答
            </Badge>
            {allAnswered && (
              <Button
                size="sm"
                onClick={() => setPhase('result')}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                查看结果
              </Button>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-hidden">
          <PracticeQuestionCard
            question={currentQ}
            questionNumber={currentQIndex + 1}
            totalQuestions={practiceQuestions.length}
            selectedAnswer={answers[currentQ.id] || null}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResults[currentQ.id] || false}
            onPrev={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
            onNext={() =>
              setCurrentQIndex((i) => Math.min(practiceQuestions.length - 1, i + 1))
            }
            hasPrev={currentQIndex > 0}
            hasNext={currentQIndex < practiceQuestions.length - 1}
            mindMap={state.mindMap}
          />
        </div>

        {/* Question navigation */}
        <div className="border-t bg-white dark:bg-gray-900 p-3 shrink-0">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {practiceQuestions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = i === currentQIndex;
              const isCorrect = showResults[q.id] && answers[q.id] === q.correctAnswer;
              const isWrong = showResults[q.id] && answers[q.id] !== q.correctAnswer;

              return (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                    isCurrent && 'ring-2 ring-blue-500',
                    isCorrect && 'bg-green-100 text-green-700',
                    isWrong && 'bg-red-100 text-red-700',
                    isAnswered && !isCorrect && !isWrong && 'bg-blue-100 text-blue-700',
                    !isAnswered && !isCurrent && 'bg-gray-100 text-gray-500',
                  )}
                  onClick={() => setCurrentQIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Result Phase ---
  if (phase === 'result' && resultData) {
    const { wrongAngleIds, litUpIds, correctCount } = resultData;
    const totalQuestions = practiceQuestions.length;
    const wrongCount = totalQuestions - correctCount;

    return (
      <div className="flex flex-col h-full">
        {/* Result Header */}
        <div className="p-6 text-center bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">练习完成</h2>
          <p className="text-sm text-gray-500 mt-1">{selectedPathNames.join(' / ')}</p>
          <div className="mt-3 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-gray-500">正确</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{wrongCount}</p>
              <p className="text-xs text-gray-500">错误</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">{totalQuestions}</p>
              <p className="text-xs text-gray-500">总题数</p>
            </div>
          </div>
        </div>

        {/* Mind Map with color changes */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                知识点变色图
                <Badge variant="secondary" className="text-[10px]">黄色=做对 · 红/黑渐变=做错</Badge>
              </h3>
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                <ResultMindMap
                  node={state.mindMap}
                  depth={0}
                  wrongAngleIds={wrongAngleIds}
                  litUpIds={litUpIds}
                />
              </div>
            </Card>

            {/* Wrong questions detail */}
            {wrongCount > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4" />
                  错题详解
                </h3>
                <div className="space-y-3">
                  {practiceQuestions
                    .filter((q) => answers[q.id] !== q.correctAnswer)
                    .map((q) => (
                      <div key={q.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 space-y-2">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{q.content}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {q.options.map((opt) => (
                            <div
                              key={opt.label}
                              className={cn(
                                'text-xs px-2 py-1.5 rounded',
                                opt.label === q.correctAnswer
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 font-medium'
                                  : opt.label === answers[q.id]
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 line-through'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500',
                              )}
                            >
                              {opt.label}. {opt.text}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          你的答案：<span className="text-red-500 font-medium">{answers[q.id]}</span>
                          {' | '}正确答案：<span className="text-green-500 font-medium">{q.correctAnswer}</span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-2">
                          {q.explanation}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t bg-white dark:bg-gray-900 p-4 flex justify-center gap-3 shrink-0">
          <Button variant="outline" onClick={() => setPhase('select')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            重新选题
          </Button>
          <Button onClick={handleStartPractice}>
            再练一组
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
