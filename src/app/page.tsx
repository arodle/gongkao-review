'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { KnowledgeNode, AppTab } from '@/lib/types';
import { AppProvider, useAppState } from '@/lib/store';
import MindMapView from '@/components/MindMapView';
import PracticeView from '@/components/PracticeView';
import ExamView from '@/components/ExamView';
import { ImportExportPanel, AngleMatcher } from '@/components/ImportExportPanel';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  BookOpen,
  FileCheck,
  Settings,
  Link2,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';


function AppContent() {
  const { state, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<AppTab>('mindmap');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<'data' | 'match'>('data');

  const tabs: Array<{ id: AppTab; label: string; icon: React.ElementType }> = [
    { id: 'mindmap', label: '思维导图', icon: GitBranch },
    { id: 'practice', label: '真题练习', icon: BookOpen },
    { id: 'exam', label: '套卷模式', icon: FileCheck },
  ];

  const handleUpdatePracticeSet = useCallback(
    (ps: import('@/lib/types').PracticeSet) => {
      dispatch({ type: 'UPDATE_PRACTICE_SET', payload: ps });
    },
    [dispatch],
  );

  // Count stats for header
  const totalAngles = useMemo(() => {
    let count = 0;
    function traverse(node: KnowledgeNode): void {
      if (node.type === 'angle') count++;
      node.children.forEach(traverse);
    }
    traverse(state.mindMap);
    return count;
  }, [state.mindMap]);

  const totalQuestions = useMemo(() => {
    let count = 0;
    function traverse(node: KnowledgeNode): void {
      count += node.questions.length;
      node.children.forEach(traverse);
    }
    traverse(state.mindMap);
    return count;
  }, [state.mindMap]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">
                公考知识导图
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">知识点学习 · 真题练习</p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] hidden md:flex">
            {totalAngles} 考点 · {totalQuestions} 例题
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main view */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'mindmap' && <MindMapView showQuestions={true} />}
          {activeTab === 'practice' && <PracticeView />}
          {activeTab === 'exam' && <ExamView />}
        </main>

        {/* Sidebar */}
        <aside
          className={cn(
            'w-72 border-l bg-white dark:bg-gray-900 shrink-0 flex flex-col overflow-hidden transition-all duration-300',
            sidebarOpen ? 'max-w-72' : 'max-w-0 lg:max-w-72',
          )}
        >
          {/* Sidebar tabs */}
          <div className="flex border-b shrink-0">
            <button
              type="button"
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                sidebarPanel === 'data'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400',
              )}
              onClick={() => setSidebarPanel('data')}
            >
              <Settings className="h-3.5 w-3.5 inline mr-1" />
              数据管理
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                sidebarPanel === 'match'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400',
              )}
              onClick={() => setSidebarPanel('match')}
            >
              <Link2 className="h-3.5 w-3.5 inline mr-1" />
              考点关联
            </button>
          </div>

          <ScrollArea className="flex-1">
            {sidebarPanel === 'data' && <ImportExportPanel />}
            {sidebarPanel === 'match' && (
              <AngleMatcher
                practiceSets={state.practiceSets}
                onUpdatePracticeSet={handleUpdatePracticeSet}
                mindMap={state.mindMap}
              />
            )}
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
