'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import { getPSColor, getPSColorWithFocus } from '@/lib/utils/colors';
import type { KnowledgeNodeRecord } from '@/types';
import {
  ZoomIn, ZoomOut, Maximize2,
  Target, Eye, EyeOff, X, List, BookOpen, Edit3, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const GLASS_STYLE = 'shadow-lg backdrop-blur-sm bg-white/80 dark:bg-slate-800/80';

const SIZE_MAP: Record<string, number> = {
  subject: 48, knowledge: 40, subknowledge: 34, angle: 30,
};

export function KnowledgeGraph({ onNodeSelect, onTargetedPractice }: {
  onNodeSelect?: (node: KnowledgeNodeRecord) => void;
  onTargetedPractice?: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const {
    nodes, isInitialized, practiceRecords,
    getNodeStats, getWrongAnswersByNodeId,
  } = useAppStore();

  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeRecord | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { useAppStore.getState().initialize(); }, []);

  const nodeStatsCache = useMemo(() => {
    const cache = new Map<string, { correct: number; wrong: number; wrongCount: number; hasAnswered: boolean }>();
    nodes.forEach(node => {
      const stats = getNodeStats(node.id);
      const wrongCount = getWrongAnswersByNodeId(node.id).length;
      const hasAnswered = practiceRecords.some(r => r.source_node_ids.includes(node.id));
      cache.set(node.id, { ...stats, wrongCount, hasAnswered });
    });
    return cache;
  }, [nodes, getNodeStats, getWrongAnswersByNodeId, practiceRecords]);

  const hasNodeAnswered = useCallback((nodeId: string) => nodeStatsCache.get(nodeId)?.hasAnswered ?? false, [nodeStatsCache]);
  const getNodeWrongCount = useCallback((nodeId: string) => nodeStatsCache.get(nodeId)?.wrongCount ?? 0, [nodeStatsCache]);
  const weakNodes = useMemo(() => nodes.filter(n => n.ps_score < 80), [nodes]);

  // ── Build mindmap tree data with depth & index ──
  const graphData = useMemo(() => {
    if (!nodes.length) return { id: 'dummy', children: [] };

    const childrenMap = new Map<string, KnowledgeNodeRecord[]>();
    nodes.forEach(n => {
      if (n.parent_id) { const list = childrenMap.get(n.parent_id) || []; list.push(n); childrenMap.set(n.parent_id, list); }
    });

    console.log('[KnowledgeGraph] nodes sample:', nodes.slice(0, 5).map(n => ({
      id: n.id, name: n.name, parent_id: n.parent_id, type: n.node_type,
    })));
    console.log('[KnowledgeGraph] root nodes:', nodes.filter(n => !n.parent_id).map(n => n.name));

    function buildTreeNode(n: KnowledgeNodeRecord, depth: number, index: number): any {
      const cached = nodeStatsCache.get(n.id);
      const hasAnswered = cached?.hasAnswered ?? false;
      const color = focusMode ? getPSColorWithFocus(n.ps_score, focusMode, hasAnswered) : getPSColor(n.ps_score, hasAnswered);
      const kidList = childrenMap.get(n.id) || [];
      const children = kidList.map((k, i) => buildTreeNode(k, depth + 1, i));
      const side = index % 2 === 0 ? 'right' : 'left';

      return {
        id: n.id,
        depth,
        index,
        side,
        data: {
          label: n.name,
          psScore: n.ps_score,
          nodeType: n.node_type,
          bgColor: color.background,
          borderColor: color.border,
          textColor: color.text,
          opacity: color.opacity,
          stats: { correct: cached?.correct ?? 0, wrong: cached?.wrong ?? 0 },
          hasAnswered,
          depth,
          index,
          side,
        },
        style: {
          size: SIZE_MAP[n.node_type] ?? 30,
          fill: color.background,
          stroke: color.border,
          lineWidth: 2,
          radius: 10,
          labelText: n.name,
          labelFill: color.text,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelMaxWidth: 100,
          labelWordWrap: true,
          opacity: color.opacity,
        },
        children: children.length > 0 ? children : undefined,
      };
    }

    const roots = nodes.filter(n => !n.parent_id);
    if (roots.length === 1) {
      return buildTreeNode(roots[0], 0, 0);
    }
    // Multiple roots → wrap in virtual root
    return {
      id: 'virtual_root',
      depth: 0,
      index: 0,
      side: 'right',
      data: { label: '', nodeType: 'root', bgColor: 'transparent', borderColor: 'transparent', textColor: 'transparent', opacity: 0, psScore: 0, stats: { correct: 0, wrong: 0 }, hasAnswered: false, depth: 0, index: 0, side: 'right' },
      style: { size: 1, fill: 'transparent', stroke: 'transparent', lineWidth: 0, radius: 0, labelText: '', opacity: 0 },
      children: roots.map((r, i) => buildTreeNode(r, 1, i)),
    };
  }, [nodes, focusMode, nodeStatsCache]);

  // ── Init TreeGraph ──
  useEffect(() => {
    if (!containerRef.current || !isInitialized || nodes.length === 0) return;
    let mounted = true;

    (async () => {
      try { if (graphRef.current) { graphRef.current.destroy(); graphRef.current = null; } } catch {}

      const { Graph } = await import('@antv/g6');

      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      const graph = new Graph({
        container: containerRef.current!,
        data: graphData,
        node: {
          style: {
            size: (d: any) => SIZE_MAP[d.data?.nodeType] ?? 30,
            fill: (d: any) => d.data?.bgColor || '#3b82f6',
            stroke: (d: any) => d.data?.borderColor || '#2563eb',
            lineWidth: 2,
            radius: 10,
            labelText: (d: any) => d.data?.label || '',
            labelFill: (d: any) => d.data?.textColor || '#fff',
            labelFontSize: 11,
            labelFontWeight: 600,
            labelMaxWidth: 100,
            labelWordWrap: true,
            opacity: (d: any) => d.data?.opacity ?? 1,
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowBlur: 6,
            shadowOffsetY: 2,
          },
          state: {
            hover: { lineWidth: 3, shadowBlur: 12 },
            selected: { lineWidth: 4, shadowBlur: 16, shadowColor: '#fbbf24' },
          },
        },
        edge: {
          type: 'cubic-horizontal',
          style: {
            stroke: '#94a3b8',
            lineWidth: 1.5,
          },
        },
        layout: {
          type: 'mindmap',
          direction: 'H',
          getSide: (d: any) => d.data?.side || 'right',
          getHeight: () => 50,
          getWidth: (d: any) => {
            const t = d.data?.nodeType;
            if (t === 'subject') return 140;
            if (t === 'knowledge') return 120;
            if (t === 'subknowledge') return 100;
            return 90;
          },
          getVGap: () => 12,
          getHGap: () => 30,
        },
        behaviors: [
          'drag-canvas',
          'zoom-canvas',
          'collapse-expand',
        ],
        padding: 80,
      });

      graph.on('node:click', (evt: any) => {
        const nodeId = evt?.target?.id;
        if (!nodeId) return;
        if (nodeId === 'virtual_root') return;
        const node = nodeMap.get(nodeId);
        if (!node) return;
        setSelectedNode(node);
        onNodeSelect?.(node);
      });

      graph.on('afterrender', () => {
        try { graph.fitView(); } catch {}
      });

      graphRef.current = graph;
      if (mounted) setIsReady(true);
    })();

    return () => { mounted = false; try { graphRef.current?.destroy(); graphRef.current = null; } catch {} };
  }, [isInitialized, nodes.length]);

  // ── Re-render on data change ──
  useEffect(() => {
    if (!graphRef.current || !isReady) return;
    try {
      graphRef.current.setData(graphData);
      graphRef.current.render();
      graphRef.current.fitView();
    } catch {}
  }, [graphData, isReady]);

  // ── Zoom / Fit ──
  const handleZoomIn = useCallback(() => { try { graphRef.current?.zoomTo((graphRef.current.getZoom() || 1) * 1.2); } catch {} }, []);
  const handleZoomOut = useCallback(() => { try { graphRef.current?.zoomTo((graphRef.current.getZoom() || 1) / 1.2); } catch {} }, []);
  const handleFitView = useCallback(() => { try { graphRef.current?.fitView(); } catch {} }, []);

  // ── Annotation sync ──
  const handleStartEditAnnotation = useCallback((node: KnowledgeNodeRecord) => {
    setEditingAnnotation(node.id); setAnnotationDraft(node.annotation || '');
  }, []);
  const handleSaveAnnotation = useCallback(() => {
    if (!editingAnnotation) return;
    const node = nodes.find(n => n.id === editingAnnotation);
    if (!node) return;
    useAppStore.getState().updateNode({ id: editingAnnotation, annotation: annotationDraft || undefined });
    if (annotationDraft && annotationDraft !== (node.annotation || '')) {
      try {
        const parts: string[] = [];
        let cur: KnowledgeNodeRecord | undefined = nodes.find(n => n.id === editingAnnotation);
        while (cur) { const c = cur; parts.unshift(c.name); cur = c.parent_id ? nodes.find(n => n.id === c.parent_id) : undefined; }
        useAppStore.getState().addStudyNote({
          id: `note_node_${editingAnnotation}`, user_id: 'default_user',
          title: `${node.name} - 学习笔记`, content: annotationDraft,
          linked_node_id: editingAnnotation, linked_node_name: parts.join(' > '),
          tags: [node.node_type], color_tag: 'default',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
      } catch (err) { console.error('[KG] sync annotation failed:', err); }
    }
    setEditingAnnotation(null); setAnnotationDraft('');
  }, [editingAnnotation, annotationDraft, nodes]);

  const selectedNodeStats = useMemo(() => selectedNode ? getNodeStats(selectedNode.id) : null, [selectedNode, getNodeStats]);

  if (!isInitialized || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted animate-pulse" />
          <p className="text-muted-foreground">加载知识图谱...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="relative h-full w-full bg-slate-50 dark:bg-slate-950">
        <div ref={containerRef} className="h-full w-full" />

        {/* Toolbar — top left */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="secondary" onClick={handleZoomIn} className={GLASS_STYLE}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>放大</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="secondary" onClick={handleZoomOut} className={GLASS_STYLE}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>缩小</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="secondary" onClick={handleFitView} className={GLASS_STYLE}><Maximize2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>适应视图</TooltipContent></Tooltip>
        </div>

        {/* Focus + Weak nodes — top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Tooltip><TooltipTrigger asChild>
            <Button size="icon" variant={focusMode ? 'default' : 'secondary'} onClick={() => setFocusMode(p => !p)} className={cn(GLASS_STYLE, focusMode && 'bg-amber-500 hover:bg-amber-600')}>
              {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </TooltipTrigger><TooltipContent>{focusMode ? '退出焦点模式' : '薄弱点高亮'}</TooltipContent></Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="secondary" className={cn(GLASS_STYLE, 'relative')}>
                <Target className="h-4 w-4" />
                {weakNodes.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{weakNodes.length > 9 ? '9+' : weakNodes.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-2"><h4 className="font-semibold text-sm">薄弱知识点</h4><p className="text-xs text-muted-foreground">共 {weakNodes.length} 个知识点掌握度不足</p>
                <ScrollArea className="h-32"><div className="space-y-1">
                  {weakNodes.slice(0, 10).map(node => (
                    <button key={node.id} onClick={() => { setSelectedNode(node); onNodeSelect?.(node); }} className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent">
                      <span className="font-medium">{node.name}</span><Badge variant="destructive" className="ml-2 text-[10px]">PS: {node.ps_score}</Badge>
                    </button>
                  ))}
                </div></ScrollArea></div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Legend */}
        <div className={cn('absolute bottom-4 left-4 flex items-center gap-3 rounded-lg px-4 py-2 z-10', GLASS_STYLE)}>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#e5e7eb]" /><span className="text-[11px] text-muted-foreground">未作答</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#DC2626]" /><span className="text-[11px] text-muted-foreground">薄弱</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#EA580C]" /><span className="text-[11px] text-muted-foreground">需加强</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#CA8A04]" /><span className="text-[11px] text-muted-foreground">学习中</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#0891B2]" /><span className="text-[11px] text-muted-foreground">熟练</span></div>
        </div>

        {/* Detail Sheet */}
        {selectedNode && (
          <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span>{selectedNode.name}</span>
                  <Badge variant="outline" style={{ backgroundColor: getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).background, color: getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).text }}>PS: {selectedNode.ps_score}</Badge>
                  {selectedNode.node_type === 'angle' && getNodeWrongCount(selectedNode.id) > 0 && <Badge variant="destructive" className="text-[10px]">×{getNodeWrongCount(selectedNode.id)}</Badge>}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">掌握进度</h4>
                  <Progress value={(selectedNode.ps_score / 200) * 100} className="h-2" style={{ '--progress-foreground': getPSColor(selectedNode.ps_score, hasNodeAnswered(selectedNode.id)).background } as React.CSSProperties} />
                  <p className="text-xs text-muted-foreground">{!hasNodeAnswered(selectedNode.id) ? '未作答' : selectedNode.ps_score < 80 ? '需要加强' : selectedNode.ps_score < 150 ? '持续练习中' : '已熟练'}</p>
                </div>
                {selectedNode.content && <div className="space-y-2"><h4 className="text-sm font-medium">知识点说明</h4><p className="text-sm text-muted-foreground leading-relaxed">{selectedNode.content}</p></div>}
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><h4 className="text-sm font-medium">学习笔记</h4>{editingAnnotation !== selectedNode.id && <Button variant="ghost" size="sm" onClick={() => handleStartEditAnnotation(selectedNode)}><Edit3 className="h-3 w-3 mr-1" />{selectedNode.annotation ? '编辑' : '添加笔记'}</Button>}</div>
                  {editingAnnotation === selectedNode.id ? (
                    <div className="space-y-2"><Textarea value={annotationDraft} onChange={e => setAnnotationDraft(e.target.value)} placeholder="输入学习笔记..." rows={4} autoFocus /><div className="flex gap-2"><Button size="sm" onClick={handleSaveAnnotation}><Check className="h-3 w-3 mr-1" />保存</Button><Button size="sm" variant="outline" onClick={() => { setEditingAnnotation(null); setAnnotationDraft(''); }}><X className="h-3 w-3 mr-1" />取消</Button></div></div>
                  ) : selectedNode.annotation ? <p className="text-sm text-amber-600 dark:text-amber-400 italic">{selectedNode.annotation}</p> : <p className="text-sm text-muted-foreground italic">暂无笔记</p>}
                </div>
                {selectedNodeStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedNodeStats.correct}</div><div className="text-xs text-green-600/70">正确次数</div></div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedNodeStats.wrong}</div><div className="text-xs text-red-600/70">错误次数</div></div>
                  </div>
                )}
                <div className="space-y-2 pt-2 border-t"><h4 className="text-sm font-medium">操作</h4><div className="flex gap-2">{onTargetedPractice && <Button className="flex-1" onClick={() => { onTargetedPractice(selectedNode.id); setSelectedNode(null); }}><Target className="h-4 w-4 mr-2" />靶向练习</Button>}</div></div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </TooltipProvider>
  );
}
