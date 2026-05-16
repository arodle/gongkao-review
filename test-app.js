const axios = require('axios');

async function testAppData() {
  console.log('🌐 测试应用数据...\n');

  try {
    const response = await axios.get('http://localhost:5000/api/questions');
    const data = response.data;

    console.log('📡 API 响应状态:', response.status);
    console.log('📊 题目总数:', data.questions?.length || 0);
    console.log('\n📝 最新添加的2道题:');

    const latestQuestions = data.questions?.slice(0, 2) || [];
    latestQuestions.forEach((q, i) => {
      console.log(`\n${i + 1}. ID: ${q.id}`);
      console.log(`   内容: ${q.content}`);
      console.log(`   选项: ${q.options?.map(o => `${o.label}. ${o.text}`).join(' | ')}`);
      console.log(`   正确答案: ${q.correctAnswer}`);
      console.log(`   解析: ${q.explanation}`);
    });

    console.log('\n✅ 如果这里显示32道题，说明 API 端点正常工作');
    console.log('⚠️ 如果应用显示30道题，可能是前端缓存或初始化问题');

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testAppData();
