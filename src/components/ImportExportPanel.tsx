'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { KnowledgeNode, PracticeSet, PracticeQuestion, NodeType } from '@/lib/types';
import { useAppState } from '@/lib/store';
import { createId, SAMPLE_MIND_MAP } from '@/lib/sample-data';
import { Upload, Download, FileText, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- Mind Map Text Format Parser ---
function parseMindMapText(text: string): KnowledgeNode {
  const lines = text.split('\n').filter((l) => l.trim());
  let stack: Array<{ node: KnowledgeNode; indent: number }> = [];
  let root: KnowledgeNode | null = null;

  function getNodeType(depth: number): NodeType {
    switch (depth) {
      case 0: return 'subject';
      case 1: return 'knowledge';
      case 2: return 'subknowledge';
      default: return 'angle';
    }
  }

  for (const line of lines) {
    const indent = line.search(/\S/);
    const content = line.trim();
    if (!content) continue;

    // Check if it's a question line: [Q]content|A:opt|B:opt|Ans:X|Exp:...
    const questionMatch = content.match(/^\[Q\](.+?)\|(.+)$/);

    const node: KnowledgeNode = {
      id: createId('node'),
      name: questionMatch ? '' : content,
      type: getNodeType(Math.floor(indent / 2)),
      children: [],
      questions: [],
    };

    if (questionMatch) {
      const parts = questionMatch[2].split('|');
      const qContent = questionMatch[1];
      const options: Array<{ label: string; text: string }> = [];
      let correctAnswer = '';
      let explanation = '';

      for (const part of parts) {
        const optMatch = part.match(/^([A-D]):(.+)$/);
        if (optMatch) {
          options.push({ label: optMatch[1], text: optMatch[2] });
        } else if (part.startsWith('Ans:')) {
          correctAnswer = part.slice(4);
        } else if (part.startsWith('Exp:')) {
          explanation = part.slice(4);
        }
      }

      const question = {
        id: createId('q'),
        content: qContent,
        options,
        correctAnswer,
        explanation,
      };

      // Add question to the parent node
      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        parent.node.questions.push(question);
      }
      continue;
    }

    if (!root) {
      root = node;
      stack = [{ node, indent }];
    } else {
      // Find parent: the last node with less indentation
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      parent.node.children.push(node);
      stack.push({ node, indent });
    }
  }

  return root || SAMPLE_MIND_MAP;
}

function serializeMindMapText(node: KnowledgeNode, indent = 0): string {
  const prefix = '  '.repeat(indent);
  let result = `${prefix}${node.name}\n`;

  for (const q of node.questions) {
    const optStr = q.options.map((o) => `${o.label}:${o.text}`).join('|');
    result += `${prefix}  [Q]${q.content}|${optStr}|Ans:${q.correctAnswer}|Exp:${q.explanation}\n`;
  }

  for (const child of node.children) {
    result += serializeMindMapText(child, indent + 1);
  }

  return result;
}

