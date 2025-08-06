import React, { useRef } from 'react';
import { Card, Spin, Alert, Button, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { PowerData } from '../types';
import { generateChartConfig, generateEChartsOption, exportChartAsImage, debugMonthTicks, debugXAxisConfig, debugYearDataDisplay } from '../utils/chartUtils';

interface PowerChartProps {
  data: PowerData[];
  selectedFeatures: string[];
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  timeRangeType?: string; // 新增时间范围类型参数
  onRefresh?: () => void;
}

const PowerChart: React.FC<PowerChartProps> = ({
  data,
  selectedFeatures,
  loading,
  error,
  theme,
  timeRangeType, // 新增参数
  onRefresh
}) => {
  const chartRef = useRef<any>(null);

  console.log('=== PowerChart组件渲染 ===');
  console.log('接收到的数据:', {
    dataLength: data.length,
    selectedFeatures,
    loading,
    error,
    theme,
    timeRangeType
  });

  // 验证数据格式
  if (data.length > 0) {
    console.log('第一条数据示例:', data[0]);
    console.log('数据字段:', Object.keys(data[0]));
    console.log('选中特征的数据示例:');
    selectedFeatures.forEach(feature => {
      const value = (data[0] as any)[feature];
      console.log(`  ${feature}:`, value, typeof value);
    });
    
    // 添加预测数据调试信息
    if (selectedFeatures.includes('价格差值预测') || selectedFeatures.includes('日前价格预测')) {
      const predictionData = data.slice(0, 5).map(item => ({
        timestamp: item.timestamp,
        价格差值预测: item.价格差值预测,
        日前价格预测: item.日前价格预测
      }));
      
      console.log('PowerChart - 预测数据样本:', predictionData);
    }
  }

  // 调用调试函数
  debugXAxisConfig(timeRangeType, data.length);
  
  // 调试月份刻度生成
  if (timeRangeType === 'quarter' || timeRangeType === 'year') {
    debugMonthTicks(data, timeRangeType);
  }

  const chartConfig = generateChartConfig(data, selectedFeatures, theme, timeRangeType);
  
  // 调用年度数据显示调试函数
  if (timeRangeType === 'year') {
    debugYearDataDisplay(data, timeRangeType, chartConfig.xAxis.length);
  }
  
  const chartOption = generateEChartsOption(chartConfig, theme);

  console.log('生成的图表配置:', {
    xAxisLength: chartConfig.xAxis.length,
    seriesCount: chartConfig.series.length,
    seriesNames: chartConfig.series.map(s => s.name),
    timeRangeType: chartConfig.timeRangeType
  });

  const handleExport = () => {
    if (chartRef.current) {
      exportChartAsImage(chartRef.current.getEchartsInstance());
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <Card className="chart-container">
        <div className="loading-container">
          <Spin size="large" tip="正在加载数据..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="chart-container">
        <div className="error-container">
          <Alert
            message="数据加载错误"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={handleRefresh}>
                重试
              </Button>
            }
          />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="chart-container">
        <div className="loading-container">
          <Alert
            message="暂无数据"
            description="请选择时间范围和数据特征来查看图表"
            type="info"
            showIcon
          />
        </div>
      </Card>
    );
  }

  if (selectedFeatures.length === 0) {
    return (
      <Card className="chart-container">
        <div className="loading-container">
          <Alert
            message="请选择数据特征"
            description="请在左侧面板中选择要显示的数据特征"
            type="warning"
            showIcon
          />
        </div>
      </Card>
    );
  }

  // 验证图表数据
  const hasValidData = chartConfig.series.some(series => 
    series.data.some(value => value > 0)
  );

  if (!hasValidData) {
    console.warn('图表数据验证失败：所有特征的数据都为0或无效');
    return (
      <Card className="chart-container">
        <div className="loading-container">
          <Alert
            message="数据验证失败"
            description="选中的特征在当前时间范围内没有有效数据，请检查数据或调整时间范围"
            type="warning"
            showIcon
          />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="chart-container"
      style={{ 
        padding: '20px', // 增加内边距
        margin: '0',
        height: '100%'
      }}
    >
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '600px', // 固定高度，确保有足够空间
        padding: '10px' // 额外内边距
      }}>
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          style={{ 
            height: '100%', 
            width: '100%' 
          }}
          opts={{ 
            renderer: 'canvas'
          }}
          onEvents={{
            click: (params: any) => {
              console.log('Chart clicked:', params);
            }
          }}
          onChartReady={(chart) => {
            console.log('ECharts图表已准备就绪');
            console.log('图表实例:', chart);
          }}
        />
        
        {/* 操作按钮 - 调整位置避免与Y轴标签重合 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10
        }}>
          <Space>
            <Button 
              size="small" 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              type="primary"
            >
              导出
            </Button>
            <Button 
              size="small" 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </div>
        
        {/* 数据信息显示 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          fontSize: '12px',
          color: '#666',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <div>{data.length} 条记录, {selectedFeatures.length} 个特征</div>
          {data.length > 0 && (
            <div>
              时间范围: {dayjs(data[0].timestamp).format('YYYY-MM-DD HH:mm')} ~ {dayjs(data[data.length - 1].timestamp).format('YYYY-MM-DD HH:mm')}
            </div>
          )}
        </div>
        
        {/* 调试信息显示 */}
        {selectedFeatures.includes('现货价格') || selectedFeatures.includes('日前价格') ? (
          <div style={{ 
            position: 'absolute', 
            top: '40px', 
            left: '10px', 
            background: 'rgba(255,255,255,0.9)', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>价格数据调试信息:</div>
            <div>现货价格范围: {Math.min(...data.map(d => d.现货价格)).toFixed(2)} - {Math.max(...data.map(d => d.现货价格)).toFixed(2)}</div>
            <div>日前价格范围: {Math.min(...data.map(d => d.日前价格)).toFixed(2)} - {Math.max(...data.map(d => d.日前价格)).toFixed(2)}</div>
            <div>价格差值范围: {Math.min(...data.map(d => d.价格差值)).toFixed(2)} - {Math.max(...data.map(d => d.价格差值)).toFixed(2)}</div>
            <div>数据时间范围: {data[0]?.timestamp} ~ {data[data.length - 1]?.timestamp}</div>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default PowerChart; 