'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  ChevronDown,
  RefreshCw,
  ListTodo,
  StickyNote,
  PanelRightClose,
  PanelRightOpen,
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
  isExpanded: boolean;
  onToggle: () => void;
}

function WrongAnswerItem({ item, isSelected, onSelect, isExpanded, onToggle }: WrongAnswerItemProps) {
  return (
    <div
      className={cn(
        'border-b transition-colors cursor-pointer',
        isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/50'
      )}
    >
      <div
        className="flex items-center justify-between p-3"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-1">{item.questionContent}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <XCircle className="h-2.5 w-2.5 mr-0.5" />
                错
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate">
                {item.nodePath.split(' / ').pop()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 space-y-2 bg-muted/30">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">你的答案：</span>
                  <Badge variant="outline" className="text-red-500 border-red-200 ml-1">
                    {item.userAnswer}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">正确答案：</span>
                  <Badge variant="outline" className="text-green-500 border-green-200 ml-1">
                    {item.correctAnswer}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.questionContent}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WrongAnswerNotebook() {
  const { practiceRecords, nodes, questionBank, updateNodeAnnotation } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNode, setFilterNode] = useState<string>('all');
  const [editingNote, setEditingNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<{ [key: string]: string }>({});
  const notePanelRef = useRef<HTMLDivElement>(null);

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
        userAnswer: record.selected_answer || '未记录',
        nodePath: linkedNode ? getNodePath(linkedNode.id) : '未分类',
        linkedAngleId: question?.linkedAngleId || '',
        linkedAngleName: linkedNode?.name || '未分类',
        note: localNotes[record.id] || '',
        createdAt: record.updated_at,
      } as WrongAnswerNote;
    }).reverse();
  }, [practiceRecords, questionBank, nodes, localNotes]);

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

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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
    setLocalNotes(prev => ({ ...prev, [selectedId]: editingNote }));
    setIsEditing(false);
  }, [selectedId, editingNote]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedId(id);
    const item = wrongAnswers.find(w => w.id === id);
    if (item) {
      setEditingNote(item.note);
      setIsEditing(false);
    }
    if (!showNotePanel) {
      setShowNotePanel(true);
    }
  }, [wrongAnswers, showNotePanel]);

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

  useEffect(() => {
    if (selectedId) {
      setExpandedItems(prev => {
        const next = new Set(prev);
        next.add(selectedId);
        return next;
      });
    }
  }, [selectedId]);

  return (
    <div className="h-full flex">
      <div className={cn("flex flex-col", showNotePanel ? "w-1/2" : "w-full")}>
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <h3 className="font-semibold text-sm">错题列表</h3>
              <Badge variant="outline" className="text-xs">{stats.total}</Badge>
            </div>
            <div className="flex items-center gap-1">
              {selectedItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotePanel(!showNotePanel)}
                  className="h-7 px-2"
                >
                  {showNotePanel ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportWrongAnswers} className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                导出
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索错题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>

          <select
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
            className="w-full text-xs border rounded px-2 py-1.5 bg-background"
          >
            <option value="all">全部知识点</option>
            {weakNodes.map(node => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>

        <ScrollArea className="flex-1">
          {filteredWrongAnswers.length > 0 ? (
            <div>
              {filteredWrongAnswers.map((item) => (
                <WrongAnswerItem
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => handleSelectItem(item.id)}
                  isExpanded={expandedItems.has(item.id)}
                  onToggle={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <CheckCircle2 className="h-12 w-12 text-green-500/30 mb-3" />
              <h3 className="text-base font-medium mb-1">太棒了！</h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery || filterNode !== 'all'
                  ? '没有找到符合条件的错题'
                  : '暂无错题记录，继续保持！'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <AnimatePresence>
        {showNotePanel && selectedItem && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l flex flex-col bg-background"
          >
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                <h3 className="font-semibold text-sm">错题笔记</h3>
              </div>
              <Button
                variant={isEditing ? 'default' : 'ghost'}
                size="sm"
                onClick={() => isEditing ? handleSaveNote() : setIsEditing(true)}
                className="h-7 text-xs"
              >
                {isEditing ? (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    编辑
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="flex-1" ref={notePanelRef}>
              <div className="p-4 space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {selectedItem.questionContent}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">你的：</span>
                    <Badge variant="outline" className="text-red-500 border-red-200">
                      {selectedItem.userAnswer}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">正确：</span>
                    <Badge variant="outline" className="text-green-500 border-green-200">
                      {selectedItem.correctAnswer}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  <span className="truncate">{selectedItem.nodePath}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    笔记内容
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      placeholder="记录解题思路、相关知识点、易错点..."
                      rows={10}
                      className="resize-none text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                      className={cn(
                        'min-h-[200px] p-3 rounded-lg border cursor-text',
                        editingNote || selectedItem.note
                          ? 'bg-muted border-transparent'
                          : 'bg-muted/30 border-dashed text-muted-foreground'
                      )}
                      onClick={() => setIsEditing(true)}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {editingNote || selectedItem.note || '点击此处编辑笔记...'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(selectedItem.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedItem && showNotePanel && (
        <div className="w-1/2 border-l flex items-center justify-center text-center p-6 bg-muted/30">
          <div>
            <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              选择一道错题查看详情并添加笔记
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
