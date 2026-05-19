'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { getPSColor, getPSColorWithFocus } from '@/lib/utils/colors';
import type { KnowledgeNodeRecord } from '@/types';
import { cn } from '@/lib/utils';

const NODE_SIZES: Record<string, string> = {
  subject: 'min-w-[140px] px-5 py-3 text-base',
  knowledge: 'min-w-[120px] px-4 py-2.5 text-sm',
  subknowledge: 'min-w-[100px] px-3 py-2 text-xs',
  angle: 'min-w-[90px] px-3 py-2 text-xs',
};

// ─── Node Block (pure presentational) ───────────────────────────

interface NodeBlockProps {
  node: KnowledgeNodeRecord;
  focusMode: boolean;
  isSelected: boolean;
  isCollapsed: boolean;
  hasChildren: boolean;
  stats: { correct: number; wrong: number };
  onClick: () => void;
  onToggleCollapse: () => void;
}

function NodeBlock({
  node, focusMode, isSelected, isCollapsed, hasChildren, stats,
  onClick, onToggleCollapse,
}: NodeBlockProps) {
  const practiceRecords = useAppStore(s => s.practiceRecords);
  const hasAnswered = practiceRecords.some(r => r.source_node_ids.includes(node.id));
  const colorConfig = focusMode
    ? getPSColorWithFocus(node.ps_score, focusMode, hasAnswered)
    : getPSColor(node.ps_score, hasAnswered);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl cursor-pointer select-none transition-all duration-200 shrink-0',
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
      <div className="font-semibold leading-tight text-center whitespace-nowrap">
        {node.name}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden min-w-[40px]">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(node.ps_score, 200) / 2}%`, backgroundColor: colorConfig.text, opacity: 0.7 }} />
        </div>
        <span className="text-[10px] font-bold opacity-80">{node.ps_score}</span>
      </div>

      {(stats.correct > 0 || stats.wrong > 0) && (
        <div className="mt-1 flex gap-1 justify-center">
          {stats.correct > 0 && <span className="text-[9px] bg-green-500/30 text-green-900 dark:text-green-200 px-1 rounded">✓{stats.correct}</span>}
          {stats.wrong > 0 && <span className="text-[9px] bg-red-500/30 text-red-900 dark:text-red-200 px-1 rounded">✗{stats.wrong}</span>}
        </div>
      )}

      {/* Collapse arrow at bottom-center */}
      {hasChildren && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="w-6 h-5 flex items-center justify-center rounded-b-full bg-slate-600 text-white text-[10px] font-bold shadow hover:bg-slate-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          >
            {isCollapsed ? '▸' : '▾'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Connector lines drawn between a parent and its children ─────

function ConnectorLines({ childCount }: { childCount: number }) {
  if (childCount === 0) return null;
  return (
    <div className="relative h-6 flex items-start justify-center">
      {/* Vertical drop from parent */}
      <div className="absolute top-0 left-1/2 w-px h-3 bg-slate-300 dark:bg-slate-600" />
      {/* Horizontal bar across children */}
      {childCount > 1 && (
        <div className="absolute top-3 h-px bg-slate-300 dark:bg-slate-600"
          style={{ left: '10%', right: '10%' }} />
      )}
      {childCount === 1 && (
        <div className="absolute top-3 w-px h-3 bg-slate-300 dark:bg-slate-600 left-1/2" />
      )}
      {/* Individual drops (rendered per child in parent) */}
    </div>
  );
}

// ─── Recursive Tree Node ────────────────────────────────────────

interface TreeNodeProps {
  node: KnowledgeNodeRecord;
  collapsedNodes: Set<string>;
  focusMode: boolean;
  selectedNodeId: string | null;
  onToggleCollapse: (nodeId: string) => void;
  onSelectNode: (node: KnowledgeNodeRecord) => void;
}

function TreeNode({
  node, collapsedNodes, focusMode, selectedNodeId,
  onToggleCollapse, onSelectNode,
}: TreeNodeProps) {
  const allNodes = useAppStore(s => s.nodes);
  const getNodeStats = useAppStore(s => s.getNodeStats);

  const children = useMemo(
    () => allNodes.filter(n => n.parent_id === node.id),
    [allNodes, node.id],
  );
  const hasChildren = children.length > 0;
  const isCollapsed = collapsedNodes.has(node.id);
  const stats = getNodeStats(node.id);
  const isSelected = selectedNodeId === node.id;

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggleCollapse(node.id);
    } else {
      onSelectNode(node);
    }
  }, [hasChildren, node, onToggleCollapse, onSelectNode]);

  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse(node.id);
  }, [node.id, onToggleCollapse]);

  return (
    <div className="flex flex-col items-center shrink-0">
      <NodeBlock
        node={node}
        focusMode={focusMode}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        hasChildren={hasChildren}
        stats={stats}
        onClick={handleClick}
        onToggleCollapse={handleToggleCollapse}
      />

      {hasChildren && !isCollapsed && (
        <>
          {/* Connector from parent down to children row */}
          <ConnectorLines childCount={children.length} />

          {/* Children row: each child has its own vertical drop line */}
          <div className="relative flex items-start gap-4">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <TreeNode
                  node={child}
                  collapsedNodes={collapsedNodes}
                  focusMode={focusMode}
                  selectedNodeId={selectedNodeId}
                  onToggleCollapse={onToggleCollapse}
                  onSelectNode={onSelectNode}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main View with zoom/pan ────────────────────────────────────

export interface MindMapViewProps {
  collapsedNodes: Set<string>;
  focusMode: boolean;
  selectedNode: KnowledgeNodeRecord | null;
  onToggleCollapse: (nodeId: string) => void;
  onSelectNode: (node: KnowledgeNodeRecord) => void;
  className?: string;
}

export function MindMapView({
  collapsedNodes, focusMode, selectedNode,
  onToggleCollapse, onSelectNode, className,
}: MindMapViewProps) {
  const nodes = useAppStore(s => s.nodes);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const rootNodes = useMemo(() => nodes.filter(n => !n.parent_id), [nodes]);

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

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging, handleMouseUp]);

  const zoomIn = useCallback(() => setScale(s => Math.min(3, s + 0.2)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.1, s - 0.2)), []);

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
        <div className="flex gap-8 items-start justify-center p-12 min-w-max">
          {rootNodes.map(root => (
            <TreeNode
              key={root.id}
              node={root}
              collapsedNodes={collapsedNodes}
              focusMode={focusMode}
              selectedNodeId={selectedNode?.id || null}
              onToggleCollapse={onToggleCollapse}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <button onClick={zoomIn} className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-sm font-bold" title="放大">+</button>
        <button onClick={fitView} className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-xs" title="适应视图">⊡</button>
        <button onClick={zoomOut} className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow border flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors text-sm font-bold" title="缩小">−</button>
        <div className="text-[10px] text-muted-foreground text-center mt-1 select-none">{Math.round(scale * 100)}%</div>
      </div>
    </div>
  );
}
