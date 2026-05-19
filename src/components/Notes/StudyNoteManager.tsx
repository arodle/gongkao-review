'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/stores/appStore';
import type { StudyNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  StickyNote,
  Plus,
  Search,
  Edit3,
  Trash2,
  Download,
  FileText,
  Tag,
  BookOpen,
  X,
  Check,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StudyNoteManager() {
  const {
    studyNotes,
    nodes,
    fetchStudyNotes,
    addStudyNote,
    updateStudyNote,
    deleteStudyNote,
    isInitialized,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterNodeId, setFilterNodeId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    linked_node_id: '',
    linked_node_name: '',
    tags: '',
  });
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isInitialized) {
      fetchStudyNotes();
    }
  }, [isInitialized, fetchStudyNotes]);

  const filteredNotes = useMemo(() => {
    let result = studyNotes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    if (filterNodeId) {
      result = result.filter(n => n.linked_node_id === filterNodeId);
    }
    return result;
  }, [studyNotes, searchQuery, filterNodeId]);

  const openDialog = useCallback((note?: StudyNote) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        linked_node_id: note.linked_node_id || '',
        linked_node_name: note.linked_node_name || '',
        tags: (note.tags || []).join(', '),
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', linked_node_id: '', linked_node_name: '', tags: '' });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title.trim()) return;
    const note: StudyNote = {
      id: editingNote?.id || `note_${Date.now()}`,
      user_id: 'default_user',
      title: formData.title.trim(),
      content: formData.content,
      linked_node_id: formData.linked_node_id || null,
      linked_node_name: formData.linked_node_name || null,
      tags: formData.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      color_tag: 'default',
      created_at: editingNote?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (editingNote) {
      updateStudyNote(note);
    } else {
      addStudyNote(note);
    }
    setShowDialog(false);
    setEditingNote(null);
  }, [formData, editingNote, addStudyNote, updateStudyNote]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('确定删除这条笔记吗？')) {
      deleteStudyNote(id);
    }
  }, [deleteStudyNote]);

  const handleExport = useCallback((format: 'json' | 'md') => {
    const exportNotes = filteredNotes.length > 0 ? filteredNotes : studyNotes;
    let content: string;
    let filename: string;
    let mime: string;

    if (format === 'json') {
      content = JSON.stringify(exportNotes, null, 2);
      filename = `study_notes_${new Date().toISOString().split('T')[0]}.json`;
      mime = 'application/json';
    } else {
      content = exportNotes.map(n => {
        const lines = [`# ${n.title}`, '', n.content || '', '', `---`];
        if (n.linked_node_name) lines.push(`关联知识点: ${n.linked_node_name}`);
        if (n.tags.length) lines.push(`标签: ${n.tags.join(', ')}`);
        lines.push(`更新于: ${new Date(n.updated_at).toLocaleString('zh-CN')}`);
        return lines.join('\n');
      }).join('\n\n\n');
      filename = `study_notes_${new Date().toISOString().split('T')[0]}.md`;
      mime = 'text/markdown';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredNotes, studyNotes]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectableNodes = useMemo(() =>
    nodes.filter(n => n.node_type === 'subknowledge' || n.node_type === 'angle'),
    [nodes]
  );

  const getNodePath = useCallback((nodeId: string): string => {
    const parts: string[] = [];
    let current = nodes.find(n => n.id === nodeId);
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? nodes.find(n => n.id === current!.parent_id) : undefined;
    }
    return parts.join(' > ');
  }, [nodes]);

  const stats = useMemo(() => ({
    total: studyNotes.length,
    withNode: studyNotes.filter(n => n.linked_node_id).length,
    totalTags: new Set(studyNotes.flatMap(n => n.tags || [])).size,
  }), [studyNotes]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              学习笔记
            </h2>
            <Badge variant="outline">{stats.total} 条</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-1" />
              导出 JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('md')}>
              <FileText className="h-4 w-4 mr-1" />
              导出 Markdown
            </Button>
            <Button size="sm" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              新建笔记
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <select
            value={filterNodeId || ''}
            onChange={e => setFilterNodeId(e.target.value || null)}
            className="border rounded px-2 py-1.5 text-sm bg-background max-w-[200px]"
          >
            <option value="">全部知识点</option>
            {selectableNodes.map(n => (
              <option key={n.id} value={n.id}>{getNodePath(n.id)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />关联知识点 {stats.withNode} 条</span>
          <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{stats.totalTags} 个标签</span>
        </div>
      </div>

      <ScrollArea className="h-0 flex-1 min-h-0">
        <div className="p-4">
          {filteredNotes.length > 0 ? (
            <div className="space-y-3">
              {filteredNotes.map(note => {
                const isExpanded = expandedNotes.has(note.id);
                return (
                  <Card key={note.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(note.id)}>
                          <h3 className="font-medium text-sm truncate">{note.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {note.linked_node_name && (
                              <Badge variant="secondary" className="text-[10px]">
                                <BookOpen className="h-3 w-3 mr-0.5" />
                                {note.linked_node_name}
                              </Badge>
                            )}
                            {(note.tags || []).slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                            {(note.tags || []).length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{(note.tags || []).length - 3}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.updated_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => openDialog(note)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && note.content && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                              {note.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <StickyNote className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || filterNodeId ? '没有找到匹配的笔记' : '暂无学习笔记'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || filterNodeId
                  ? '试试更换搜索词或筛选条件'
                  : '点击上方按钮创建你的第一条学习笔记'}
              </p>
              {!searchQuery && !filterNodeId && (
                <Button onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建笔记
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? '编辑笔记' : '新建笔记'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标题</label>
              <Input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="笔记标题"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">关联知识点</label>
              <select
                value={formData.linked_node_id}
                onChange={e => {
                  const nid = e.target.value;
                  const selNode = nid ? nodes.find(n => n.id === nid) : null;
                  setFormData(p => ({
                    ...p,
                    linked_node_id: nid,
                    linked_node_name: selNode ? getNodePath(selNode.id) : '',
                  }));
                }}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                <option value="">不关联</option>
                {selectableNodes.map(n => (
                  <option key={n.id} value={n.id}>{getNodePath(n.id)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input
                value={formData.tags}
                onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                placeholder="例如：重点, 易错, 公式"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">内容</label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                placeholder="输入笔记内容..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave}><Check className="h-4 w-4 mr-1" />保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
