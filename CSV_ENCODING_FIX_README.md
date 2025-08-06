# CSV编码问题解决方案

## 问题描述

浏览器FileReader API无法正确处理GBK/GB2312编码的CSV文件，导致出现"锟斤拷"等乱码字符。

## 解决方案

### 方案1: 浏览器端自动编码检测（已实现）

应用现在使用ArrayBuffer和TextDecoder来自动检测和转换编码：

1. **自动编码检测**: 检测BOM和字节序列来判断编码
2. **多编码尝试**: 自动尝试GBK、GB2312、Big5、UTF-8等编码
3. **智能乱码检测**: 检测"锟斤拷"、"嚙踝蕭"等乱码字符

### 方案2: Python脚本转换（推荐）

如果浏览器端仍然有问题，使用Python脚本转换文件编码：

```bash
# 安装依赖
pip install pandas

# 转换文件
python convert_csv_encoding.py 22-25_All.csv

# 或者指定输出文件
python convert_csv_encoding.py 22-25_All.csv 22-25_All_utf8.csv GBK
```

### 方案3: 在线编码转换工具

访问 `http://localhost:3000/encoding-fix.html` 使用内置的编码转换工具。

## 使用步骤

### 1. 测试浏览器端自动检测

1. 访问 `http://localhost:3000`
2. 查看控制台日志，观察编码检测过程
3. 如果成功，数据应该正常显示

### 2. 如果仍有问题，使用Python脚本

```bash
# 在项目根目录运行
python convert_csv_encoding.py public/22-25_All.csv

# 将转换后的文件替换原文件
cp 22-25_All_utf8.csv public/22-25_All.csv
```

### 3. 使用在线工具

1. 访问 `http://localhost:3000/encoding-fix.html`
2. 上传CSV文件
3. 查看编码检测结果
4. 下载转换后的文件

## 技术细节

### 编码检测逻辑

```typescript
function detectEncoding(uint8Array: Uint8Array): string {
  // 检查BOM
  if (sample.length >= 3 && sample[0] === 0xEF && sample[1] === 0xBB && sample[2] === 0xBF) {
    return 'UTF-8';
  }
  
  // 检查中文字符字节序列
  let hasChineseBytes = false;
  for (let i = 0; i < sample.length - 1; i++) {
    if (sample[i] >= 0x80 && sample[i + 1] >= 0x80) {
      hasChineseBytes = true;
      break;
    }
  }
  
  return hasChineseBytes ? 'GBK' : 'UTF-8';
}
```

### 编码转换逻辑

```typescript
function convertEncoding(uint8Array: Uint8Array, encoding: string): string {
  try {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(uint8Array);
  } catch (error) {
    // 尝试其他编码
    const encodings = ['GBK', 'GB2312', 'Big5', 'UTF-8'];
    for (const enc of encodings) {
      try {
        const decoder = new TextDecoder(enc);
        const result = decoder.decode(uint8Array);
        if (!result.includes('锟斤拷') && !result.includes('嚙踝蕭')) {
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    return new TextDecoder('UTF-8').decode(uint8Array);
  }
}
```

## 常见问题

### Q: 为什么会出现"锟斤拷"乱码？

A: 这是因为GBK/GB2312编码的字节序列被错误地当作UTF-8解码导致的。

### Q: 如何判断文件编码？

A: 可以使用以下方法：
1. 用记事本打开，另存为时查看编码选项
2. 使用Python脚本检测
3. 查看文件开头的BOM标记

### Q: 转换后文件变大了怎么办？

A: 这是正常的，UTF-8编码通常比GBK编码占用更多空间，但兼容性更好。

## 预期效果

修复后应该能够：

1. ✅ 正确读取中文CSV文件
2. ✅ 避免乱码字符
3. ✅ 正确显示中文字段名
4. ✅ 成功解析所有数据行
5. ✅ 正常显示图表和数据

## 联系支持

如果问题仍然存在，请：

1. 检查控制台错误信息
2. 尝试使用Python脚本转换
3. 确认文件没有损坏
4. 提供具体的错误信息 