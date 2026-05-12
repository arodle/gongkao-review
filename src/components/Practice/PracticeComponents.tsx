'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import type { QuestionBankItem } from '@/types';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  PenTool,
} from 'lucide-react';

interface QuestionCardProps {
  question: QuestionBankItem;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedAnswer: string, isCorrect: boolean, answerTime: number) => void;
  showDrawing?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showDrawing = false,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelectOption = useCallback((label: string) => {
    if (showResult) return;

    setSelectedOption(label);
    setShowResult(true);

    const isCorrect = label === question.correctAnswer;
    const answerTime = Date.now() - startTime;

    setTimeout(() => {
      onAnswer(label, isCorrect, answerTime);
    }, 100);
  }, [showResult, question, startTime, onAnswer]);

  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          第 {questionNumber} / {totalQuestions} 题
        </Badge>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{Math.floor((Date.now() - startTime) / 1000)}s</span>
        </div>
      </div>

      <Progress
        value={(questionNumber / totalQuestions) * 100}
        className="h-1"
      />

      <Card className={`border-2 transition-colors ${
        showResult
          ? isCorrect
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
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

          if (showResult) {
            if (option.label === question.correctAnswer) {
              optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            } else if (option.label === selectedOption && !isCorrect) {
              optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through';
            } else {
              optionClass = 'border-gray-200 dark:border-gray-700 opacity-50';
            }
          } else if (selectedOption === option.label) {
            optionClass = 'border-primary bg-primary/10';
          }

          return (
            <motion.button
              key={option.label}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              onClick={() => handleSelectOption(option.label)}
              disabled={showResult}
              className={`w-full p-4 rounded-xl text-left flex items-start gap-3 ${optionClass}`}
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold">
                {option.label}
              </span>
              <span className="flex-1 pt-1">{option.text}</span>
              {showResult && option.label === question.correctAnswer && (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
              )}
              {showResult && option.label === selectedOption && !isCorrect && (
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {showResult && (
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
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface PracticeSelectorProps {
  onSelectMode: (mode: 'sequence' | 'random' | 'targeted' | 'exam') => void;
}

export function PracticeSelector({ onSelectMode }: PracticeSelectorProps) {
  const { nodes, getWeakNodes } = useAppStore();
  const weakNodes = getWeakNodes();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className="cursor-pointer hover:border-primary transition-colors h-full"
          onClick={() => onSelectMode('sequence')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">顺序练习</h3>
                <p className="text-sm text-muted-foreground">
                  按知识图谱层级依次练习，从基础开始稳步提升
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
                <h3 className="font-semibold text-lg">套卷模考</h3>
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
  );
}

interface PracticeSessionProps {
  questions: QuestionBankItem[];
  mode: 'sequence' | 'random' | 'targeted' | 'exam';
  onComplete: (results: { correct: number; wrong: number; details: any[] }) => void;
}

export function PracticeSession({ questions, mode, onComplete }: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { updateNodePSScore, addAnswer } = useAppStore();

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
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(async (selectedAnswer: string, isCorrect: boolean, answerTime: number) => {
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

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsComplete(true);
        onComplete({
          correct: answers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0),
          wrong: answers.filter(a => !a.isCorrect).length + (isCorrect ? 0 : 1),
          details: [...answers, answer],
        });
      }
    }, 500);
  }, [currentQuestion, currentIndex, questions.length, answers, mode, onComplete, updateNodePSScore, addAnswer]);

  if (isComplete) {
    return <PracticeComplete results={answers} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showDrawing={mode === 'exam'}
      />
    </div>
  );
}

function PracticeComplete({ results }: { results: any[] }) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto p-6"
    >
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center space-y-6">
          <div className="text-6xl font-bold text-primary">{accuracy}%</div>
          <p className="text-lg">
            正确率
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{correctCount}</div>
              <div className="text-sm text-muted-foreground">正确</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{totalCount - correctCount}</div>
              <div className="text-sm text-muted-foreground">错误</div>
            </div>
          </div>

          <Progress value={accuracy} className="h-3" />

          <div className="pt-4">
            <Button size="lg" onClick={() => window.location.reload()}>
              返回练习选择
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
