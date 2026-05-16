'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch('/api/questions');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setQuestionCount(data.questions?.length || 0);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      }
    }

    fetchQuestions();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>❌ 错误</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 题库调试页面</h1>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: questionCount === 32 ? '#d4edda' : '#fff3cd',
        border: '2px solid',
        borderColor: questionCount === 32 ? '#28a745' : '#ffc107',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>
          📊 API 返回题目数量：{questionCount ?? '加载中...'}
        </h2>
        {questionCount === 32 && <p>✅ 正确！数据库中有32道题</p>}
        {questionCount === 30 && <p>⚠️ 只有30道题，可能是示例数据</p>}
        {questionCount !== 32 && questionCount !== 30 && questionCount !== null && (
          <p>⚠️ 题目数量异常</p>
        )}
      </div>

      <h3>📝 所有题目列表：</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {questions.map((q, index) => (
          <div 
            key={q.id} 
            style={{ 
              padding: '10px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: index >= 30 ? '#fff3cd' : '#f8f9fa'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {index + 1}. {q.content?.substring(0, 80)}...
              {index >= 30 && <span style={{ color: 'red', marginLeft: '10px' }}>🆕 新增</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {q.id} | 正确答案: {q.correctAnswer} | 来源: {q.source}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>🔧 说明</h3>
        <ul>
          <li>黄色背景的题目（31-32）是您新增的题目</li>
          <li>如果总数是30，可能是应用使用了本地示例数据而不是数据库</li>
          <li>请检查浏览器控制台是否有错误信息</li>
        </ul>
      </div>
    </div>
  );
}
