'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { KnowledgeNode, NodeType } from '@/lib/types';
import { useAppState } from '@/lib/store';
import { getWrongColor, getWrongTextColor } from '@/lib/color-utils';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Node type config ---
const NODE_TYPE_CONFIG: Record<
  NodeType,
  { label: string; icon: React.ElementType; defaultBg: string; defaultBorder: string }
> = {
  subject: {
    label: '科目',
    icon: BookOpen,
    defaultBg: 'bg-blue-50 dark:bg-blue-950',
    defaultBorder: 'border-blue-300 dark:border-blue-700',
  },
  knowledge: {
    label: '知识点',
    icon: Brain,
    defaultBg: 'bg-indigo-50 dark:bg-indigo-950',
    defaultBorder: 'border-indigo-300 dark:border-indigo-700',
  },
  subknowledge: {
    label: '子知识点',
    icon: Target,
    defaultBg: 'bg-violet-50 dark:bg-violet-950',
    defaultBorder: 'border-violet-300 dark:border-violet-700',
  },
  angle: {
    label: '出题角度',
    icon: Lightbulb,
    defaultBg: 'bg-amber-50 dark:bg-amber-950',
    defaultBorder: 'border-amber-300 dark:border-amber-700',
  },
};

interface TreeNodeProps {
  node: KnowledgeNode;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  highlightedPath?: Set<string>;
  showQuestions: boolean;
  depth: number;
}

