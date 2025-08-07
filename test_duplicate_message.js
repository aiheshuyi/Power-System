// 测试重复消息修复效果
console.log('🔍 检查重复消息修复效果...');

// 模拟React组件的行为
let messageCount = 0;
let lastMessage = '';

const message = {
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

// 模拟showMessage函数
const showMessage = (type, content) => {
  console.log(`=== 尝试显示消息 ===`);
  console.log(`消息类型: ${type}`);
  console.log(`消息内容: ${content}`);
  console.log(`上次消息: ${lastMessage}`);
  console.log(`是否重复: ${lastMessage === content}`);
  
  if (lastMessage === content) {
    console.log('跳过重复消息');
    return;
  }
  
  console.log('显示消息');
  lastMessage = content;
  message[type](content);
  
  setTimeout(() => {
    console.log('清除消息记录');
    lastMessage = '';
  }, 3000);
};

// 模拟React严格模式的双重渲染
console.log('\n📝 模拟React严格模式的双重渲染...');
console.log('第一次渲染:');
showMessage('success', '成功加载 32136 条数据记录');

console.log('\n第二次渲染 (严格模式):');
showMessage('success', '成功加载 32136 条数据记录'); // 应该被跳过

console.log('\n📝 测试不同的消息:');
showMessage('success', '数据已刷新'); // 应该显示

console.log('\n📝 测试3秒后的相同消息:');
setTimeout(() => {
  showMessage('success', '成功加载 32136 条数据记录'); // 应该显示，因为lastMessage已清除
}, 3500);

console.log('\n🎉 重复消息修复测试完成！');
console.log(`总消息数: ${messageCount}`);
console.log('预期结果: 重复消息被跳过，只显示必要的消息'); 