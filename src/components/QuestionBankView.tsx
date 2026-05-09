'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { KnowledgeNode, QuestionBankItem, QuestionOption } from '@/lib/types';
import { useAppState, getAllAngles } from '@/lib/store';
import { createId } from '@/lib/sample-data';
import { cn } from '@/lib/utils';
import {
  Database,
  Upload,
  Trash2,
  Search,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Plus,
  FileJson,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Knowledge Tree Filter (for filtering by knowledge path) ---
function KnowledgeFilter({
  mindMap,
  selectedPath,
  onPathChange,
  questionCounts,
}: {
  mindMap: KnowledgeNode;
  selectedPath: string[];
  onPathChange: (path: string[]) => void;
  questionCounts: Record<string, number>;
}) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
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
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5 shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
            >
              {count}
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
    <ScrollArea className="h-[300px]">
      <div className="py-1">
        {renderNode(mindMap, 0)}
      </div>
    </ScrollArea>
  );
}

// --- Single question detail card ---
function QuestionDetailCard({
  item,
  onDelete,
}: {
  item: QuestionBankItem;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-3 transition-all hover:shadow-sm">
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <button type="button" className="mt-0.5 shrink-0 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
            {item.content}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-5">
              {item.linkedAngleName}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] h-5',
                item.source === 'mindmap-inline' && 'bg-purple-50 text-purple-700',
                item.source === 'upload' && 'bg-green-50 text-green-700',
                item.source === 'practice' && 'bg-blue-50 text-blue-700',
                item.source === 'exam' && 'bg-orange-50 text-orange-700',
              )}
            >
              {item.source === 'mindmap-inline' && '导图例题'}
              {item.source === 'upload' && '上传'}
              {item.source === 'practice' && '练习'}
              {item.source === 'exam' && '套卷'}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-red-400 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {item.options.map((opt) => (
              <div
                key={opt.label}
                className={cn(
                  'text-xs px-2 py-1.5 rounded',
                  opt.label === item.correctAnswer
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 font-medium'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500',
                )}
              >
                {opt.label}. {opt.text}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            正确答案：<span className="text-green-600 font-medium">{item.correctAnswer}</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
            {item.explanation}
          </div>
          <div className="text-[10px] text-gray-400">
            路径：{item.knowledgePath} · 添加时间：{item.createdAt}
          </div>
        </div>
      )}
    </Card>
  );
}

// --- Add question form ---
function AddQuestionForm({
  mindMap,
  onSubmit,
  onCancel,
}: {
  mindMap: KnowledgeNode;
  onSubmit: (item: QuestionBankItem) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [selectedAngleId, setSelectedAngleId] = useState('');
  const [selectedAngleName, setSelectedAngleName] = useState('');
  const [knowledgePath, setKnowledgePath] = useState('');

  const angles = useMemo(() => getAllAngles(mindMap), [mindMap]);

  const handleAngleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedAngleId(id);
      const angle = angles.find((a) => a.id === id);
      if (angle) {
        setSelectedAngleName(angle.name);
        // Build path
        function findPath(node: KnowledgeNode, target: string, path: string[]): string[] | null {
          if (node.id === target) return [...path, node.name];
          for (const child of node.children) {
            const result = findPath(child, target, [...path, node.name]);
            if (result) return result;
          }
          return null;
        }
        const p = findPath(mindMap, id, []);
        setKnowledgePath(p ? p.join('/') : '');
      }
    },
    [angles, mindMap],
  );

  const handleSubmit = useCallback(() => {
    if (!content || !optionA || !optionB || !selectedAngleId) return;

    const options: QuestionOption[] = [
      { label: 'A', text: optionA },
      { label: 'B', text: optionB },
    ];
    if (optionC) options.push({ label: 'C', text: optionC });
    if (optionD) options.push({ label: 'D', text: optionD });

    onSubmit({
      id: createId(),
      content,
      options,
      correctAnswer,
      explanation,
      linkedAngleId: selectedAngleId,
      linkedAngleName: selectedAngleName,
      knowledgePath,
      source: 'upload',
      createdAt: new Date().toISOString(),
    });
  }, [content, optionA, optionB, optionC, optionD, correctAnswer, explanation, selectedAngleId, selectedAngleName, knowledgePath, onSubmit]);

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">手动添加题目</h3>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">题目内容</label>
        <textarea
          className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 min-h-[60px] resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入题目内容..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">选项A</label>
          <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="选项A" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">选项B</label>
          <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="选项B" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">选项C</label>
          <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} placeholder="可选" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">选项D</label>
          <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} placeholder="可选" />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">正确答案</label>
          <select
            className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div className="flex-[2]">
          <label className="text-xs text-gray-500 mb-1 block">关联考点</label>
          <select
            className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
            value={selectedAngleId}
            onChange={handleAngleSelect}
          >
            <option value="">选择考点...</option>
            {angles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">解析</label>
        <textarea
          className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 min-h-[40px] resize-y"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="输入题目解析..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button
          size="sm"
          disabled={!content || !optionA || !optionB || !selectedAngleId}
          onClick={handleSubmit}
        >
          添加到题库
        </Button>
      </div>
    </Card>
  );
}