// --- Practice Set Text Parser ---
function parsePracticeSetText(text: string, mindMap: KnowledgeNode): PracticeSet {
  const questions: PracticeQuestion[] = [];
  const blocks = text.split(/\n(?=\d+[.、)])/).filter((b) => b.trim());

  function autoMatchAngle(questionText: string): { id: string; name: string } {
    // Try to match keywords from the question to knowledge angles
    const allAngles: Array<{ id: string; name: string }> = [];
    function collectAngles(n: KnowledgeNode): void {
      if (n.type === 'angle') {
        allAngles.push({ id: n.id, name: n.name });
      }
      n.children.forEach(collectAngles);
    }
    collectAngles(mindMap);

    for (const angle of allAngles) {
      if (questionText.includes(angle.name) || angle.name.split('').some((ch) => questionText.includes(ch) && ch.length > 1)) {
        return angle;
      }
    }

    // Keyword matching
    const keywordMap: Record<string, string> = {
      '速度': '行程问题', '公里': '行程问题', '相遇': '行程问题', '追及': '行程问题',
      '工程': '工程问题', '完成': '工程问题', '单独做': '工程问题',
      '增长': '同比/环比增长', '同比': '同比/环比增长', '环比': '同比/环比增长',
      '宪法': '宪法', '法律': '宪法',
      '习近平': '习近平新时代中国特色社会主义思想', '中国特色': '习近平新时代中国特色社会主义思想',
      '填空': '实词辨析', '成语': '成语辨析',
      '主旨': '主旨概括题', '概括': '主旨概括题',
      '意图': '意图判断题',
      '削弱': '削弱论证', '论证': '削弱论证',
      '图形': '位置规律', '平移': '位置规律',
    };

    for (const [keyword, angleName] of Object.entries(keywordMap)) {
      if (questionText.includes(keyword)) {
        const found = allAngles.find((a) => a.name === angleName);
        if (found) return found;
      }
    }

    return { id: 'unmatched', name: '未匹配' };
  }

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;

    // Parse question content
    const contentLine = lines[0].replace(/^\d+[.、)]\s*/, '');
    const options: Array<{ label: string; text: string }> = [];
    let correctAnswer = '';
    let explanation = '';

    for (const line of lines.slice(1)) {
      const optMatch = line.match(/^([A-D])[.、:)]\s*(.+)/);
      if (optMatch) {
        options.push({ label: optMatch[1], text: optMatch[2].trim() });
      } else if (line.startsWith('答案') || line.startsWith('Ans')) {
        const ansMatch = line.match(/[A-D]/);
        if (ansMatch) correctAnswer = ansMatch[0];
      } else if (line.startsWith('解析') || line.startsWith('Exp')) {
        explanation = line.replace(/^(解析|Exp)[：:]\s*/, '');
      }
    }

    if (options.length > 0 && correctAnswer) {
      const angle = autoMatchAngle(contentLine);
      questions.push({
        id: createId('pq'),
        content: contentLine,
        options,
        correctAnswer,
        explanation,
        linkedAngleId: angle.id,
        linkedAngleName: angle.name,
      });
    }
  }

  return {
    id: createId('ps'),
    name: `导入套题 ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    questions,
  };
}

// --- Import Export Panel ---
export function ImportExportPanel() {
  const { state, dispatch } = useAppState();
  const [mindMapText, setMindMapText] = useState(() => serializeMindMapText(state.mindMap));
  const [practiceText, setPracticeText] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false);

  const handleImportMindMap = useCallback(() => {
    try {
      const parsed = parseMindMapText(mindMapText);
      dispatch({ type: 'SET_MIND_MAP', payload: parsed });
      setImportDialogOpen(false);
    } catch {
      alert('解析失败，请检查格式');
    }
  }, [mindMapText, dispatch]);

  const handleSaveMindMapText = useCallback(() => {
    try {
      const parsed = parseMindMapText(mindMapText);
      dispatch({ type: 'SET_MIND_MAP', payload: parsed });
      setEditDialogOpen(false);
    } catch {
      alert('解析失败，请检查格式');
    }
  }, [mindMapText, dispatch]);

  const handleImportPractice = useCallback(() => {
    try {
      const parsed = parsePracticeSetText(practiceText, state.mindMap);
      if (parsed.questions.length > 0) {
        dispatch({ type: 'ADD_PRACTICE_SET', payload: parsed });
        setPracticeText('');
        setPracticeDialogOpen(false);
      } else {
        alert('未解析出有效题目，请检查格式');
      }
    } catch {
      alert('解析失败，请检查格式');
    }
  }, [practiceText, state.mindMap, dispatch]);

  const handleExportJSON = useCallback(() => {
    const data = {
      mindMap: state.mindMap,
      practiceSets: state.practiceSets,
      answerRecords: state.answerRecords,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'civil-exam-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const handleImportJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.mindMap) {
            dispatch({ type: 'SET_MIND_MAP', payload: data.mindMap });
          }
          if (data.practiceSets) {
            for (const ps of data.practiceSets) {
              dispatch({ type: 'ADD_PRACTICE_SET', payload: ps });
            }
          }
        } catch {
          alert('JSON 解析失败');
        }
      };
      reader.readAsText(file);
    },
    [dispatch],
  );

  const handleResetData = useCallback(() => {
    if (confirm('确定要重置所有数据为初始状态吗？此操作不可撤销。')) {
      localStorage.removeItem('civil-exam-app-state');
      window.location.reload();
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">数据管理</h3>

      {/* Export */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleExportJSON}
        >
          <Download className="h-4 w-4" />
          导出全部数据 (JSON)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            const text = serializeMindMapText(state.mindMap);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mindmap.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <FileText className="h-4 w-4" />
          导出思维导图 (文本)
        </Button>
      </div>

      {/* Import JSON */}
      <div>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
            <span>
              <Upload className="h-4 w-4" />
              导入 JSON 数据
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
            </span>
          </Button>
        </label>
      </div>

      {/* Import Mind Map Text */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <FileText className="h-4 w-4" />
            导入思维导图 (文本)
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入思维导图</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              格式：缩进表示层级，每级2个空格。题目行以 [Q] 开头，格式：
              [Q]题目|A:选项|B:选项|Ans:答案|Exp:解析
            </p>
            <Textarea
              value={mindMapText}
              onChange={(e) => setMindMapText(e.target.value)}
              rows={15}
              className="font-mono text-xs"
              placeholder="行测&#10;  言语理解与表达&#10;    片段阅读&#10;      主旨概括题&#10;        [Q]题目内容|A:选项A|B:选项B|Ans:A|Exp:解析"
            />
            <Button onClick={handleImportMindMap}>确认导入</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Text Editor */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Save className="h-4 w-4" />
            文本编辑模式
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>编辑思维导图</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              直接编辑文本内容，修改后点击保存即可更新思维导图。
            </p>
            <ScrollArea className="h-[50vh]">
              <Textarea
                value={mindMapText}
                onChange={(e) => setMindMapText(e.target.value)}
                rows={25}
                className="font-mono text-xs"
              />
            </ScrollArea>
            <div className="flex gap-2">
              <Button onClick={handleSaveMindMapText}>保存修改</Button>
              <Button
                variant="outline"
                onClick={() => setMindMapText(serializeMindMapText(state.mindMap))}
              >
                重置为当前数据
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Practice Set */}
      <Dialog open={practiceDialogOpen} onOpenChange={setPracticeDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Upload className="h-4 w-4" />
            上传套题
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>上传套题与答案</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              格式：题目编号开头，每行一个选项，答案行以"答案"开头，解析行以"解析"开头。系统将自动匹配知识点考点。
            </p>
            <Textarea
              value={practiceText}
              onChange={(e) => setPracticeText(e.target.value)}
              rows={15}
              className="font-mono text-xs"
              placeholder={"1. 题目内容\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：A\n解析：解析内容\n\n2. 另一道题..."}
            />
            <Button onClick={handleImportPractice}>确认导入</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset */}
      <hr className="my-2" />
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-red-500 hover:text-red-600"
        onClick={handleResetData}
      >
        <RotateCcw className="h-4 w-4" />
        重置所有数据
      </Button>
    </div>
  );
}

// --- Practice Set Angle Matcher ---
export function AngleMatcher({
  practiceSets,
  onUpdatePracticeSet,
  mindMap,
}: {
  practiceSets: PracticeSet[];
  onUpdatePracticeSet: (ps: PracticeSet) => void;
  mindMap: KnowledgeNode;
}) {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  const selectedSet = practiceSets.find((ps) => ps.id === selectedSetId);

  const allAngles = useMemo(() => {
    const angles: Array<{ id: string; name: string }> = [];
    function collectAngles(node: KnowledgeNode): void {
      if (node.type === 'angle') {
        angles.push({ id: node.id, name: node.name });
      }
      node.children.forEach(collectAngles);
    }
    collectAngles(mindMap);
    return angles;
  }, [mindMap]);

  const handleAngleChange = useCallback(
    (questionId: string, angleId: string) => {
      if (!selectedSet) return;
      const angle = allAngles.find((a) => a.id === angleId);
      const updated = {
        ...selectedSet,
        questions: selectedSet.questions.map((q) =>
          q.id === questionId
            ? { ...q, linkedAngleId: angleId, linkedAngleName: angle?.name || '未知' }
            : q,
        ),
      };
      onUpdatePracticeSet(updated);
    },
    [selectedSet, allAngles, onUpdatePracticeSet],
  );

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">考点关联管理</h3>

      <select
        className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
        value={selectedSetId || ''}
        onChange={(e) => setSelectedSetId(e.target.value)}
      >
        <option value="">选择套题</option>
        {practiceSets.map((ps) => (
          <option key={ps.id} value={ps.id}>
            {ps.name} ({ps.questions.length}题)
          </option>
        ))}
      </select>

      {selectedSet && (
        <div className="space-y-3">
          {selectedSet.questions.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-gray-800 rounded-lg border p-3 space-y-2"
            >
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {q.content}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">关联考点:</span>
                <select
                  className="flex-1 border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                  value={q.linkedAngleId}
                  onChange={(e) => handleAngleChange(q.id, e.target.value)}
                >
                  <option value="unmatched">未匹配</option>
                  {allAngles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