function TreeNodeComponent({
  node,
  expandedNodes,
  onToggleExpand,
  highlightedPath,
  showQuestions,
  depth,
}: TreeNodeProps) {
  const { getNodeStats, isPathLitUp } = useAppState();
  const hasChildren = node.children.length > 0;
  const hasQuestions = node.questions.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const stats = getNodeStats(node.id);
  const config = NODE_TYPE_CONFIG[node.type];
  const IconComponent = config.icon;

  const isOnHighlightedPath = highlightedPath ? highlightedPath.has(node.id) : false;
  const isLitUp = isPathLitUp(node);
  const wrongColor = getWrongColor(stats.wrongCount);
  const wrongTextColor = getWrongTextColor(stats.wrongCount);

  // Determine node style
  let nodeBg = config.defaultBg;
  let nodeBorder = config.defaultBorder;
  let nodeTextColor = '';

  if (wrongColor && node.type === 'angle') {
    nodeBg = '';
    nodeBorder = '';
    nodeTextColor = wrongTextColor;
  } else if (isLitUp && !wrongColor) {
    nodeBg = 'bg-yellow-100 dark:bg-yellow-900';
    nodeBorder = 'border-yellow-400 dark:border-yellow-600';
  }

  if (isOnHighlightedPath) {
    nodeBg = 'bg-yellow-100 dark:bg-yellow-900';
    nodeBorder = 'border-yellow-400 dark:border-yellow-600';
    nodeTextColor = '';
  }

  return (
    <div className="flex flex-col items-center">
      {/* Node rectangle */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 min-w-[110px] max-w-[220px] text-center cursor-pointer transition-all duration-300 hover:shadow-lg select-none',
          nodeBg,
          nodeBorder,
        )}
        style={wrongColor && node.type === 'angle' ? { backgroundColor: wrongColor, borderColor: wrongColor, color: nodeTextColor } : undefined}
        onClick={() => {
          if (hasChildren || hasQuestions) {
            onToggleExpand(node.id);
          }
        }}
      >
        <IconComponent className="h-4 w-4 shrink-0 opacity-70" style={wrongColor && node.type === 'angle' ? { color: nodeTextColor } : undefined} />
        <span
          className="text-sm font-semibold leading-tight truncate"
          style={wrongColor && node.type === 'angle' ? { color: nodeTextColor } : isOnHighlightedPath ? { color: '#92400e' } : undefined}
        >
          {node.name}
        </span>
        {(hasChildren || hasQuestions) && (
          <span className="shrink-0 ml-0.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            )}
          </span>
        )}
        {stats.wrongCount > 0 && node.type === 'angle' && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 min-w-[20px] text-[10px] px-1"
          >
            {stats.wrongCount}错
          </Badge>
        )}
        {stats.correctCount > 0 && isLitUp && !(wrongColor && node.type === 'angle') && (
          <CheckCircle2 className="absolute -top-2 -right-2 h-5 w-5 text-green-500 bg-white dark:bg-gray-900 rounded-full" />
        )}
      </div>

      {/* Expanded content: children tree */}
      {hasChildren && isExpanded && (
        <>
          {/* Vertical connector from parent */}
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

          {/* Children row */}
          <div className="flex">
            {node.children.map((child, index) => (
              <div
                key={child.id}
                className="relative pt-5 px-3"
              >
                {/* Horizontal connector line segments */}
                {node.children.length > 1 && (
                  <div
                    className="absolute top-0 h-px bg-gray-300 dark:bg-gray-600"
                    style={{
                      left: index === 0 ? '50%' : 0,
                      right: index === node.children.length - 1 ? '50%' : 0,
                    }}
                  />
                )}
                {/* Vertical connector to child */}
                <div className="absolute top-0 left-1/2 w-px h-5 bg-gray-300 dark:bg-gray-600 -translate-x-1/2" />

                <TreeNodeComponent
                  node={child}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  highlightedPath={highlightedPath}
                  showQuestions={showQuestions}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expanded content: questions */}
      {hasQuestions && isExpanded && showQuestions && (
        <>
          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
          <div className="w-full max-w-[360px] space-y-2">
            {node.questions.map((q) => (
              <QuestionMiniCard key={q.id} question={q} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuestionMiniCard({
  question,
}: {
  question: KnowledgeNode['questions'][0];
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left shadow-sm">
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
        {question.content}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {question.options.map((opt) => (
          <div
            key={opt.label}
            className={cn(
              'text-[11px] px-2 py-1 rounded',
              opt.label === question.correctAnswer
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
            )}
          >
            {opt.label}. {opt.text}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-[11px] text-blue-500 hover:text-blue-700 dark:text-blue-400"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        {showAnswer ? '收起解析' : '查看解析'}
      </button>
      {showAnswer && (
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

// --- Main Mind Map View ---
interface MindMapViewProps {
  highlightedPath?: Set<string>;
  showQuestions?: boolean;
  collapsedByDefault?: boolean;
  onNodeClick?: (node: KnowledgeNode) => void;
}

export default function MindMapView({
  highlightedPath,
  showQuestions = true,
  collapsedByDefault = false,
  onNodeClick,
}: MindMapViewProps) {
  const { state } = useAppState();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (collapsedByDefault) return new Set<string>();
    // Default: expand all
    const expanded = new Set<string>();
    function traverse(node: KnowledgeNode): void {
      if (node.children.length > 0 || node.questions.length > 0) {
        expanded.add(node.id);
      }
      node.children.forEach(traverse);
    }
    traverse(state.mindMap);
    return expanded;
  });

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(
    (expand: boolean) => {
      if (expand) {
        const all = new Set<string>();
        function traverse(node: KnowledgeNode): void {
          if (node.children.length > 0 || node.questions.length > 0) {
            all.add(node.id);
          }
          node.children.forEach(traverse);
        }
        traverse(state.mindMap);
        setExpandedNodes(all);
      } else {
        setExpandedNodes(new Set());
      }
    },
    [state.mindMap],
  );

  // Count stats
  const totalAngles = useMemo(() => {
    let count = 0;
    function traverse(node: KnowledgeNode): void {
      if (node.type === 'angle') count++;
      node.children.forEach(traverse);
    }
    traverse(state.mindMap);
    return count;
  }, [state.mindMap]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">知识点导图</h2>
          <Badge variant="outline" className="text-[11px]">
            {totalAngles} 个出题角度
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleToggleAll(true)}
          >
            全部展开
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleToggleAll(false)}
          >
            全部收起
          </button>
        </div>
      </div>

      {/* Tree container */}
      <ScrollArea className="flex-1">
        <div className="p-8 min-w-max">
          <TreeNodeComponent
            node={state.mindMap}
            expandedNodes={expandedNodes}
            onToggleExpand={(nodeId) => {
              if (onNodeClick) {
                function findNode(n: KnowledgeNode): KnowledgeNode | null {
                  if (n.id === nodeId) return n;
                  for (const child of n.children) {
                    const found = findNode(child);
                    if (found) return found;
                  }
                  return null;
                }
                const found = findNode(state.mindMap);
                if (found) onNodeClick(found);
              }
              handleToggleExpand(nodeId);
            }}
            highlightedPath={highlightedPath}
            showQuestions={showQuestions}
            depth={0}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