// --- Main Question Bank View ---
export default function QuestionBankView() {
  const { state, dispatch } = useAppState();
  const bank = state.questionBank ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Count questions under each node
  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    function countForNode(node: KnowledgeNode): number {
      let total = bank.filter((q: QuestionBankItem) => q.linkedAngleId === node.id).length;
      for (const child of node.children) {
        total += countForNode(child);
      }
      counts[node.id] = total;
      return total;
    }
    countForNode(state.mindMap);
    return counts;
  }, [state.mindMap, bank]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = [...bank];

    // Filter by knowledge path
    if (selectedPath.length > 0) {
      const selectedNodeId = selectedPath[selectedPath.length - 1];
      function getDescendantIds(node: KnowledgeNode): string[] {
        const ids = [node.id];
        for (const child of node.children) {
          ids.push(...getDescendantIds(child));
        }
        return ids;
      }
      function findNode(root: KnowledgeNode, id: string): KnowledgeNode | null {
        if (root.id === id) return root;
        for (const child of root.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
        return null;
      }
      const selectedNode = findNode(state.mindMap, selectedNodeId);
      if (selectedNode) {
        const descendantIds = new Set(getDescendantIds(selectedNode));
        result = result.filter((q: QuestionBankItem) => descendantIds.has(q.linkedAngleId));
      }
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      result = result.filter((q: QuestionBankItem) => q.source === sourceFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q: QuestionBankItem) =>
          q.content.toLowerCase().includes(query) ||
          q.knowledgePath.toLowerCase().includes(query) ||
          q.linkedAngleName.toLowerCase().includes(query),
      );
    }

    return result;
  }, [bank, selectedPath, sourceFilter, searchQuery, state.mindMap]);

  const handleDelete = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_QUESTION_BANK_ITEM', payload: id });
    },
    [dispatch],
  );

  const handleAddQuestion = useCallback(
    (item: QuestionBankItem) => {
      dispatch({ type: 'ADD_QUESTION_BANK_ITEMS', payload: [item] });
      setShowAddForm(false);
    },
    [dispatch],
  );

  // Upload JSON
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const data = JSON.parse(text);

          // Support both array format and object with questions field
          let items: QuestionBankItem[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (data.questions && Array.isArray(data.questions)) {
            items = data.questions;
          }

          // Validate and add
          const validItems = items.filter(
            (item: QuestionBankItem) =>
              item.content && item.options && item.correctAnswer && item.linkedAngleId,
          );

          if (validItems.length === 0) {
            alert('未找到有效的题目数据。请确保JSON格式正确，包含 content、options、correctAnswer、linkedAngleId 字段。');
            return;
          }

          // Add source tag and ensure IDs
          const tagged = validItems.map((item: QuestionBankItem) => ({
            ...item,
            id: item.id || createId(),
            source: item.source || 'upload',
            createdAt: item.createdAt || new Date().toISOString(),
          }));

          dispatch({ type: 'ADD_QUESTION_BANK_ITEMS', payload: tagged });
          alert(`成功导入 ${tagged.length} 道题目！`);
        } catch {
          alert('JSON解析失败，请检查文件格式。');
        }
      };
      reader.readAsText(file);
      // Reset file input
      e.target.value = '';
    },
    [dispatch],
  );

  // Export question bank
  const handleExport = useCallback(() => {
    const data = JSON.stringify(bank, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-bank.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [bank]);

  // Source distribution
  const sourceStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const q of bank) {
      stats[q.source] = (stats[q.source] || 0) + 1;
    }
    return stats;
  }, [bank]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-900 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">题库管理</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            共 {bank.length} 题
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(sourceStats).map(([source, count]) => (
            <Badge
              key={source}
              variant="secondary"
              className={cn(
                'text-[10px]',
                source === 'mindmap-inline' && 'bg-purple-50 text-purple-700',
                source === 'upload' && 'bg-green-50 text-green-700',
                source === 'practice' && 'bg-blue-50 text-blue-700',
                source === 'exam' && 'bg-orange-50 text-orange-700',
              )}
            >
              {source === 'mindmap-inline' && '导图例题'}
              {source === 'upload' && '上传题目'}
              {source === 'practice' && '练习添加'}
              {source === 'exam' && '套卷添加'}
              {' '}{count}
            </Badge>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {showAddForm ? '收起表单' : '手动添加'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleUploadClick}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            上传JSON
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1" />
            导出题库
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Add question form */}
        {showAddForm && (
          <AddQuestionForm
            mindMap={state.mindMap}
            onSubmit={handleAddQuestion}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Search and filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              className="pl-8 text-sm"
              placeholder="搜索题目内容、知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-800 dark:border-gray-700"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">全部来源</option>
            <option value="mindmap-inline">导图例题</option>
            <option value="upload">上传题目</option>
            <option value="practice">练习添加</option>
            <option value="exam">套卷添加</option>
          </select>
        </div>

        {/* Selected path display */}
        {selectedPathNames.length > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400">筛选：</span>
            {selectedPathNames.map((name, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-3 w-3 text-blue-400" />}
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{name}</span>
              </React.Fragment>
            ))}
            <span className="text-xs text-blue-500 ml-1">({filteredQuestions.length}题)</span>
            <button
              type="button"
              className="ml-auto text-xs text-blue-500 hover:text-blue-700"
              onClick={() => setSelectedPath([])}
            >
              清除
            </button>
          </div>
        )}
      </div>

      {/* Main content: filter tree + question list */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Knowledge filter tree */}
        <div className="w-56 border-r bg-white dark:bg-gray-900 shrink-0 flex flex-col">
          <div className="px-3 py-2 border-b shrink-0">
            <p className="text-xs font-medium text-gray-500">按知识点筛选</p>
          </div>
          <KnowledgeFilter
            mindMap={state.mindMap}
            selectedPath={selectedPath}
            onPathChange={setSelectedPath}
            questionCounts={questionCounts}
          />
        </div>

        {/* Right: Question list */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2 max-w-3xl mx-auto">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {bank.length === 0
                    ? '题库暂无题目，点击"手动添加"或"上传JSON"添加题目'
                    : '没有匹配的题目，请调整筛选条件'}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q: QuestionBankItem) => (
                <QuestionDetailCard key={q.id} item={q} onDelete={handleDelete} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
