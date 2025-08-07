// 测试消息修复效果
console.log('🔍 检查消息修复效果...');

// 模拟消息调用
let messageCount = 0;
const originalMessage = {
  success: (content) => {
    messageCount++;
    console.log(`✅ 成功消息 ${messageCount}: ${content}`);
  },
  error: (content) => {
    messageCount++;
    console.log(`❌ 错误消息 ${messageCount}: ${content}`);
  },
  warning: (content) => {
    messageCount++;
    console.log(`⚠️  警告消息 ${messageCount}: ${content}`);
  }
};

// 模拟消息去重机制
let lastMessage = '';
const showMessage = (type, content) => {
  if (lastMessage === content) {
    console.log(`🔄 跳过重复消息: ${content}`);
    return;
  }
  
  lastMessage = content;
  originalMessage[type](content);
  
  setTimeout(() => {
    lastMessage = '';
  }, 3000);
};

// 测试重复消息
console.log('\n📝 测试重复消息...');
showMessage('success', '成功加载 32136 条数据记录');
showMessage('success', '成功加载 32136 条数据记录'); // 应该被跳过
showMessage('success', '数据已刷新'); // 应该显示

// 测试不同类型的消息
console.log('\n📝 测试不同类型的消息...');
showMessage('warning', '预测数据验证发现 2 个问题');
showMessage('error', '数据加载失败');

// 测试3秒后的消息
console.log('\n📝 测试3秒后的消息...');
setTimeout(() => {
  showMessage('success', '成功加载 32136 条数据记录'); // 应该显示，因为lastMessage已清除
}, 3500);

console.log('\n🎉 消息修复测试完成！');
console.log('预期结果: 重复消息被跳过，不同类型的消息正常显示'); 