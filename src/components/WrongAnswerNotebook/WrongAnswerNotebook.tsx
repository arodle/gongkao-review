'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import type { KnowledgeNodeRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  Search,
  Tag,
  Edit3,
  Save,
  ChevronRight,
  RefreshCw,
  ListTodo,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WrongAnswerNote {
  id: string;
  questionId: string;
  questionContent: string;
  correctAnswer: string;
  userAnswer: string;
  nodePath: string;
  linkedAngleId: string;
  linkedAngleName: string;
  note: string;
  createdAt: string;
}

interface WrongAnswerItemProps {
  item: WrongAnswerNote;
  isSelected: boolean;
  onSelect: () => void;
}

function WrongAnswerItem({ item, isSelected, onSelect }: WrongAnswerItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 border-b cursor-pointer transition-colors',
        isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm line-clamp-2 flex-1">{item.questionContent}</p>
          <Badge variant="destructive" className="shrink-0">
            <XCircle className="h-3 w-3 mr-1" />
            错题
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span className="truncate max-w-[150px]">{item.nodePath}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">你的答案：</span>
          <Badge variant="outline" className="text-red-500 border-red-200">
            {item.userAnswer}
          </Badge>
          <span className="text-muted-foreground">正确答案：</span>
          <Badge variant="outline" className="text-green-500 border-green-200">
            {item.correctAnswer}
          </Badge>
        </div>

        {item.note && (
          <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs">
            <p className="text-amber-700 dark:text-amber-300 line-clamp-2">{item.note}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function WrongAnswerNotebook() {
  const { practiceRecords, nodes, questionBank } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNode, setFilterNode] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const wrongAnswers = useMemo(() => {
    const wrongRecords = practiceRecords.filter(r => !r.is_correct);

    return wrongRecords.map(record => {
      const question = questionBank.find(q => q.id === record.question_id);
      const linkedNode = question?.linkedAngleId
        ? nodes.find(n => n.id === question.linkedAngleId)
        : null;

      const getNodePath = (nodeId: string): string => {
        const parts: string[] = [];
        let current = nodes.find(n => n.id === nodeId);
        while (current) {
          parts.unshift(current.name);
          current = current.parent_id
            ? nodes.find(n => n.id === current!.parent_id)
            : undefined;
        }
        return parts.join(' / ');
      };

      return {
        id: record.id,
        questionId: record.question_id,
        questionContent: question?.content || '题目内容已不存在',
        correctAnswer: question?.correctAnswer || '未知',
        userAnswer: '未记录',
        nodePath: linkedNode ? getNodePath(linkedNode.id) : '未分类',
        linkedAngleId: question?.linkedAngleId || '',
        linkedAngleName: linkedNode?.name || '未分类',
        note: '',
        createdAt: record.updated_at,
      } as WrongAnswerNote;
    }).reverse();
  }, [practiceRecords, questionBank, nodes]);

  const filteredWrongAnswers = useMemo(() => {
    let result = wrongAnswers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.questionContent.toLowerCase().includes(query) ||
          item.nodePath.toLowerCase().includes(query) ||
          item.linkedAngleName.toLowerCase().includes(query)
      );
    }

    if (filterNode !== 'all') {
      result = result.filter(item => item.linkedAngleId === filterNode);
    }

    return result;
  }, [wrongAnswers, searchQuery, filterNode]);

  const selectedItem = useMemo(() => {
    return filteredWrongAnswers.find(item => item.id === selectedId);
  }, [filteredWrongAnswers, selectedId]);

  const weakNodes = useMemo(() => {
    return nodes.filter(n => n.ps_score < 80);
  }, [nodes]);

  const handleExportWrongAnswers = useCallback(() => {
    const exportData = filteredWrongAnswers.map(item => ({
      '题目内容': item.questionContent,
      '正确答案': item.correctAnswer,
      '你的答案': item.userAnswer,
      '知识点路径': item.nodePath,
      '知识点名称': item.linkedAngleName,
      '笔记': item.note,
      '错题时间': item.createdAt,
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(h => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wrong_answers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredWrongAnswers]);

  const handleSaveNote = useCallback(() => {
    if (!selectedId) return;
    setIsEditing(false);
  }, [selectedId]);

  const stats = useMemo(() => {
    return {
      total: wrongAnswers.length,
      withNotes: wrongAnswers.filter(w => w.note).length,
      thisWeek: wrongAnswers.filter(w => {
        const date = new Date(w.createdAt);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [wrongAnswers]);

  return (
    <div className="h-full flex">
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              错题列表
            </h3>
            <Button variant="outline" size="sm" onClick={handleExportWrongAnswers}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索错题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">按知识点筛选：</span>
            <select
              value={filterNode}
              onChange={(e) => setFilterNode(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="all">全部</option>
              {weakNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Badge variant="outline">
              共 {stats.total} 道错题
            </Badge>
            <Badge variant="secondary">
              本周新增 {stats.thisWeek} 道
            </Badge>
            <Badge variant="outline" className="text-amber-600">
              已笔记 {stats.withNotes} 道
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredWrongAnswers.length > 0 ? (
            <div>
              {filteredWrongAnswers.map((item) => (
                <WrongAnswerItem
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => {
                    setSelectedId(item.id);
                    setEditingNote(item.note);
                    setIsEditing(false);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <CheckCircle2 className="h-16 w-16 text-green-500/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">太棒了！</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterNode !== 'all'
                  ? '没有找到符合条件的错题'
                  : '暂无错题记录，继续保持！'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                笔记编辑
              </h3>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleSaveNote() : setIsEditing(true)}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    编辑
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">题目内容</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedItem.questionContent}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">你的答案</div>
                      <div className="text-2xl font-bold text-red-600">{selectedItem.userAnswer}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">正确答案</div>
                      <div className="text-2xl font-bold text-green-600">{selectedItem.correctAnswer}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      知识点标签
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm py-1.5">
                        {selectedItem.nodePath}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      错题笔记
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="记录你的错题分析、解题思路、相关知识点..."
                        rows={8}
                        className="resize-none"
                      />
                    ) : (
                      <div
                        className={cn(
                          'p-4 rounded-lg min-h-[150px]',
                          editingNote || selectedItem.note
                            ? 'bg-muted'
                            : 'bg-muted/50 text-muted-foreground italic'
                        )}
                        onClick={() => setIsEditing(true)}
                      >
                        {editingNote || selectedItem.note || '点击编辑按钮添加笔记...'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        错题时间：{new Date(selectedItem.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <StickyNote className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">选择错题</h3>
            <p className="text-sm text-muted-foreground">
              点击左侧列表中的错题，查看详情并添加笔记
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
