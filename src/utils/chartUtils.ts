import { PowerData, ChartConfig } from '../types';

// 特征标签映射 - 使用实际CSV文件的中文列名
export const featureLabels: Record<string, string> = {
  // 实际数据字段
  '实际直调负荷': '实际直调负荷',
  '实际联络线受电负荷': '实际联络线受电负荷',
  '实际风电总加': '实际风电总加',
  '实际光伏总加': '实际光伏总加',
  '实际非市场化核电总加': '实际非市场化核电总加',
  '实际自备机组总加': '实际自备机组总加',
  '实际地方电厂发电总加': '实际地方电厂发电总加',
  '实际抽蓄': '实际抽蓄',
  '实际火力发电': '实际火力发电',
  // 日前数据字段
  '日前直调负荷': '日前直调负荷',
  '日前联络线受电负荷': '日前联络线受电负荷',
  '日前风电总加': '日前风电总加',
  '日前光伏总加': '日前光伏总加',
  '日前非市场化核电总加': '日前非市场化核电总加',
  '日前自备机组总加': '日前自备机组总加',
  '日前地方电厂发电总加': '日前地方电厂发电总加',
  '日前火力发电': '日前火力发电',
  // 价格数据字段
  '现货价格': '现货价格',
  '日前价格': '日前价格',
  // 差值数据字段
  '直调负荷差值': '直调负荷差值',
  '联络线受电负荷差值': '联络线受电负荷差值',
  '风电总加差值': '风电总加差值',
  '光伏总加差值': '光伏总加差值',
  '非市场化核电总加差值': '非市场化核电总加差值',
  '自备机组总加差值': '自备机组总加差值',
  '地方电厂发电总加差值': '地方电厂发电总加差值',
  '火力发电差值': '火力发电差值',
  '价格差值': '价格差值（现货价格-日前价格）',
  // 预测数据字段
  '价格差值预测': '价格差值预测（现货价格-日前价格）',
  '日前价格预测': '日前价格预测'
};

// 图表颜色配置
export const chartColors = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#1890ff',
  '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2',
  '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb', '#fa541c'
];

