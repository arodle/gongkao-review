'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import type { QuestionBankItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  PenTool,
  ArrowLeft,
  Send,
  X,
  Timer,
  ListChecks,
} from 'lucide-react';

interface QuestionCardProps {
  question: QuestionBankItem;
  questionNumber: number;
  totalQuestions: number;
  onAnswer?: (selectedAnswer: string, isCorrect: boolean, answerTime: number) => void;
  showDrawing?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onExit?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  hasAnswered: boolean;
  elapsedTime: number;
  answerMode?: 'instant' | 'batch';
  userAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showDrawing = false,
  onPrev,
  onNext,
  onSubmit,
  onExit,
  canGoPrev,
  canGoNext,
  isLastQuestion,
  hasAnswered,
  elapsedTime,
  answerMode = 'instant',
  userAnswer,
  onSelectAnswer,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    setSelectedOption(userAnswer || null);
    setStartTime(Date.now());
    setShowExplanation(false);
    if (answerMode === 'instant') {
      setShowResult(!!userAnswer);
    } else {
      setShowResult(false);
    }
  }, [question.id, userAnswer, answerMode]);

  const handleSelectOption = useCallback((label: string) => {
    if (answerMode === 'batch') {
      setSelectedOption(label);
      onSelectAnswer?.(label);
      return;
    }

    if (showResult) return;

    setSelectedOption(label);
    setShowResult(true);

    const isCorrect = label === question.correctAnswer;
    const answerTime = Date.now() - startTime;

    setTimeout(() => {
      onAnswer?.(label, isCorrect, answerTime);
    }, 100);
  }, [answerMode, showResult, question, startTime, onAnswer, onSelectAnswer]);

  // In batch mode, we never show results during practice - only after submit
  const isCorrect = answerMode === 'batch' ? false : (selectedOption || userAnswer) === question.correctAnswer;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const shouldShowResult = 
    answerMode === 'instant' 
      ? showResult 
      : hasAnswered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExit} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            退出
          </Button>
          <Badge variant="outline" className="text-sm">
            第 {questionNumber} / {totalQuestions} 题
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <Timer className="h-4 w-4" />
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <Progress
        value={(questionNumber / totalQuestions) * 100}
        className="h-1"
      />

      <Card className={`border-2 transition-colors ${
        // In batch mode during practice, never show result
        answerMode === 'batch' && !hasAnswered
          ? 'border-transparent'
          : shouldShowResult
          ? isCorrect
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : (answerMode === 'batch' && userAnswer)
          ? 'border-primary bg-primary/5'
          : 'border-transparent'
      }`}>
        <CardContent className="p-6">
          <p className="text-lg leading-relaxed whitespace-pre-line">
            {question.content}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          let optionClass = 'border-2 hover:border-primary hover:bg-accent transition-all';
          const currentAnswer = answerMode === 'batch' ? userAnswer : selectedOption;

          // In batch mode during practice, don't show any result styling
          if (answerMode === 'batch' && !hasAnswered) {
            if (currentAnswer === option.label) {
              optionClass = 'border-primary bg-primary/10';
            }
          } else if (shouldShowResult) {
            if (option.label === question.correctAnswer) {
              optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            } else if (option.label === currentAnswer && !isCorrect) {
              optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through';
            } else {
              optionClass = 'border-gray-200 dark:border-gray-700 opacity-50';
            }
          } else if (currentAnswer === option.label) {
            optionClass = 'border-primary bg-primary/10';
          }

          return (
            <motion.button
              key={option.label}
              whileHover={!shouldShowResult ? { scale: 1.01 } : {}}
              whileTap={!shouldShowResult ? { scale: 0.99 } : {}}
              onClick={() => handleSelectOption(option.label)}
              disabled={shouldShowResult}
              className={`w-full p-4 rounded-xl text-left flex items-start gap-3 ${optionClass}`}
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold">
                {option.label}
              </span>
              <span className="flex-1 pt-1">{option.text}</span>
              {/* Only show result icons in instant mode or after submission */}
              {answerMode !== 'batch' && shouldShowResult && option.label === question.correctAnswer && (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
              )}
              {answerMode !== 'batch' && shouldShowResult && option.label === currentAnswer && !isCorrect && (
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {shouldShowResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-semibold">回答正确！</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6" />
                  <span className="font-semibold">回答错误，正确答案是 {question.correctAnswer}</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showExplanation ? '收起解析' : '查看解析'}
              </Button>
            </div>

            {showExplanation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
              >
                <p className="text-sm leading-relaxed">
                  {question.explanation}
                </p>
                {question.images && question.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {question.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`解析图片 ${idx + 1}`} className="rounded-lg border max-h-64 object-contain" />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一题
        </Button>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button
              variant="default"
              onClick={onNext}
              disabled={!userAnswer}
            >
              下一题
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={answerMode === 'batch' ? !hasAnswered : false}
            >
              <Send className="h-4 w-4 mr-1" />
              提交整卷
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NodeTreeItem({ node, depth, expandedNodes, selectedNodeId, onToggleExpand, onSelect, getQuestionCount }: { node: any; depth: number; expandedNodes: Set<string>; selectedNodeId: string; onToggleExpand: (id: string) => void; onSelect: (id: string) => void; getQuestionCount: (id: string) => number }) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const questionCount = getQuestionCount(node.id);
  
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        <span className="flex-1 text-sm truncate">{node.name}</span>
        {questionCount > 0 && (
          <Badge variant="outline" className="text-xs">{questionCount}题</Badge>
        )}
        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child: any) => (
            <NodeTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              selectedNodeId={selectedNodeId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              getQuestionCount={getQuestionCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PracticeSelectorProps {
  onSelectMode: (mode: 'sequence' | 'random' | 'targeted' | 'exam', nodeId?: string) => void;
}

export function PracticeSelector({ onSelectMode }: PracticeSelectorProps) {
  const { nodes, getWeakNodes, questionBank } = useAppStore();
  const weakNodes = getWeakNodes();
  
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceNodeId, setSequenceNodeId] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // 构建树形结构
  const buildTree = (nodes: any[]) => {
    const nodeMap = new Map();
    const roots: any[] = [];
    
    // 先创建所有节点的映射
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });
    
    // 构建父子关系
    nodes.forEach(node => {
      const nodeInTree = nodeMap.get(node.id);
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(nodeInTree);
      } else {
        roots.push(nodeInTree);
      }
    });
    
    return roots;
  };
  
  const treeNodes = buildTree(nodes);
  
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const getQuestionCountForNode = (nodeId: string): number => {
    return questionBank.filter(q => q.linkedAngleId === nodeId).length;
  };
  
  const handleSequenceStart = () => {
    if (sequenceNodeId) {
      onSelectMode('sequence', sequenceNodeId);
      setShowSequenceModal(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer hover:border-primary transition-colors h-full"
            onClick={() => setShowSequenceModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">顺序练习</h3>
                  <p className="text-sm text-muted-foreground">
                    选择知识点节点进行练习
                  </p>
                  <Badge variant="secondary">{nodes.length} 个知识点</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer hover:border-primary transition-colors h-full"
            onClick={() => onSelectMode('random')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">随机练习</h3>
                  <p className="text-sm text-muted-foreground">
                    从全部题库随机抽取，全面覆盖各个知识点
                  </p>
                  <Badge variant="secondary">随机打乱</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer hover:border-primary transition-colors h-full relative overflow-hidden"
            onClick={() => onSelectMode('targeted')}
          >
            {weakNodes.length > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                {weakNodes.length} 个薄弱点
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">靶向练习</h3>
                  <p className="text-sm text-muted-foreground">
                    专注练习 PS &lt; 80 的薄弱知识点，针对性强化
                  </p>
                  <Badge variant="destructive">针对薄弱点</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="cursor-pointer hover:border-primary transition-colors h-full"
            onClick={() => onSelectMode('exam')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">套卷练习</h3>
                  <p className="text-sm text-muted-foreground">
                    完整试卷定时模拟，检验整体学习效果
                  </p>
                  <Badge variant="secondary">计时模式</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* 顺序练习节点选择弹窗 */}
      <Dialog open={showSequenceModal} onOpenChange={setShowSequenceModal}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择知识点</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-1 py-2">
              {treeNodes.map(node => (
                <NodeTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedNodes={expandedNodes}
                  selectedNodeId={sequenceNodeId}
                  onToggleExpand={toggleExpand}
                  onSelect={setSequenceNodeId}
                  getQuestionCount={getQuestionCountForNode}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSequenceModal(false)}>取消</Button>
            <Button onClick={handleSequenceStart} disabled={!sequenceNodeId}>开始练习</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PracticeSessionProps {
  questions: QuestionBankItem[];
  mode: 'sequence' | 'random' | 'targeted' | 'exam';
  answerMode?: 'instant' | 'batch';
  onComplete: (results: { correct: number; wrong: number; details: any[] }) => void;
  onExit: () => void;
}

export function PracticeSession({ questions, mode, answerMode = 'instant', onComplete, onExit }: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isRunning, setIsRunning] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false); // 新增状态：是否已提交
  const { updateNodePSScore, addAnswer } = useAppStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">暂无练习题目</h3>
            <p className="text-muted-foreground">
              题库为空或没有符合当前筛选条件的题目
            </p>
            <Button variant="outline" className="mt-4" onClick={onExit}>
              返回练习选择
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentUserAnswer = userAnswers[currentIndex];
  const hasAnsweredCurrent = currentUserAnswer !== undefined;
  const hasAnsweredAll = Object.keys(userAnswers).length === questions.length;

  const handleAnswer = useCallback(async (selectedAnswer: string, isCorrect: boolean, answerTime: number) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));

    const answer = {
      question: currentQuestion,
      selectedAnswer,
      isCorrect,
      answerTime,
      timestamp: Date.now(),
    };

    setAnswers(prev => [...prev, answer]);

    addAnswer({
      questionId: currentQuestion.id,
      practiceSetId: `practice_${mode}`,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
      linkedAngleId: currentQuestion.linkedAngleId,
      source: 'practice',
    });

    if (currentQuestion.linkedAngleId) {
      await updateNodePSScore(currentQuestion.linkedAngleId, isCorrect);
    }
  }, [currentQuestion, currentIndex, mode, addAnswer, updateNodePSScore]);

  const handleSelectAnswer = useCallback((selectedAnswer: string) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    setIsRunning(false);
    setIsSubmitted(true); // 标记为已提交

    if (answerMode === 'batch') {
      const unanswered = questions.some((_, i) => !userAnswers[i]);
      if (unanswered) {
        setIsRunning(true);
        setIsSubmitted(false); // 恢复状态
        alert('请完成所有题目再提交！');
        return;
      }

      const allAnswers = questions.map((q, idx) => {
        const selectedAnswer = userAnswers[idx];
        const isCorrect = selectedAnswer === q.correctAnswer;
        return {
          question: q,
          selectedAnswer,
          isCorrect,
          answerTime: elapsedTime / questions.length * 1000,
          timestamp: Date.now(),
        };
      });

      for (const answer of allAnswers) {
        if (answer.question.linkedAngleId) {
          await updateNodePSScore(answer.question.linkedAngleId, answer.isCorrect);
        }
        addAnswer({
          questionId: answer.question.id,
          practiceSetId: `practice_${mode}`,
          selectedAnswer: answer.selectedAnswer || '',
          isCorrect: answer.isCorrect,
          timestamp: Date.now(),
          linkedAngleId: answer.question.linkedAngleId,
          source: 'practice',
        });
      }

      setAnswers(allAnswers);
      setIsComplete(true);
      onComplete({
        correct: allAnswers.filter(a => a.isCorrect).length,
        wrong: allAnswers.filter(a => !a.isCorrect).length,
        details: allAnswers,
      });
    } else {
      setIsComplete(true);
      onComplete({
        correct: answers.filter(a => a.isCorrect).length,
        wrong: answers.filter(a => !a.isCorrect).length,
        details: answers,
      });
    }
  }, [answerMode, questions, userAnswers, elapsedTime, updateNodePSScore, addAnswer, mode, answers, onComplete]);

  const handleExitConfirm = useCallback(() => {
    setIsRunning(false);
    onExit();
  }, [onExit]);

  const handleQuestionJump = useCallback((idx: number) => {
    if (currentUserAnswer) {
      setUserAnswers(prev => ({ ...prev, [currentIndex]: currentUserAnswer }));
    }
    setCurrentIndex(idx);
  }, [currentIndex, currentUserAnswer]);

  const handleNext = useCallback(() => {
    if (currentUserAnswer) {
      setUserAnswers(prev => ({ ...prev, [currentIndex]: currentUserAnswer }));
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, questions.length, currentUserAnswer]);

  const handlePrev = useCallback(() => {
    if (currentUserAnswer) {
      setUserAnswers(prev => ({ ...prev, [currentIndex]: currentUserAnswer }));
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, currentUserAnswer]);

  if (isComplete) {
    return <PracticeComplete results={answers} onExit={onExit} elapsedTime={elapsedTime} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex overflow-x-auto gap-1 pb-2">
            {questions.map((_, idx) => (
              <Button
                key={idx}
                variant={idx === currentIndex ? 'default' : userAnswers[idx] ? 'secondary' : 'outline'}
                size="sm"
                className="min-w-[2.5rem] flex-shrink-0"
                onClick={() => handleQuestionJump(idx)}
              >
                {idx + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showDrawing={mode === 'exam'}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        onExit={handleExitConfirm}
        canGoPrev={currentIndex > 0}
        canGoNext={currentIndex < questions.length - 1}
        isLastQuestion={currentIndex === questions.length - 1}
        hasAnswered={answerMode === 'batch' ? isSubmitted : hasAnsweredCurrent} // 修改这里
        elapsedTime={elapsedTime}
        answerMode={answerMode}
        userAnswer={currentUserAnswer}
        onSelectAnswer={handleSelectAnswer}
      />
    </div>
  );
}

function PracticeComplete({ results, onExit, elapsedTime }: { results: any[]; onExit: () => void; elapsedTime: number }) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const [filter, setFilter] = useState<'all' | 'wrong'>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(r => !r.isCorrect);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      {/* 成绩概览 */}
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl font-bold text-primary">{accuracy}%</div>
          <p className="text-lg">正确率</p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{correctCount}</div>
              <div className="text-sm text-muted-foreground">正确</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{totalCount - correctCount}</div>
              <div className="text-sm text-muted-foreground">错误</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{formatTime(elapsedTime)}</div>
              <div className="text-sm text-muted-foreground">用时</div>
            </div>
          </div>

          <Progress value={accuracy} className="h-3" />
        </CardContent>
      </Card>

      {/* 题号列表 */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">答题详情</h3>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                全部 ({totalCount})
              </Button>
              <Button
                variant={filter === 'wrong' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('wrong')}
                className={filter === 'wrong' ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                只看错题 ({totalCount - correctCount})
              </Button>
            </div>
          </div>

          {/* 题号网格 */}
          <div className="grid grid-cols-10 gap-2">
            {results.map((result, idx) => {
              const isCorrect = result.isCorrect;
              if (filter === 'wrong' && isCorrect) return null;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedQuestion(selectedQuestion === idx ? null : idx)}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center font-semibold text-sm
                    transition-all hover:scale-105
                    ${isCorrect 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                    }
                    ${selectedQuestion === idx ? 'ring-2 ring-primary scale-105' : ''}
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="flex gap-6 text-sm justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>正确</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>错误</span>
            </div>
          </div>

          {/* 选中题目的详情 */}
          {selectedQuestion !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t pt-4 mt-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    第 {selectedQuestion + 1} 题
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      results[selectedQuestion].isCorrect 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {results[selectedQuestion].isCorrect ? '正确' : '错误'}
                    </span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuestion(null)}
                  >
                    关闭
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">题目内容：</p>
                  <p className="text-sm whitespace-pre-line">{results[selectedQuestion].question?.content}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">选项：</p>
                    {results[selectedQuestion].question?.options.map((opt: any) => {
                      const isCorrectOption = opt.label === results[selectedQuestion].question?.correctAnswer;
                      const isUserAnswer = opt.label === results[selectedQuestion].selectedAnswer;
                      
                      return (
                        <div 
                          key={opt.label}
                          className={`p-3 rounded-lg border ${
                            isCorrectOption 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                              : isUserAnswer && !results[selectedQuestion].isCorrect
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 line-through'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className="font-semibold">{opt.label}.</span> {opt.text}
                          {isCorrectOption && <span className="ml-2 text-green-600">✓ 正确答案</span>}
                          {isUserAnswer && !isCorrectOption && <span className="ml-2 text-red-600">✗ 你的答案</span>}
                        </div>
                      );
                    })}
                  </div>

                  {results[selectedQuestion].question?.explanation && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">解析</span>
                      </div>
                      <p className="text-sm">{results[selectedQuestion].question?.explanation}</p>
                    </div>
                  )}

                  {results[selectedQuestion].question?.images?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">解析图片：</p>
                      <div className="grid grid-cols-2 gap-2">
                        {results[selectedQuestion].question?.images.map((img: string, idx: number) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`解析图片 ${idx + 1}`} 
                            className="rounded-lg border max-h-48 object-contain" 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-center">
        <Button size="lg" onClick={onExit}>
          返回练习选择
        </Button>
      </div>
    </motion.div>
  );
}
