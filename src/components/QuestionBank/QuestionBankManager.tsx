'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import type { QuestionBankItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Upload,
  Download,
  Search,
  Edit3,
  Trash2,
  FileText,
  BookOpen,
  FileQuestion,
  FolderOpen,
  X,
  Check,
  AlertTriangle,
  Copy,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionFormData {
  content: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  images: string[];
  linkedAngleId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'real' | 'simulated';
}

const initialFormData: QuestionFormData = {
  content: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctAnswer: '',
  explanation: '',
  images: [],
  linkedAngleId: '',
  difficulty: 'medium',
  type: 'real',
};

interface ExamPaperFormData {
  name: string;
  description: string;
  type: 'real' | 'simulated';
  questions: string[];
}

interface ExamPaper {
  id: string;
  name: string;
  description: string;
  type: 'real' | 'simulated';
  questions: string[];
  createdAt: string;
  completedCount: number;
  avgScore: number;
}

export function QuestionBankManager() {
  const { questionBank, nodes, addQuestion, updateQuestion, deleteQuestion, addExamPaper } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'simulated'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);
  const [paperFormData, setPaperFormData] = useState<ExamPaperFormData>({
    name: '',
    description: '',
    type: 'real',
    questions: [],
  });
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  const filteredQuestions = useMemo(() => {
    let result = questionBank;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        q => q.content.toLowerCase().includes(query) ||
          q.explanation.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      result = result.filter(q => q.type === filterType);
    }

    if (filterDifficulty !== 'all') {
      result = result.filter(q => q.difficulty === filterDifficulty);
    }

    return result;
  }, [questionBank, searchQuery, filterType, filterDifficulty]);

  const realQuestions = useMemo(() => {
    return questionBank.filter(q => q.type === 'real');
  }, [questionBank]);

  const simulatedQuestions = useMemo(() => {
    return questionBank.filter(q => q.type === 'simulated');
  }, [questionBank]);

  const handleOpenQuestionDialog = useCallback((question?: QuestionBankItem) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        content: question.content,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        images: question.images || [],
        linkedAngleId: question.linkedAngleId || '',
        difficulty: question.difficulty || 'medium',
        type: question.type || 'real',
      });
    } else {
      setEditingQuestion(null);
      setFormData(initialFormData);
    }
    setShowQuestionDialog(true);
  }, []);

  const handleSaveQuestion = useCallback(() => {
    if (!formData.content || !formData.correctAnswer) return;

    const questionData: QuestionBankItem = {
      id: editingQuestion?.id || `q_${Date.now()}`,
      content: formData.content,
      options: formData.options.filter(o => o.text),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      images: formData.images,
      linkedAngleId: formData.linkedAngleId,
      difficulty: formData.difficulty,
      type: formData.type,
      createdAt: editingQuestion?.createdAt || new Date().toISOString(),
    };

    if (editingQuestion) {
      updateQuestion(questionData);
    } else {
      addQuestion(questionData);
    }

    setShowQuestionDialog(false);
    setFormData(initialFormData);
    setEditingQuestion(null);
  }, [formData, editingQuestion, addQuestion, updateQuestion]);

  const handleDeleteQuestion = useCallback((id: string) => {
    if (confirm('确定要删除这道题目吗？')) {
      deleteQuestion(id);
    }
  }, [deleteQuestion]);

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          data.forEach((item: QuestionBankItem) => {
            if (item.content && item.options && item.correctAnswer) {
              addQuestion({
                ...item,
                id: item.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              });
            }
          });
          alert(`成功导入 ${data.length} 道题目`);
        }
      } catch (error) {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [addQuestion]);

  const handleExportQuestions = useCallback(() => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredQuestions]);

  const handleToggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCreatePaper = useCallback(() => {
    if (!paperFormData.name || selectedQuestions.size === 0) return;

    addExamPaper({
      id: `paper_${Date.now()}`,
      name: paperFormData.name,
      description: paperFormData.description,
      type: paperFormData.type,
      questions: Array.from(selectedQuestions),
      createdAt: new Date().toISOString(),
      completedCount: 0,
      avgScore: 0,
    });

    setShowPaperDialog(false);
    setPaperFormData({
      name: '',
      description: '',
      type: 'real',
      questions: [],
    });
    setSelectedQuestions(new Set());
    alert('套卷创建成功！');
  }, [paperFormData, selectedQuestions, addExamPaper]);

  const getLinkedNodeName = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.name || '未分类';
  }, [nodes]);

  const stats = useMemo(() => ({
    total: questionBank.length,
    real: realQuestions.length,
    simulated: simulatedQuestions.length,
    easy: questionBank.filter(q => q.difficulty === 'easy').length,
    medium: questionBank.filter(q => q.difficulty === 'medium').length,
    hard: questionBank.filter(q => q.difficulty === 'hard').length,
  }), [questionBank, realQuestions, simulatedQuestions]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              题库管理
            </h2>
            <Badge variant="outline">{stats.total} 题</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImportJSON}>
              <Upload className="h-4 w-4 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportQuestions}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPaperDialog(true)}>
              <Layers className="h-4 w-4 mr-1" />
              创建套卷
            </Button>
            <Button size="sm" onClick={() => handleOpenQuestionDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              添加题目
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索题目内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          >
            <option value="all">全部类型</option>
            <option value="real">真题</option>
            <option value="simulated">模拟题</option>
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as any)}
            className="border rounded px-2 py-1.5 text-sm bg-background"
          >
            <option value="all">全部难度</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Badge variant="secondary">
            <FileQuestion className="h-3 w-3 mr-1" />
            真题 {stats.real} 题
          </Badge>
          <Badge variant="outline">
            <BookOpen className="h-3 w-3 mr-1" />
            模拟题 {stats.simulated} 题
          </Badge>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredQuestions.length > 0 ? (
            <div className="space-y-2">
              {filteredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary/50',
                    selectedQuestions.has(question.id) && 'border-primary bg-primary/5'
                  )}
                  onClick={() => handleToggleQuestionSelection(question.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={question.type === 'real' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {question.type === 'real' ? '真题' : '模拟题'}
                          </Badge>
                          <Badge
                            variant={
                              question.difficulty === 'easy' ? 'success' :
                              question.difficulty === 'medium' ? 'warning' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {
                              question.difficulty === 'easy' ? '简单' :
                              question.difficulty === 'medium' ? '中等' : '困难'
                            }
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {getLinkedNodeName(question.linkedAngleId)}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2 mb-2">{question.content}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {question.options.map((opt) => (
                            <span
                              key={opt.label}
                              className={cn(
                                'px-2 py-1 rounded',
                                opt.label === question.correctAnswer && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              )}
                            >
                              {opt.label}. {opt.text}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenQuestionDialog(question)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无题目</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? '没有找到符合条件的题目' : '点击上方按钮添加题目或导入题库'}
              </p>
              <Button onClick={() => handleOpenQuestionDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                添加题目
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? '编辑题目' : '添加题目'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">题目类型</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="real"
                    checked={formData.type === 'real'}
                    onChange={(e) => setFormData({ ...formData, type: 'real' })}
                  />
                  真题
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="simulated"
                    checked={formData.type === 'simulated'}
                    onChange={(e) => setFormData({ ...formData, type: 'simulated' })}
                  />
                  模拟题
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">题目难度</label>
              <div className="flex gap-4">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <label key={level} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={formData.difficulty === level}
                      onChange={(e) => setFormData({ ...formData, difficulty: level })}
                    />
                    {level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难'}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">关联知识点</label>
              <select
                value={formData.linkedAngleId}
                onChange={(e) => setFormData({ ...formData, linkedAngleId: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">请选择知识点</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">题目内容</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入题目内容..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">选项</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={option.label} className="flex items-center gap-2">
                    <span className="w-6 font-medium">{option.label}.</span>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index].text = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      placeholder={`选项 ${option.label}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">正确答案</label>
              <select
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">请选择正确答案</option>
                {formData.options.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}. {option.text || '(未填写)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">解析</label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="请输入题目解析..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">解析图片</label>
                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-1" />
                  添加图片
                </Button>
              </div>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`解析图片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveQuestion}>
              <Check className="h-4 w-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaperDialog} onOpenChange={setShowPaperDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建套卷</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">套卷名称</label>
                <Input
                  value={paperFormData.name}
                  onChange={(e) => setPaperFormData({ ...paperFormData, name: e.target.value })}
                  placeholder="例如：2024年国考行测真题"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">套卷类型</label>
                <select
                  value={paperFormData.type}
                  onChange={(e) => setPaperFormData({ ...paperFormData, type: e.target.value as any })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="real">真题套卷</option>
                  <option value="simulated">模拟题套卷</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Textarea
                value={paperFormData.description}
                onChange={(e) => setPaperFormData({ ...paperFormData, description: e.target.value })}
                placeholder="套卷描述..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">选择题目（已选 {selectedQuestions.size} 题）</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const availableQuestions = paperFormData.type === 'real' ? realQuestions : simulatedQuestions;
                      setSelectedQuestions(new Set(availableQuestions.map(q => q.id)));
                    }}
                  >
                    全选当前类型
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQuestions(new Set())}
                  >
                    清空
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[300px] border rounded">
                <div className="p-2 space-y-1">
                  {(paperFormData.type === 'real' ? realQuestions : simulatedQuestions).length > 0 ? (
                    (paperFormData.type === 'real' ? realQuestions : simulatedQuestions).map((question) => (
                      <div
                        key={question.id}
                        className={cn(
                          'p-2 rounded cursor-pointer transition-colors',
                          selectedQuestions.has(question.id)
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => handleToggleQuestionSelection(question.id)}
                      >
                        <p className="text-sm line-clamp-2">{question.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          正确答案: {question.correctAnswer}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无{paperFormData.type === 'real' ? '真题' : '模拟题'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaperDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreatePaper}
              disabled={!paperFormData.name || selectedQuestions.size === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              创建套卷
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