// 生成图表配置
export const generateChartConfig = (data: PowerData[], selectedFeatures: string[], theme: 'light' | 'dark' = 'light', timeRangeType?: string): ChartConfig => {
  console.log('=== 图表配置生成开始 ===');
  console.log('输入数据:', { dataLength: data.length, selectedFeatures, timeRangeType });
  
  if (data.length === 0) {
    console.log('数据为空，返回空配置');
    return { title: '电力数据可视化', xAxis: [], series: [] };
  }
  
  if (selectedFeatures.length === 0) {
    console.log('未选择特征，返回空配置');
    return { title: '电力数据可视化', xAxis: [], series: [] };
  }
  
  // 根据时间范围类型和数据量动态调整最大数据点数量
  let maxDataPoints = data.length;
  
  if (timeRangeType === 'year') {
    // 年度数据：允许显示完整的一年数据
    maxDataPoints = Math.min(data.length, 8760); // 一年的小时数
    console.log(`年度数据，最大数据点: ${maxDataPoints}`);
  } else if (timeRangeType === 'quarter') {
    // 季度数据：允许显示完整的季度数据
    maxDataPoints = Math.min(data.length, 2200); // 约3个月的小时数
    console.log(`季度数据，最大数据点: ${maxDataPoints}`);
  } else if (data.length > 5000) {
    // 其他情况：对于超过5000个数据点的情况，采用智能采样
    const samplingRatio = Math.ceil(data.length / 3000); // 目标3000个点
    maxDataPoints = Math.floor(data.length / samplingRatio);
    console.log(`数据量过大(${data.length})，采用采样策略，采样比例: 1/${samplingRatio}，最终数据点: ${maxDataPoints}`);
  } else if (data.length > 2000) {
    // 对于2000-5000个数据点，限制为3000个点
    maxDataPoints = 3000;
    console.log(`数据量较大(${data.length})，限制为3000个数据点`);
  }
  
  // 生成X轴标签 - 保持完整时间信息用于tooltip
  const xAxis = data.slice(0, maxDataPoints).map(item => {
    const timeLabel = `${item.month.toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')} ${item.hour.toString().padStart(2, '0')}:00`;
    return timeLabel;
  });
  
  // 为季度和年度生成月份刻度位置
  let monthTickPositions: number[] = [];
  let monthTickLabels: string[] = [];
  
  if (timeRangeType === 'quarter' || timeRangeType === 'year') {
    const monthPositions: Record<string, number> = {};
    
    data.slice(0, maxDataPoints).forEach((item, index) => {
      const monthKey = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      if (!monthPositions[monthKey]) {
        monthPositions[monthKey] = index;
        monthTickPositions.push(index);
        monthTickLabels.push(`${item.month}月`);
      }
    });
    
    console.log('月份刻度生成:', { 
      monthPositions, 
      monthTickPositions, 
      monthTickLabels,
      totalPositions: monthTickPositions.length,
      totalLabels: monthTickLabels.length,
      maxDataPoints
    });
  }
  
  // 定义价格相关特征
  const priceFeatures = ['现货价格', '日前价格', '价格差值', '价格差值预测', '日前价格预测'];
  
  // 检查是否需要双Y轴
  const hasPriceFeatures = selectedFeatures.some(feature => priceFeatures.includes(feature));
  const hasNonPriceFeatures = selectedFeatures.some(feature => !priceFeatures.includes(feature));
  const useDualYAxis = hasPriceFeatures && hasNonPriceFeatures;
  
  console.log('双Y轴检查:', { hasPriceFeatures, hasNonPriceFeatures, useDualYAxis });
  console.log('价格特征:', priceFeatures);
  console.log('选中的价格特征:', selectedFeatures.filter(f => priceFeatures.includes(f)));
  
  // 生成数据系列
  const series = selectedFeatures.map((feature, index) => {
    console.log(`处理特征: ${feature}`);
    
    const seriesData = data.slice(0, maxDataPoints).map((item, dataIndex) => {
      const value = (item as any)[feature];
      const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
      
      // 价格差值保留两位小数
      if (feature === '价格差值') {
        return parseFloat(numericValue.toFixed(2));
      }
      
      return numericValue;
    });
    
    // 确定Y轴索引
    let yAxisIndex = 0; // 默认使用左侧Y轴
    if (useDualYAxis && priceFeatures.includes(feature)) {
      yAxisIndex = 1; // 价格数据使用右侧Y轴
      console.log(`特征 ${feature} 使用右侧Y轴 (索引: ${yAxisIndex})`);
    } else {
      console.log(`特征 ${feature} 使用左侧Y轴 (索引: ${yAxisIndex})`);
    }
    
    // 验证数据范围
    const minValue = Math.min(...seriesData);
    const maxValue = Math.max(...seriesData);
    console.log(`特征 ${feature} 数据范围: ${minValue} ~ ${maxValue}, 数据点数量: ${seriesData.length}`);
    
    return {
      name: featureLabels[feature] || feature,
      data: seriesData,
      type: 'line' as const,
      smooth: true,
      yAxisIndex: yAxisIndex
    };
  });
  
  // 分离左右Y轴的系列
  const leftYAxisSeries = useDualYAxis ? 
    selectedFeatures.filter(feature => !priceFeatures.includes(feature)) : 
    selectedFeatures;
  const rightYAxisSeries = useDualYAxis ? 
    selectedFeatures.filter(feature => priceFeatures.includes(feature)) : 
    [];
  
  console.log('Y轴系列分配:', { leftYAxisSeries, rightYAxisSeries });
  console.log('生成的系列数量:', series.length);
  console.log('最终数据点数量:', maxDataPoints);
  console.log('=== 图表配置生成结束 ===');
  
  return {
    title: '电力数据可视化',
    xAxis,
    series,
    useDualYAxis,
    leftYAxisSeries,
    rightYAxisSeries,
    timeRangeType,
    monthTickPositions,
    monthTickLabels
  };
};

