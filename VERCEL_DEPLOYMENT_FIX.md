# Vercel部署CSV文件访问问题修复指南

## 问题描述

在Vercel部署后，应用无法正确访问CSV文件，主要问题包括：

1. **fetch返回HTML而不是CSV**：`fetch`请求返回的是HTML内容（`<!doctype html><html lang="zh-CN">`）而不是CSV数据
2. **文件路径问题**：Vercel无法找到`/22-25_All.csv`文件
3. **静态资源服务问题**：CSV文件没有被正确部署或无法通过HTTP访问

## 修复方案

### 1. 创建vercel.json配置文件

在项目根目录创建 `vercel.json` 文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/22-25_All.csv",
      "dest": "/22-25_All.csv"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/22-25_All.csv",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/csv"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 2. 更新package.json配置

确保 `package.json` 中包含正确的配置：

```json
{
  "name": "power-system-visualization",
  "version": "1.0.0",
  "description": "现代化电力数据可视化网页应用",
  "homepage": ".",
  "private": true,
  // ... 其他配置
}
```

### 3. 增强文件访问逻辑

在 `src/App.tsx` 中的 `loadCSVData` 函数已经实现了以下功能：

- **多路径尝试**：尝试多个可能的文件路径
- **文件存在性检查**：使用 `checkFileExists` 函数检查文件是否存在
- **文件信息获取**：使用 `getFileInfo` 函数获取文件详细信息
- **内容类型检查**：检查返回的内容是否为HTML
- **编码处理**：支持多种编码格式
- **详细错误信息**：提供详细的调试信息

### 4. 添加文件检查工具函数

在 `src/utils/dataUtils.ts` 中添加了以下函数：

```typescript
// 检查文件是否存在（通用版本）
export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`检查文件 ${filePath} 失败:`, error);
    return false;
  }
};

// 获取文件信息（通用版本）
export const getFileInfo = async (filePath: string): Promise<{ exists: boolean; size?: number; contentType?: string }> => {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    if (response.ok) {
      const size = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      return { 
        exists: true, 
        size: size ? parseInt(size) : undefined,
        contentType: contentType || undefined
      };
    }
    return { exists: false };
  } catch (error) {
    console.error(`获取文件信息 ${filePath} 失败:`, error);
    return { exists: false };
  }
};
```

## 部署步骤

### 1. 确保文件结构正确

```
Power-cursor/
├── public/
│   ├── 22-25_All.csv          # CSV数据文件
│   ├── index.html
│   └── ...
├── src/
│   ├── App.tsx
│   ├── utils/
│   │   └── dataUtils.ts
│   └── ...
├── package.json
├── vercel.json               # Vercel配置文件
└── README.md
```

### 2. 提交代码

```bash
# 添加所有修改
git add .

# 提交修改
git commit -m "修复Vercel部署后CSV文件访问问题

- 添加vercel.json配置文件
- 增强文件访问逻辑，支持多路径尝试
- 添加文件存在性检查和信息获取
- 改进错误处理和调试信息
- 支持多种编码格式"

# 推送到GitHub
git push origin main
```

### 3. Vercel自动部署

Vercel会自动检测到代码变更并重新部署。

## 调试信息

应用会在控制台输出详细的调试信息：

- 文件路径尝试过程
- 文件存在性检查结果
- 文件信息（大小、内容类型）
- 编码检测和处理过程
- 成功访问的路径

## 预期效果

修复后的应用将具备以下特性：

1. **正确的文件访问**：
   - 在Vercel上正确访问CSV文件
   - 返回正确的CSV内容而不是HTML

2. **改进的错误处理**：
   - 提供详细的文件访问信息
   - 在文件不存在时提供明确的错误信息

3. **更好的调试信息**：
   - 控制台显示文件访问过程
   - 显示文件路径和内容类型信息

4. **多路径支持**：
   - 自动尝试多个可能的文件路径
   - 提高文件访问成功率

## 故障排除

如果问题仍然存在，请检查：

1. **Vercel部署日志**：查看Vercel部署过程中的错误信息
2. **浏览器控制台**：查看详细的调试信息
3. **文件路径**：确认CSV文件在public目录中
4. **文件大小**：确认文件大小在Vercel限制范围内
5. **网络请求**：使用浏览器开发者工具检查网络请求

## 联系支持

如果问题仍然存在，请提供：

1. Vercel部署日志
2. 浏览器控制台错误信息
3. 网络请求的详细信息
4. 文件访问的具体错误信息 