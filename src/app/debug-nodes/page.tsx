'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';

export default function DebugNodesPage() {
  const { nodes } = useAppStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const angleNodes = nodes.filter(n => n.node_type === 'angle');
  const allNodes = nodes;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 知识点节点调试页面</h1>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p><strong>💡 说明：</strong></p>
        <ul style={{ marginTop: '10px' }}>
          <li>这个页面显示所有思维导图中的节点</li>
          <li>页面获得焦点时会自动刷新数据</li>
          <li>如果题库中看不到新添加的节点，请先刷新这个页面</li>
        </ul>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 刷新数据
        </button>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: angleNodes.length > 0 ? '#d4edda' : '#fff3cd',
        border: '2px solid',
        borderColor: angleNodes.length > 0 ? '#28a745' : '#ffc107',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>📊 统计信息</h2>
        <p>总节点数：<strong>{allNodes.length}</strong></p>
        <p>angle 类型节点数：<strong>{angleNodes.length}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📂 所有节点（按类型分组）</h2>
        <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
          {['subject', 'knowledge', 'subknowledge', 'angle'].map(type => {
            const typeNodes = nodes.filter(n => n.node_type === type);
            return (
              <div key={type} style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ 
                  marginBottom: '10px',
                  color: type === 'angle' ? '#28a745' : '#495057'
                }}>
                  {type} ({typeNodes.length})
                </h3>
                {typeNodes.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {typeNodes.slice(0, 5).map(node => (
                      <li key={node.id} style={{ marginBottom: '5px' }}>
                        <strong>{node.name}</strong>
                        <br />
                        <small style={{ color: '#6c757d' }}>ID: {node.id}</small>
                      </li>
                    ))}
                    {typeNodes.length > 5 && (
                      <li style={{ color: '#6c757d' }}>
                        ... 还有 {typeNodes.length - 5} 个节点
                      </li>
                    )}
                  </ul>
                ) : (
                  <p style={{ color: '#6c757d', margin: 0 }}>无</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>🎯 angle 类型节点（题库关联会使用这些）</h2>
        {angleNodes.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {angleNodes.map(node => {
              const getNodePath = (nodeId: string): string[] => {
                const parts: string[] = [];
                let current = nodes.find(n => n.id === nodeId);
                while (current) {
                  parts.unshift(current.name);
                  current = current.parent_id
                    ? nodes.find(n => n.id === current!.parent_id)
                    : undefined;
                }
                return parts;
              };
              const pathParts = getNodePath(node.id);
              const displayPath = pathParts.join('》');

              return (
                <li key={node.id} style={{ marginBottom: '10px' }}>
                  <strong>{displayPath}</strong>
                  <br />
                  <small style={{ color: '#6c757d' }}>
                    ID: {node.id} | 类型: {node.node_type}
                  </small>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: '#dc3545', margin: 0 }}>
            ⚠️ 没有找到 angle 类型的节点！
            <br />
            请在思维导图中添加节点，并确保它们是"出题角度"类型。
          </p>
        )}
      </div>
    </div>
  );
}
