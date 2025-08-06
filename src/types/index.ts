export interface PowerData {
  year: number;
  month: number;
  day: number;
  hour: number;
  timestamp: string;
  // 实际数据字段
  实际直调负荷: number;
  实际联络线受电负荷: number;
  实际风电总加: number;
  实际光伏总加: number;
  实际非市场化核电总加: number;
  实际自备机组总加: number;
  实际地方电厂发电总加: number;
  实际抽蓄: number;
  实际火力发电: number;
  // 日前数据字段
  日前直调负荷: number;
  日前联络线受电负荷: number;
  日前风电总加: number;
  日前光伏总加: number;
  日前非市场化核电总加: number;
  日前自备机组总加: number;
  日前地方电厂发电总加: number;
  日前火力发电: number;
  // 价格数据字段
  现货价格: number;
  日前价格: number;
  // 差值数据字段
  直调负荷差值: number;
  联络线受电负荷差值: number;
  风电总加差值: number;
  光伏总加差值: number;
  非市场化核电总加差值: number;
  自备机组总加差值: number;
  地方电厂发电总加差值: number;
  火力发电差值: number;
  价格差值: number;
  // 预测数据字段
  价格差值预测: number;
  日前价格预测: number;
}

export interface TimeRange {
  start: string;
  end: string;
  type: 'day' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ChartConfig {
  title: string;
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
    type: string;
    yAxisIndex?: number; // 新增：指定使用哪个Y轴
  }>;
  useDualYAxis?: boolean; // 新增：是否使用双Y轴
  leftYAxisSeries?: string[]; // 新增：使用左侧Y轴的系列名称
  rightYAxisSeries?: string[]; // 新增：使用右侧Y轴的系列名称
  timeRangeType?: string; // 新增：时间范围类型
  monthTickPositions?: number[]; // 新增：月份刻度位置
  monthTickLabels?: string[]; // 新增：月份刻度标签
}

export interface FeatureOption {
  key: string;
  label: string;
  group: string;
}

export interface AppState {
  data: PowerData[];
  filteredData: PowerData[];
  selectedFeatures: string[];
  timeRange: TimeRange;
  loading: boolean;
  error: string | null;
  isDarkTheme: boolean;
} 