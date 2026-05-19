'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import { getPSColor, getPSColorWithFocus } from '@/lib/utils/colors';
import { MindMapView } from './MindMapView';
import type { KnowledgeNodeRecord } from '@/types';
import {
  Target,
  Eye,
  EyeOff,
  Info,
  X,
  List,
  BookOpen,
  FileText,
  Edit3,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const GLASS_STYLE = 'shadow-lg backdrop-blur-sm bg-white/80 dark:bg-slate-800/80';

function KnowledgeGraphInner({ onNodeSelect, onTargetedPractice }: {
  onNodeSelect?: (node: KnowledgeNodeRecord) => void;
  onTargetedPractice?: (nodeId: string) => void;
}) {
  const {
    nodes,
    practiceRecords,
    getNodeStats,
    getWrongAnswersByNodeId,
  } = useAppStore();

  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeRecord | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState('');

  const weakNodes = useMemo(
    () => nodes.filter(n => n.ps_score < 80),
    [nodes],
  );

  const hasNodeAnswered = useCallback((nodeId: string): boolean => {
    return practiceRecords.some(r => r.source_node_ids.includes(nodeId));
  }, [practiceRecords]);

  const getNodeWrongCount = useCallback((nodeId: string): number => {
    return getWrongAnswersByNodeId(nodeId).length;
  }, [getWrongAnswersByNodeId]);

  const selectedNodeStats = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeStats(selectedNode.id);
  }, [selectedNode, getNodeStats]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleSelectNode = useCallback((node: KnowledgeNodeRecord) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  const handleStartEditAnnotation = useCallback((node: KnowledgeNodeRecord) => {
    setEditingAnnotation(node.id);
    setAnnotationDraft(node.annotation || '');
  }, []);

  const handleSaveAnnotation = useCallback(() => {
    if (!editingAnnotation) return;
    const node = nodes.find(n => n.id === editingAnnotation);
    if (!node) return;

    useAppStore.getState().updateNode({
      id: editingAnnotation,
      annotation: annotationDraft || undefined,
    });

    if (annotationDraft && annotationDraft !== (node.annotation || '')) {
      try {
        const parts: string[] = [];
        let current: KnowledgeNodeRecord | undefined = nodes.find(n => n.id === editingAnnotation);
        while (current) {
          const c = current;
          parts.unshift(c.name);
          current = c.parent_id ? nodes.find(n => n.id === c.parent_id) : undefined;
        }
        const fullPath = parts.join(' > ');
        useAppStore.getState().addStudyNote({
          id: `note_node_${editingAnnotation}`,
          user_id: 'default_user',
          title: `${node.name} - 学习笔记`,
          content: annotationDraft,
          linked_node_id: editingAnnotation,
          linked_node_name: fullPath,
          tags: [node.node_type],
          color_tag: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[KnowledgeGraph] failed to sync annotation:', err);
      }
    }

    setEditingAnnotation(null);
    setAnnotationDraft('');
  }, [editingAnnotation, annotationDraft, nodes]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Toolbar - top left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="secondary" onClick={handleExpandAll} className={GLASS_STYLE}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>全部展开</TooltipContent>
        </Tooltip>
      </div>

      {/* Focus mode + weak nodes - top right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={focusMode ? 'default' : 'secondary'}
              onClick={() => setFocusMode(prev => !prev)}
              className={cn(GLASS_STYLE, focusMode && 'bg-amber-500 hover:bg-amber-600')}
            >
              {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{focusMode ? '退出焦点模式' : '薄弱点高亮'}</TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="secondary" className={cn(GLASS_STYLE, 'relative')}>
              <Target className="h-4 w-4" />
              {weakNodes.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {weakNodes.length > 9 ? '9+' : weakNodes.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">薄弱知识点</h4>
              <p className="text-xs text-muted-foreground">共 {weakNodes.length} 个知识点掌握度不足</p>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {weakNodes.slice(0, 10).map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleSelectNode(node)}
                      className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
                    >
                      <span className="font-medium">{node.name}</span>
                      <Badge variant="destructive" className="ml-2 text-[10px]">PS: {node.ps_score}</Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Legend - bottom left */}
      <div className={cn('absolute bottom-4 left-4 flex items-center gap-4 rounded-lg px-4 py-2 z-10', GLASS_STYLE)}>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#e5e7eb]" /><span className="text-xs text-muted-foreground">未作答</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#DC2626]" /><span className="text-xs text-muted-foreground">薄弱</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#EA580C]" /><span className="text-xs text-muted-foreground">需加强</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#CA8A04]" /><span className="text-xs text-muted-foreground">学习中</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#0891B2]" /><span className="text-xs text-muted-foreground">熟练</span></div>
      </div>

      {/* Mind Map View */}
      <MindMapView
        collapsedNodes={collapsedNodes}
        focusMode={focusMode}
        selectedNode={selectedNode}
        onToggleCollapse={handleToggleCollapse}
        onSelectNode={handleSelectNode}
        className="h-full w-full"
      />

      {/* Detail Sheet */}
      {selectedNode && (
        <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span>{selectedNode.name}</span>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).background,
                    color: getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).text,
                  }}
                >
                  PS: {selectedNode.ps_score}
                </Badge>
                {selectedNode.node_type === 'angle' && getNodeWrongCount(selectedNode.id) > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    ×{getNodeWrongCount(selectedNode.id)}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">掌握进度</h4>
                <Progress
                  value={(selectedNode.ps_score / 200) * 100}
                  className="h-2"
                  style={{
                    '--progress-foreground': getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).background,
                  } as React.CSSProperties}
                />
                <p className="text-xs text-muted-foreground">
                  {!hasNodeAnswered(selectedNode.id) ? '未作答，点击开始练习'
                    : selectedNode.ps_score < 80 ? '需要加强练习'
                    : selectedNode.ps_score < 150 ? '持续练习中'
                    : '已熟练掌握'}
                </p>
              </div>

              {selectedNode.content && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">知识点说明</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedNode.content}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">学习笔记</h4>
                  {editingAnnotation !== selectedNode.id && (
                    <Button variant="ghost" size="sm" onClick={() => handleStartEditAnnotation(selectedNode)}>
                      <Edit3 className="h-3 w-3 mr-1" />
                      {selectedNode.annotation ? '编辑' : '添加笔记'}
                    </Button>
                  )}
                </div>
                {editingAnnotation === selectedNode.id ? (
                  <div className="space-y-2">
                    <Textarea value={annotationDraft} onChange={e => setAnnotationDraft(e.target.value)}
                      placeholder="输入学习笔记..." rows={4} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveAnnotation}><Check className="h-3 w-3 mr-1" />保存</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingAnnotation(null); setAnnotationDraft(''); }}>
                        <X className="h-3 w-3 mr-1" />取消
                      </Button>
                    </div>
                  </div>
                ) : selectedNode.annotation ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400 italic">{selectedNode.annotation}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">暂无笔记，点击"添加笔记"开始记录</p>
                )}
              </div>

              {selectedNodeStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedNodeStats.correct}</div>
                    <div className="text-xs text-green-600/70">正确次数</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedNodeStats.wrong}</div>
                    <div className="text-xs text-red-600/70">错误次数</div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium">操作</h4>
                <div className="flex gap-2">
                  {onTargetedPractice && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        onTargetedPractice(selectedNode.id);
                        setSelectedNode(null);
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      靶向练习
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function WrongAnswerList({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const { getWrongAnswersByNodeId, questionBank, getNodeById } = useAppStore();
  const wrongAnswers = getWrongAnswersByNodeId(nodeId);
  const node = getNodeById(nodeId);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="absolute right-4 top-4 bottom-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border overflow-hidden flex flex-col z-50">
      <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-slate-500" />
          <span className="font-semibold">{node?.name} - 错题列表</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {wrongAnswers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>暂无错题记录</p>
            </div>
          ) : (
            wrongAnswers.map(record => {
              const question = questionBank.find(q => q.id === record.question_id);
              return (
                <div key={record.question_id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm">{question?.content || '已删除题目'}</p>
                  <Badge variant={record.is_correct ? 'default' : 'destructive'} className="text-[10px]">
                    {record.is_correct ? '正确' : '错误'}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(record.updated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

interface KnowledgeGraphProps {
  onNodeSelect?: (node: KnowledgeNodeRecord) => void;
  onTargetedPractice?: (nodeId: string) => void;
  autoShowWrongAnswer?: boolean;
}

export function KnowledgeGraph({ onNodeSelect, onTargetedPractice, autoShowWrongAnswer = false }: KnowledgeGraphProps) {
  const { isInitialized, nodes } = useAppStore();

  if (!isInitialized || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted animate-pulse" />
          <p className="text-muted-foreground">加载知识图谱...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <KnowledgeGraphInner onNodeSelect={onNodeSelect} onTargetedPractice={onTargetedPractice} />
    </TooltipProvider>
  );
}
