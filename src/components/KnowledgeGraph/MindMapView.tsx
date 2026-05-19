'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { getPSColor, getPSColorWithFocus } from '@/lib/utils/colors';
import type { KnowledgeNodeRecord } from '@/types';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  node: KnowledgeNodeRecord;
  depth: number;
  collapsedNodes: Set<string>;
  focusMode: boolean;
  selectedNodeId: string | null;
  onToggleCollapse: (nodeId: string) => void;
  onSelectNode: (node: KnowledgeNodeRecord) => void;
}

const NODE_SIZES: Record<string, string> = {
  subject: 'min-w-[140px] px-5 py-3 text-base',
  knowledge: 'min-w-[120px] px-4 py-2.5 text-sm',
  subknowledge: 'min-w-[100px] px-3 py-2 text-xs',
  angle: 'min-w-[90px] px-3 py-2 text-xs',
};

function TreeNode({
  node,
  depth,
  collapsedNodes,
  focusMode,
  selectedNodeId,
  onToggleCollapse,
  onSelectNode,
}: TreeNodeProps) {
  const allNodes = useAppStore(s => s.nodes);
  const getNodeStats = useAppStore(s => s.getNodeStats);
  const practiceRecords = useAppStore(s => s.practiceRecords);

  const children = useMemo(
    () => allNodes.filter(n => n.parent_id === node.id),
    [allNodes, node.id],
  );
  const hasChildren = children.length > 0;
  const isCollapsed = collapsedNodes.has(node.id);

  const hasAnswered = practiceRecords.some(r => r.source_node_ids.includes(node.id));
  const colorConfig = focusMode
    ? getPSColorWithFocus(node.ps_score, focusMode, hasAnswered)
    : getPSColor(node.ps_score, hasAnswered);
  const stats = getNodeStats(node.id);
  const isSelected = selectedNodeId === node.id;

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggleCollapse(node.id);
    } else {
      onSelectNode(node);
    }
  }, [hasChildren, node, onToggleCollapse, onSelectNode]);

  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        onClick={handleClick}
        className={cn(
          'relative rounded-xl cursor-pointer select-none transition-all duration-200',
          'border-2 shadow-md hover:shadow-lg hover:scale-[1.04]',
          NODE_SIZES[node.node_type] || NODE_SIZES.angle,
          isSelected && 'ring-2 ring-offset-2 ring-amber-400 scale-[1.04]',
        )}
        style={{
          backgroundColor: colorConfig.background,
          borderColor: isSelected ? '#fbbf24' : colorConfig.border,
          color: colorConfig.text,
          opacity: colorConfig.opacity,
        }}
      >
        {hasChildren && (
          <span
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-700 text-white text-xs font-bold shadow z-10 hover:bg-slate-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
          >
            {isCollapsed ? '▸' : '▾'}
          </span>
        )}

        <div className="font-semibold leading-tight text-center whitespace-nowrap">
          {node.name}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden min-w-[40px]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(node.ps_score, 200) / 2}%`,
                backgroundColor: colorConfig.text,
                opacity: 0.7,
              }}
            />
          </div>
          <span className="text-[10px] font-bold opacity-80">{node.ps_score}</span>
        </div>

        {(stats.correct > 0 || stats.wrong > 0) && (
          <div className="mt-1 flex gap-1 justify-center">
            {stats.correct > 0 && (
              <span className="text-[9px] bg-green-500/30 text-green-900 dark:text-green-200 px-1 rounded">
                ✓{stats.correct}
              </span>
            )}
            {stats.wrong > 0 && (
              <span className="text-[9px] bg-red-500/30 text-red-900 dark:text-red-200 px-1 rounded">
                ✗{stats.wrong}
              </span>
            )}
          </div>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <div className="relative pt-5">
          <div className="absolute top-0 left-1/2 w-px h-5 bg-slate-300 dark:bg-slate-600" />

          {children.length > 1 && (
            <div
              className="absolute top-0 h-px bg-slate-300 dark:bg-slate-600"
              style={{ left: '10%', right: '10%' }}
            />
          )}

          <div className="flex gap-4 items-start">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
                <TreeNode
                  node={child}
                  depth={depth + 1}
                  collapsedNodes={collapsedNodes}
                  focusMode={focusMode}
                  selectedNodeId={selectedNodeId}
                  onToggleCollapse={onToggleCollapse}
                  onSelectNode={onSelectNode}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface MindMapViewProps {
  collapsedNodes: Set<string>;
  focusMode: boolean;
  selectedNode: KnowledgeNodeRecord | null;
  onToggleCollapse: (nodeId: string) => void;
  onSelectNode: (node: KnowledgeNodeRecord) => void;
  className?: string;
}

export function MindMapView({
  collapsedNodes,
  focusMode,
  selectedNode,
  onToggleCollapse,
  onSelectNode,
  className,
}: MindMapViewProps) {
  const nodes = useAppStore(s => s.nodes);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const rootNodes = useMemo(() => nodes.filter(n => !n.parent_id), [nodes]);

  // Zoom via wheel, centered on cursor
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => {
      const delta = -e.deltaY * 0.001;
      const next = Math.max(0.1, Math.min(3, prev + delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setOffset(o => ({
          x: mx - (mx - o.x) * (next / prev),
          y: my - (my - o.y) * (next / prev),
        }));
      }
      return next;
    });
  }, []);

  // Pan via mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .cursor-pointer')) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging, handleMouseUp]);

  // Zoom buttons
  const zoomIn = useCallback(() => setScale(s => Math.min(3, s + 0.2)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.1, s - 0.2)), []);

  // Fit view
  const fitView = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const tw = content.scrollWidth;
    const th = content.scrollHeight;
    if (tw === 0 || th === 0) return;

    const padding = 80;
    const fitScale = Math.min((cw - padding) / tw, (ch - padding) / th, 1.5);
    const cx = (cw - tw * fitScale) / 2;
    const cy = (ch - th * fitScale) / 2;

    setScale(fitScale);
    setOffset({ x: cx, y: cy });
  }, []);

  // Expose zoom/fit methods
  useEffect(() => {
    (containerRef.current as any)?.__mindMapControls?.(); // noop
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className, dragging && 'cursor-grabbing')}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          willChange: dragging ? 'transform' : 'auto',
        }}
      >
        <div className="flex gap-8 items-start p-12 min-w-max">
          {rootNodes.map(root => (
            <TreeNode
              key={root.id}
              node={root}
              depth={0}
              collapsedNodes={collapsedNodes}
              focusMode={focusMode}
              selectedNodeId={selectedNode?.id || null}
              onToggleCollapse={onToggleCollapse}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-sm font-bold"
          title="放大"
        >+</button>
        <button
          onClick={fitView}
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-xs"
          title="适应视图"
        >⊡</button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-sm font-bold"
          title="缩小"
        >−</button>
        <div className="text-[10px] text-muted-foreground text-center mt-1 select-none">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
