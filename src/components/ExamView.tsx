'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ExamResult } from '@/lib/types';
import { useAppState } from '@/lib/store';
import { createId } from '@/lib/sample-data';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  Trophy,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ExamPhase = 'select' | 'running' | 'result';

export default function ExamView() {
  const { state, addAnswerRecord, dispatch } = useAppState();
  const [phase, setPhase] = useState<ExamPhase>('select');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedSet = state.practiceSets.find((ps) => ps.id === selectedSetId);
  const currentQuestion = selectedSet?.questions[currentQuestionIndex];

  // Timer
  useEffect(() => {
    if (phase === 'running' && startTime > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  // Use refs to hold latest values for stable callbacks
  const selectedSetRef = useRef(selectedSet);
  selectedSetRef.current = selectedSet;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = useCallback(() => {
    if (!selectedSetId) return;
    setAnswers({});
    setCurrentQuestionIndex(0);
    setExamResult(null);
    setStartTime(Date.now());
    setElapsed(0);
    setPhase('running');
  }, [selectedSetId]);

  const handleSubmitExam = useCallback(() => {
    const currentSet = selectedSetRef.current;
    const currentAnswers = answersRef.current;
    if (!currentSet) return;

    let score = 0;
    const wrongQuestionIds: string[] = [];
    const now = Date.now();

    for (const q of currentSet.questions) {
      const userAnswer = currentAnswers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) {
        score++;
      } else {
        wrongQuestionIds.push(q.id);
      }
      // Record each answer
      addAnswerRecord({
        questionId: q.id,
        practiceSetId: currentSet.id,
        selectedAnswer: userAnswer || '',
        isCorrect,
        timestamp: now,
      });
    }

    const result: ExamResult = {
      id: createId('exam'),
      practiceSetId: currentSet.id,
      answers: { ...currentAnswers },
      score,
      totalQuestions: currentSet.questions.length,
      completedAt: new Date().toISOString(),
      wrongQuestionIds,
    };

    dispatch({ type: 'ADD_EXAM_RESULT', payload: result });
    setExamResult(result);
    setPhase('result');
  }, [addAnswerRecord, dispatch]);

  const answeredCount = selectedSet
    ? selectedSet.questions.filter((q) => answers[q.id] !== undefined).length
    : 0;

  // --- Select Phase ---
  if (phase === 'select') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">套卷模式</h2>
        </div>

        {state.practiceSets.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无套题，请先导入套题</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              选择一套题目开始考试，所有题目完成后提交试卷。错误题目将触发对应知识点角度区域的颜色变化。
            </p>
            {state.practiceSets.map((ps) => {
              const isSelected = selectedSetId === ps.id;
              return (
                <Card
                  key={ps.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all',
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'hover:shadow-md',
                  )}
                  onClick={() => setSelectedSetId(ps.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {ps.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ps.questions.length} 道题 · 创建于{' '}
                        {new Date(ps.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </Card>
              );
            })}

            <Button
              className="w-full mt-4"
              disabled={!selectedSetId}
              onClick={handleStartExam}
            >
              开始考试
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Running Phase ---
  if (phase === 'running' && selectedSet && currentQuestion) {
    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {answeredCount}/{selectedSet.questions.length} 已答
            </Badge>
            <Progress
              value={(answeredCount / selectedSet.questions.length) * 100}
              className="w-32 h-2"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            {formatTime(elapsed)}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Send className="h-3.5 w-3.5 mr-1" />
                交卷
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认交卷？</AlertDialogTitle>
                <AlertDialogDescription>
                  {answeredCount < selectedSet.questions.length ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      还有 {selectedSet.questions.length - answeredCount} 题未作答！
                    </span>
                  ) : (
                    '所有题目已作答。'
                  )}
                  交卷后将无法修改答案。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>继续答题</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitExam}>确认交卷</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Question content */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  第 {currentQuestionIndex + 1} 题
                </Badge>
                {currentQuestion.linkedAngleName && (
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.linkedAngleName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {currentQuestion.content}
              </p>
            </Card>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className={cn(
                      'w-full text-left p-3 rounded-lg border-2 transition-all duration-200',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600',
                    )}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.label }))
                    }
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 dark:border-gray-600',
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">
                        {opt.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom navigation */}
        <div className="border-t bg-white dark:bg-gray-900 p-3 shrink-0">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {selectedSet.questions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = i === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                    isCurrent && 'ring-2 ring-blue-500',
                    isAnswered && 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                    !isAnswered && !isCurrent && 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                  )}
                  onClick={() => setCurrentQuestionIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentQuestionIndex((i) =>
                  Math.min(selectedSet.questions.length - 1, i + 1),
                )
              }
              disabled={currentQuestionIndex === selectedSet.questions.length - 1}
            >
              下一题
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Result Phase ---
  if (phase === 'result' && examResult && selectedSet) {
    const scorePercentage = (examResult.score / examResult.totalQuestions) * 100;

    return (
      <div className="flex flex-col h-full">
        {/* Result Header */}
        <div className="p-6 text-center bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900">
          <Trophy
            className={cn(
              'h-16 w-16 mx-auto mb-3',
              scorePercentage >= 80
                ? 'text-yellow-500'
                : scorePercentage >= 60
                  ? 'text-blue-500'
                  : 'text-gray-400',
            )}
          />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {scorePercentage >= 80 ? '优秀！' : scorePercentage >= 60 ? '不错！' : '继续加油！'}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {examResult.score}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">正确</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">
                {examResult.totalQuestions - examResult.score}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">错误</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {examResult.totalQuestions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">总题数</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            用时 {formatTime(elapsed)} · 正确率 {scorePercentage.toFixed(1)}%
          </p>
        </div>

        {/* Wrong questions detail */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              错误题目详解（知识点颜色已更新）
            </h3>

            {examResult.wrongQuestionIds.length === 0 ? (
              <Card className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-green-600 dark:text-green-400">全部正确，太棒了！</p>
              </Card>
            ) : (
              selectedSet.questions
                .filter((q) => examResult.wrongQuestionIds.includes(q.id))
                .map((q) => (
                  <Card key={q.id} className="p-4 space-y-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {q.content}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 ml-6">
                      {q.options.map((opt) => (
                        <div
                          key={opt.label}
                          className={cn(
                            'text-xs px-2 py-1.5 rounded',
                            opt.label === q.correctAnswer
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                              : opt.label === examResult.answers[q.id]
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                          )}
                        >
                          {opt.label}. {opt.text}
                        </div>
                      ))}
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        你的答案：
                        <span className="text-red-500 font-medium">{examResult.answers[q.id]}</span>
                        {' | '}正确答案：
                        <span className="text-green-500 font-medium">{q.correctAnswer}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        关联考点：
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {q.linkedAngleName}
                        </Badge>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                        {q.explanation}
                      </p>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t bg-white dark:bg-gray-900 p-4 flex justify-center gap-3 shrink-0">
          <Button variant="outline" onClick={() => setPhase('select')}>
            返回选择
          </Button>
          <Button
            onClick={() => {
              setAnswers({});
              setCurrentQuestionIndex(0);
              setStartTime(Date.now());
              setElapsed(0);
              setExamResult(null);
              setPhase('running');
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            重新练习
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