// 生成ECharts配置选项
export const generateEChartsOption = (chartConfig: ChartConfig, theme: 'light' | 'dark' = 'light') => {
  console.log('=== ECharts配置生成开始 ===');
  console.log('图表配置:', {
    title: chartConfig.title,
    xAxisLength: chartConfig.xAxis.length,
    seriesCount: chartConfig.series.length,
    useDualYAxis: chartConfig.useDualYAxis,
    timeRangeType: chartConfig.timeRangeType,
    monthTickPositions: chartConfig.monthTickPositions
  });
  
  const isDark = theme === 'dark';
  
  // 基础配置
  const option: any = {
    title: {
      text: chartConfig.title,
      left: 'center',
      top: 10,
      textStyle: {
        color: isDark ? '#fff' : '#333',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      borderColor: isDark ? '#333' : '#ccc',
      textStyle: {
        color: isDark ? '#fff' : '#333'
      },
      formatter: function(params: any) {
        // 确保tooltip显示完整的时间信息
        const timeValue = params[0].axisValue || '';
        let result = `${timeValue}<br/>`;
        params.forEach((param: any) => {
          let value = param.value;
          // 价格差值保留两位小数
          if (param.seriesName.includes('价格差值')) {
            value = parseFloat(value).toFixed(2);
          }
          result += `${param.marker}${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: chartConfig.series.map(s => s.name),
      top: 50, // 增加与标题的距离
      left: 'center',
      textStyle: {
        color: isDark ? '#fff' : '#333',
        fontSize: 12
      },
      itemWidth: 20,
      itemHeight: 10,
      itemGap: 20
    },
    grid: {
      top: '15%', // 增加顶部空间，为图例留出位置
      left: '8%', // 增加左侧空间，为Y轴标签留出位置
      right: '8%', // 增加右侧空间，为Y轴标签留出位置
      bottom: '10%', // 增加底部空间
      containLabel: true
    }
  };
  
  // 根据时间范围类型配置X轴
  if (chartConfig.timeRangeType === 'quarter' || chartConfig.timeRangeType === 'year') {
    // 季度和年度：显示月份刻度
    option.xAxis = {
      type: 'category' as const,
      data: chartConfig.xAxis,
      axisLabel: {
        color: isDark ? '#fff' : '#333',
        rotate: 0,
        fontSize: 12,
        show: true,
        interval: 0,
        formatter: function(value: string, index: number) {
          // 只显示月份刻度位置的标签
          if (chartConfig.monthTickPositions && chartConfig.monthTickPositions.includes(index)) {
            const monthIndex = chartConfig.monthTickPositions.indexOf(index);
            return chartConfig.monthTickLabels ? chartConfig.monthTickLabels[monthIndex] : '';
          }
          return ''; // 非月份刻度位置不显示标签
        }
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#444' : '#ccc'
        }
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
        interval: 0,
        formatter: function(value: string, index: number) {
          // 只显示月份刻度位置的刻度
          if (chartConfig.monthTickPositions && chartConfig.monthTickPositions.includes(index)) {
            return '|';
          }
          return '';
        }
      }
    };
  } else {
    // 单日、月度、任意选择：显示正常的时间刻度
    option.xAxis = {
      type: 'category' as const,
      data: chartConfig.xAxis,
      axisLabel: {
        color: isDark ? '#fff' : '#333',
        rotate: 45, // 恢复45度旋转
        fontSize: 10, // 恢复较小的字体
        show: true,
        interval: 'auto' // 自动间隔，避免标签重叠
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#444' : '#ccc'
        }
      },
      axisTick: {
        show: true,
        alignWithLabel: true
      }
    };
  }
  
  // 根据是否使用双Y轴配置不同的Y轴
  if (chartConfig.useDualYAxis) {
    // 双Y轴配置
    option.title.subtext = '左侧Y轴：负荷/发电量 | 右侧Y轴：价格';
    option.title.subtextStyle = {
      color: isDark ? '#ccc' : '#666',
      fontSize: 11
    };
    
    // 计算左右Y轴的数据范围
    const leftAxisData = chartConfig.series
      .filter(s => s.yAxisIndex === 0)
      .flatMap(s => s.data);
    const rightAxisData = chartConfig.series
      .filter(s => s.yAxisIndex === 1)
      .flatMap(s => s.data);
    
    const leftMin = Math.min(...leftAxisData);
    const leftMax = Math.max(...leftAxisData);
    const rightMin = Math.min(...rightAxisData);
    const rightMax = Math.max(...rightAxisData);
    
    console.log('Y轴数据范围:', {
      leftAxis: { min: leftMin, max: leftMax },
      rightAxis: { min: rightMin, max: rightMax }
    });
    
    option.yAxis = [
      {
        // 左侧Y轴 - 用于非价格数据
        type: 'value',
        position: 'left',
        name: '负荷/发电量',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: isDark ? '#fff' : '#333',
          fontSize: 12,
          fontWeight: 'bold'
        },
        axisLabel: {
          color: isDark ? '#fff' : '#333',
          fontSize: 10,
          margin: 8,
          formatter: function(value: number) {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万';
            }
            return value.toFixed(0);
          }
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#444' : '#ccc'
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#333' : '#eee'
          }
        }
      },
      {
        // 右侧Y轴 - 用于价格数据
        type: 'value',
        position: 'right',
        name: '价格',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: isDark ? '#fff' : '#333',
          fontSize: 12,
          fontWeight: 'bold'
        },
        axisLabel: {
          color: isDark ? '#fff' : '#333',
          fontSize: 10,
          margin: 8,
          formatter: function(value: number) {
            // 根据价格数据范围调整显示格式
            if (Math.abs(value) >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value.toFixed(2);
          }
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#444' : '#ccc'
          }
        },
        splitLine: {
          show: false
        }
      }
    ];
    
    // 优化图例显示
    option.legend = {
      data: chartConfig.series.map(s => s.name),
      top: 50, // 增加与标题的距离
      left: 'center',
      textStyle: {
        color: isDark ? '#fff' : '#333',
        fontSize: 11
      },
      itemWidth: 18,
      itemHeight: 8,
      itemGap: 15,
      // 添加图例分组
      formatter: function(name: string) {
        const series = chartConfig.series.find(s => s.name === name);
        if (series && series.yAxisIndex === 1) {
          return `💰 ${name}`; // 价格数据添加货币符号
        }
        return `⚡ ${name}`; // 其他数据添加闪电符号
      }
    };
  } else {
    // 单Y轴配置
    option.title = {
      text: chartConfig.title,
      left: 'center',
      textStyle: {
        color: isDark ? '#fff' : '#333'
      }
    };
    
    option.yAxis = {
      type: 'value',
      axisLabel: {
        color: isDark ? '#fff' : '#333'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#444' : '#ccc'
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#333' : '#eee'
        }
      }
    };
    
    option.legend = {
      data: chartConfig.series.map(s => s.name),
      top: 50,
      left: 'center',
      textStyle: {
        color: isDark ? '#fff' : '#333',
        fontSize: 11
      },
      itemWidth: 18,
      itemHeight: 8,
      itemGap: 15
    };
  }
  
  // 配置数据系列 - 针对大数据量优化
  option.series = chartConfig.series.map((series, index) => ({
    name: series.name,
    type: series.type,
    data: series.data,
    smooth: false, // 大数据量时关闭平滑，提高性能
    yAxisIndex: series.yAxisIndex || 0,
    color: chartColors[index % chartColors.length],
    lineStyle: {
      width: 1 // 大数据量时使用较细的线条
    },
    symbol: 'none', // 不显示数据点，提高性能
    sampling: 'lttb', // 使用LTTB采样算法，提高大数据量时的性能
    animation: false // 大数据量时关闭动画，提高性能
  }));
  
  // 添加通用配置
  option.dataZoom = [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      show: true,
      type: 'slider',
      xAxisIndex: [0],
      start: 0,
      end: 100,
      bottom: 10,
      height: 20,
      borderColor: isDark ? '#444' : '#ccc',
      backgroundColor: isDark ? '#222' : '#f5f5f5',
      fillerColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      handleStyle: {
        color: isDark ? '#fff' : '#333',
        borderColor: isDark ? '#666' : '#ccc'
      }
    }
  ];
  
  option.toolbox = {
    feature: {
      saveAsImage: {
        title: '保存为图片'
      },
      dataZoom: {
        title: {
          zoom: '区域缩放',
          back: '区域缩放还原'
        }
      },
      restore: {
        title: '还原'
      }
    },
    right: 20,
    top: 20
  };
  
  option.backgroundColor = isDark ? '#1f1f1f' : '#fff';
  
  console.log('=== ECharts配置生成结束 ===');
  return option;
};

// 调试X轴配置
export const debugXAxisConfig = (timeRangeType?: string, xAxisLength?: number) => {
  console.log('=== X轴配置调试 ===');
  console.log('时间范围类型:', timeRangeType);
  console.log('X轴数据长度:', xAxisLength);
  
  if (timeRangeType === 'quarter' || timeRangeType === 'year') {
    console.log('使用月份刻度配置');
  } else {
    console.log('使用标准时间刻度配置');
  }
  
  console.log('=== X轴配置调试结束 ===');
};

// 调试年度数据显示
export const debugYearDataDisplay = (data: PowerData[], timeRangeType?: string, maxDataPoints?: number) => {
  if (timeRangeType !== 'year') {
    return;
  }
  
  console.log('=== 年度数据显示调试 ===');
  console.log('原始数据量:', data.length);
  console.log('最大数据点限制:', maxDataPoints);
  
  const yearDistribution = data.reduce((acc, item) => {
    acc[item.year] = (acc[item.year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  console.log('年度数据分布:', yearDistribution);
  
  if (maxDataPoints && maxDataPoints < data.length) {
    const truncatedData = data.slice(0, maxDataPoints);
    const truncatedYearDistribution = truncatedData.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log('截断后数据分布:', truncatedYearDistribution);
    console.log('数据截断比例:', (maxDataPoints / data.length * 100).toFixed(2) + '%');
  }
  
  console.log('=== 年度数据显示调试结束 ===');
};

// 调试月份刻度生成
export const debugMonthTicks = (data: PowerData[], timeRangeType?: string) => {
  if (timeRangeType !== 'quarter' && timeRangeType !== 'year') {
    return;
  }
  
  console.log('=== 月份刻度调试 ===');
  console.log('时间范围类型:', timeRangeType);
  console.log('数据总量:', data.length);
  
  const monthDistribution = data.reduce((acc, item, index) => {
    const monthKey = `${item.year}-${item.month.toString().padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = {
        count: 0,
        firstIndex: -1,
        lastIndex: -1
      };
    }
    acc[monthKey].count++;
    if (acc[monthKey].firstIndex === -1) {
      acc[monthKey].firstIndex = index;
    }
    acc[monthKey].lastIndex = index;
    return acc;
  }, {} as Record<string, { count: number; firstIndex: number; lastIndex: number }>);
  
  console.log('月份分布:', monthDistribution);
  
  const monthPositions: number[] = [];
  const monthLabels: string[] = [];
  
  Object.keys(monthDistribution).forEach(monthKey => {
    const monthData = monthDistribution[monthKey];
    monthPositions.push(monthData.firstIndex);
    const [, month] = monthKey.split('-');
    monthLabels.push(`${parseInt(month)}月`);
  });
  
  console.log('月份刻度位置:', monthPositions);
  console.log('月份刻度标签:', monthLabels);
  console.log('=== 月份刻度调试结束 ===');
};

// 导出图表为图片
export const exportChartAsImage = (chartInstance: any, filename: string = '电力数据图表') => {
  if (chartInstance) {
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });
    
    const link = document.createElement('a');
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}; 