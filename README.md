# 电力系统数据可视化平台

一个现代化的电力数据可视化网页应用，支持CSV文件上传、多维度数据分析和交互式图表展示。

## 功能特性

### 🎯 核心功能
- **数据可视化**: 使用ECharts绘制交互式折线图，支持多特征曲线叠加显示
- **时间范围选择**: 支持单日、月度、季度、年度多种时间粒度选择
- **特征选择器**: 智能分组显示19个电力特征，支持搜索和批量选择
- **文件上传**: 支持CSV格式电力数据文件上传和解析
- **数据统计**: 实时显示数据统计信息和特征分析

### 🎨 用户界面
- **响应式设计**: 适配不同屏幕尺寸，支持移动端访问
- **现代化UI**: 基于Ant Design的卡片式布局，界面美观
- **主题切换**: 支持明暗主题切换，提升用户体验
- **交互体验**: 图表支持缩放、平移、悬停显示详情

### 📊 数据支持
- **时间范围**: 2022年1月1日 至 2025年7月31日
- **数据间隔**: 每小时一条记录
- **特征数量**: 23个字段（年、月、日、时 + 19个电力特征）
- **数据格式**: CSV文件，支持标准格式解析

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x
- **图表库**: ECharts 5.x + echarts-for-react
- **数据处理**: PapaParse (CSV解析) + dayjs (时间处理)
- **构建工具**: Create React App

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
```

## 数据格式说明

### CSV文件格式要求
CSV文件应包含以下列（按顺序）：

```csv
year,month,day,hour,actualLoad,tieLineLoad,windPower,solarPower,nuclearPower,selfGenPower,localPowerPlant,pumpedStorage,thermalPower,dayAheadLoad,dayAheadWind,dayAheadSolar,dayAheadNuclear,dayAheadSelfGen,dayAheadLocalPlant,dayAheadPumpedStorage,dayAheadThermal,spotPrice,dayAheadPrice
```

### 数据字段说明
| 字段名 | 中文名称 | 说明 |
|--------|----------|------|
| year, month, day, hour | 年、月、日、时 | 时间戳信息 |
| actualLoad | 实际直调负荷 | 实际电力负荷数据 |
| tieLineLoad | 联络线受电负荷 | 联络线电力传输数据 |
| windPower | 风电总加 | 风力发电总量 |
| solarPower | 光伏总加 | 太阳能发电总量 |
| nuclearPower | 核电总加 | 核能发电总量 |
| selfGenPower | 自备机组总加 | 自备发电机组总量 |
| localPowerPlant | 地方电厂发电总加 | 地方电厂发电总量 |
| pumpedStorage | 抽蓄 | 抽水蓄能发电量 |
| thermalPower | 火力发电 | 火力发电总量 |
| dayAheadLoad | 日前预测负荷 | 负荷预测数据 |
| dayAheadWind | 日前预测风电 | 风电预测数据 |
| dayAheadSolar | 日前预测光伏 | 光伏预测数据 |
| dayAheadNuclear | 日前预测核电 | 核电预测数据 |
| dayAheadSelfGen | 日前预测自备机组 | 自备机组预测数据 |
| dayAheadLocalPlant | 日前预测地方电厂 | 地方电厂预测数据 |
| dayAheadPumpedStorage | 日前预测抽蓄 | 抽蓄预测数据 |
| dayAheadThermal | 日前预测火力发电 | 火力发电预测数据 |
| spotPrice | 现货价格 | 电力现货市场价格 |
| dayAheadPrice | 日前价格 | 电力日前市场价格 |

## 使用指南

### 1. 数据加载
- 应用启动时会自动加载示例数据
- 点击"选择CSV文件"上传您的数据文件
- 支持拖拽上传和点击选择文件

### 2. 时间范围选择
- **时间粒度**: 选择单日、月度、季度或年度视图
- **自定义范围**: 使用日期选择器选择具体时间范围
- **快速选择**: 从预设选项中选择常用时间范围
- **跳转今天**: 快速跳转到当前日期

### 3. 特征选择
- **分组显示**: 特征按实际数据、预测数据、价格数据分组
- **搜索功能**: 输入关键词快速查找特征
- **批量操作**: 支持全选/取消全选功能
- **实时统计**: 显示已选择特征数量

### 4. 图表交互
- **缩放**: 使用鼠标滚轮或图表工具栏进行缩放
- **平移**: 拖拽图表进行平移查看
- **悬停**: 鼠标悬停显示数据点详情
- **导出**: 点击"导出图片"保存图表为PNG格式

### 5. 主题切换
- 点击右上角的主题切换按钮
- 支持明亮模式和暗黑模式
- 主题设置会影响整个应用界面

## 项目结构

```
src/
├── components/          # React组件
│   ├── TimeSelector.tsx    # 时间选择器
│   ├── FeatureSelector.tsx # 特征选择器
│   ├── PowerChart.tsx      # 图表组件
│   ├── DataStats.tsx       # 数据统计
│   └── FileUpload.tsx      # 文件上传
├── utils/              # 工具函数
│   ├── dataUtils.ts       # 数据处理工具
│   └── chartUtils.ts      # 图表配置工具
├── types/              # TypeScript类型定义
│   └── index.ts
├── App.tsx             # 主应用组件
├── index.tsx           # 应用入口
└── index.css           # 全局样式
```

## 部署说明

### 本地部署
1. 克隆项目到本地
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm start`
4. 访问 http://localhost:3000

### 生产部署
1. 构建项目: `npm run build`
2. 将 `build` 目录部署到Web服务器
3. 配置服务器支持单页应用路由

### Docker部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 开发说明

### 添加新特征
1. 在 `src/types/index.ts` 中添加新字段类型
2. 在 `src/utils/chartUtils.ts` 中添加特征标签映射
3. 在 `src/utils/dataUtils.ts` 中更新数据处理逻辑

### 自定义图表样式
1. 修改 `src/utils/chartUtils.ts` 中的颜色配置
2. 调整 `generateEChartsOption` 函数中的样式参数
3. 更新主题相关的样式设置

### 扩展数据源
1. 在 `src/utils/dataUtils.ts` 中添加新的数据解析函数
2. 更新 `FileUpload` 组件支持新的文件格式
3. 添加相应的类型定义和验证逻辑

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**注意**: 这是一个演示项目，包含模拟数据。在实际使用中，请确保数据的安全性和隐私保护。 