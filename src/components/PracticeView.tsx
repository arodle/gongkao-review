'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { KnowledgeNode, PracticeQuestion } from '@/lib/types';
import { useAppState } from '@/lib/store';
import { getWrongColor } from '@/lib/color-utils';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Knowledge Path Display ---
function KnowledgePathDisplay({
  mindMap,
  angleId,
  expandedNodes,
  onToggleExpand,
}: {
  mindMap: KnowledgeNode;
  angleId: string;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  // Find the path from root to the angle
  const path = useMemo(() => {
    const result: KnowledgeNode[] = [];
    function findPath(node: KnowledgeNode): boolean {
      if (node.id === angleId) {
        result.push(node);
        return true;
      }
      for (const child of node.children) {
        if (findPath(child)) {
          result.push(node);
          return true;
        }
      }
      return false;
    }
    findPath(mindMap);
    return result.reverse();
  }, [mindMap, angleId]);

  if (path.length === 0) return null;

  const typeIcons: Record<string, React.ElementType> = {
    subject: BookOpen,
    knowledge: Brain,
    subknowledge: Target,
    angle: Lightbulb,
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-1">
      <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1">知识点链路</p>
      <div className="flex items-center flex-wrap gap-1">
        {path.map((node, i) => {
          const Icon = typeIcons[node.type] || BookOpen;
          const isExpanded = expandedNodes.has(node.id);
          return (
            <React.Fragment key={node.id}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-blue-400 dark:text-blue-500 shrink-0" />}
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                  i === path.length - 1
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900',
                )}
                onClick={() => onToggleExpand(node.id)}
              >
                <Icon className="h-3 w-3" />
                {node.name}
                {isExpanded && <span className="text-blue-500">▼</span>}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// --- Mini Tree for knowledge path ---
function MiniTree({
  node,
  targetAngleId,
  expandedNodes,
  onToggleExpand,
  depth,
}: {
  node: KnowledgeNode;
  targetAngleId: string;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  depth: number;
}) {
  const { getNodeStats } = useAppState();
  const stats = getNodeStats(node.id);
  const isTarget = node.id === targetAngleId;
  const isExpanded = expandedNodes.has(node.id);

  // Check if this node is an ancestor of the target
  const isAncestor = useMemo(() => {
    function check(n: KnowledgeNode): boolean {
      if (n.id === targetAngleId) return true;
      return n.children.some(check);
    }
    return check(node);
  }, [node, targetAngleId]);

  if (!isAncestor && depth > 0) return null;

  const wrongColor = getWrongColor(stats.wrongCount);

  return (
    <div className={cn('ml-2', depth === 0 && 'ml-0')}>
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors w-full text-left',
          isTarget && 'bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700',
          isAncestor && !isTarget && 'bg-blue-50 dark:bg-blue-950/30',
          !isAncestor && 'opacity-50',
        )}
        style={wrongColor && node.type === 'angle' ? { backgroundColor: wrongColor } : undefined}
        onClick={() => onToggleExpand(node.id)}
      >
        {node.children.length > 0 && (
          <span className="text-[10px] text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        )}
        <span className="truncate font-medium">{node.name}</span>
        {isTarget && (
          <Badge className="ml-auto text-[9px] h-4 px-1" variant="secondary">
            当前
          </Badge>
        )}
      </button>
      {isExpanded && node.children.length > 0 && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <MiniTree
              key={child.id}
              node={child}
              targetAngleId={targetAngleId}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Question Card ---
function QuestionCard({
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
  question: PracticeQuestion;
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
    // Default: expand the path to the linked angle, collapse everything else
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            第 {questionNumber} / {totalQuestions} 题
          </Badge>
          {question.linkedAngleName && (
            <Badge variant="secondary" className="text-xs">
              {question.linkedAngleName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main content */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
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

                let optionStyle = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600';
                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600';
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
                      <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">
                        {opt.text}
                      </span>
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

            {/* Result */}
            {showResult && (
              <div
                className={cn(
                  'rounded-lg p-4',
                  isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
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
                      isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400',
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

            {/* Knowledge path */}
            <KnowledgePathDisplay
              mindMap={mindMap}
              angleId={question.linkedAngleId}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        </ScrollArea>

        {/* Side panel: mini knowledge tree */}
        <div className="w-64 border-l bg-gray-50 dark:bg-gray-900/50 shrink-0 hidden lg:block">
          <ScrollArea className="h-full">
            <div className="p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                知识点树（仅显示链路）
              </p>
              <MiniTree
                node={mindMap}
                targetAngleId={question.linkedAngleId}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
                depth={0}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// --- Practice View ---
export default function PracticeView() {
  const { state, addAnswerRecord, dispatch } = useAppState();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showSetList, setShowSetList] = useState(true);

  const selectedSet = state.practiceSets.find((ps) => ps.id === selectedSetId);
  const currentQuestion = selectedSet?.questions[currentQuestionIndex];

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion || !selectedSet) return;
      const qId = currentQuestion.id;
      setAnswers((prev) => ({ ...prev, [qId]: answer }));

      const isCorrect = answer === currentQuestion.correctAnswer;
      addAnswerRecord({
        questionId: qId,
        practiceSetId: selectedSet.id,
        selectedAnswer: answer,
        isCorrect,
        timestamp: Date.now(),
      });
      setShowResults((prev) => ({ ...prev, [qId]: true }));
    },
    [currentQuestion, selectedSet, addAnswerRecord],
  );

  const handleDeletePracticeSet = useCallback(
    (id: string) => {
      if (confirm('确定要删除该套题吗？')) {
        dispatch({ type: 'DELETE_PRACTICE_SET', payload: id });
        if (selectedSetId === id) {
          setSelectedSetId(null);
        }
      }
    },
    [dispatch, selectedSetId],
  );

  if (showSetList || !selectedSet) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">真题练习</h2>
          <Badge variant="outline">{state.practiceSets.length} 套题</Badge>
        </div>

        {state.practiceSets.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无套题，请先导入套题</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {state.practiceSets.map((ps) => {
              const answeredCount = state.answerRecords.filter((r) => r.practiceSetId === ps.id).length;
              const correctCount = state.answerRecords.filter(
                (r) => r.practiceSetId === ps.id && r.isCorrect,
              ).length;
              return (
                <Card key={ps.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {ps.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ps.questions.length} 道题 · 已做 {answeredCount} 道 · 正确 {correctCount} 道
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSetId(ps.id);
                          setCurrentQuestionIndex(0);
                          setAnswers({});
                          setShowResults({});
                          setShowSetList(false);
                        }}
                      >
                        开始练习
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeletePracticeSet(ps.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                  {answeredCount > 0 && (
                    <Progress
                      value={(answeredCount / ps.questions.length) * 100}
                      className="mt-2 h-1.5"
                    />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setShowSetList(true)}>
          ← 返回套题列表
        </Button>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{selectedSet.name}</span>
        <Badge variant="outline" className="text-xs">
          {Object.keys(answers).length}/{selectedSet.questions.length} 已答
        </Badge>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-hidden">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={selectedSet.questions.length}
          selectedAnswer={answers[currentQuestion.id] || null}
          onSelectAnswer={handleSelectAnswer}
          showResult={showResults[currentQuestion.id] || false}
          onPrev={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setCurrentQuestionIndex((i) => Math.min(selectedSet.questions.length - 1, i + 1))
          }
          hasPrev={currentQuestionIndex > 0}
          hasNext={currentQuestionIndex < selectedSet.questions.length - 1}
          mindMap={state.mindMap}
        />
      </div>

      {/* Question navigation */}
      <div className="border-t bg-white dark:bg-gray-900 p-3 shrink-0">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {selectedSet.questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = i === currentQuestionIndex;
            const isCorrect = showResults[q.id] && answers[q.id] === q.correctAnswer;
            const isWrong = showResults[q.id] && answers[q.id] !== q.correctAnswer;

            return (
              <button
                key={q.id}
                type="button"
                className={cn(
                  'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                  isCurrent && 'ring-2 ring-blue-500',
                  isCorrect && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                  isWrong && 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
                  isAnswered && !isCorrect && !isWrong && 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                  !isAnswered && !isCurrent && 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                )}
                onClick={() => setCurrentQuestionIndex(i)}
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
