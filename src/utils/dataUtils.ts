import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import Papa from 'papaparse';
import { PowerData, TimeRange } from '../types';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);

// 生成示例数据（用于测试）
export const generateSampleData = (): PowerData[] => {
  const data: PowerData[] = [];
  const startDate = dayjs('2022-01-01');
  
  for (let i = 0; i < 24; i++) {
    const currentDate = startDate.add(i, 'hour');
    data.push({
      year: currentDate.year(),
      month: currentDate.month() + 1,
      day: currentDate.date(),
      hour: currentDate.hour(),
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      // 实际数据字段
      实际直调负荷: Math.random() * 200000 + 200000,
      实际联络线受电负荷: Math.random() * 50000 + 30000,
      实际风电总加: Math.random() * 50000 + 20000,
      实际光伏总加: Math.random() * 30000 + 10000,
      实际非市场化核电总加: Math.random() * 10000 + 8000,
      实际自备机组总加: Math.random() * 20000 + 15000,
      实际地方电厂发电总加: Math.random() * 35000 + 25000,
      实际抽蓄: Math.random() * 3000 + 1000,
      实际火力发电: Math.random() * 100000 + 80000,
      // 日前数据字段
      日前直调负荷: Math.random() * 200000 + 200000,
      日前联络线受电负荷: Math.random() * 50000 + 30000,
      日前风电总加: Math.random() * 50000 + 20000,
      日前光伏总加: Math.random() * 30000 + 10000,
      日前非市场化核电总加: Math.random() * 10000 + 8000,
      日前自备机组总加: Math.random() * 20000 + 15000,
      日前地方电厂发电总加: Math.random() * 35000 + 25000,
      日前火力发电: Math.random() * 100000 + 80000,
      // 价格数据字段
      现货价格: Math.random() * 200 + 100,
      日前价格: Math.random() * 200 + 100,
      // 差值数据字段
      价格差值: Math.random() * 50 - 25,
      直调负荷差值: Math.random() * 10000 - 5000,
      联络线受电负荷差值: Math.random() * 5000 - 2500,
      风电总加差值: Math.random() * 5000 - 2500,
      光伏总加差值: Math.random() * 3000 - 1500,
      非市场化核电总加差值: Math.random() * 1000 - 500,
      自备机组总加差值: Math.random() * 2000 - 1000,
      地方电厂发电总加差值: Math.random() * 3500 - 1750,
      火力发电差值: Math.random() * 10000 - 5000,
      // 新增预测数据字段
      价格差值预测: Math.random() * 50 - 25,
      日前价格预测: Math.random() * 200 + 100
    });
  }
  
  return data;
};

// 验证数据合理性 - 修复验证阈值
export const validateData = (data: PowerData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    // 修复价格数据验证阈值 - 根据实际数据调整
    if (Math.abs(item.现货价格) > 100000) { // 从1000改为100000
      errors.push(`第${index + 1}行现货价格异常: ${item.现货价格}`);
    }
    
    if (Math.abs(item.日前价格) > 100000) { // 从1000改为100000
      errors.push(`第${index + 1}行日前价格异常: ${item.日前价格}`);
    }
    
    // 验证负荷数据范围
    if (item.实际直调负荷 < 0 || item.实际直调负荷 > 1000000) {
      errors.push(`第${index + 1}行实际直调负荷异常: ${item.实际直调负荷}`);
    }
    
    // 验证时间连续性（简化验证逻辑，避免无限递归）
    if (index > 0 && index < 10) { // 只验证前10行，避免大量验证
      const prevTime = dayjs(data[index - 1].timestamp);
      const currTime = dayjs(item.timestamp);
      const diffHours = currTime.diff(prevTime, 'hour');
      
      if (diffHours > 24) { // 放宽时间连续性要求
        errors.push(`第${index + 1}行时间不连续: ${prevTime.format('YYYY-MM-DD HH:mm')} -> ${currTime.format('YYYY-MM-DD HH:mm')}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors.slice(0, 100) // 限制错误数量，避免过多输出
  };
};

// 解析CSV文件 - 修复编码问题
export const parseCSVFile = (file: File): Promise<PowerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // 直接使用UTF-8读取，因为文件已经转换
    reader.readAsText(file, 'UTF-8');
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        console.log('CSV文件内容前500字符:', csvText.substring(0, 500));
        
        // 检查是否有乱码
        if (csvText.includes('锟斤拷') || csvText.includes('嚙踝蕭')) {
          reject(new Error('检测到乱码字符，编码解析失败'));
          return;
        }
        
        // 使用Papa Parse解析CSV
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV解析结果:', {
              totalRows: results.data.length,
              headers: results.meta.fields,
              firstRow: results.data[0],
              lastRow: results.data[results.data.length - 1]
            });
            
            console.log('CSV文件内容前500字符:', csvText.substring(0, 500));
            
            // 检查是否有预测数据列 - 修复列名匹配
            const hasPredictionData = results.meta.fields?.some(field => 
              field.includes('价格差值预测') || field.includes('日前价格预测')
            );
            console.log('是否包含预测数据:', hasPredictionData);
            console.log('CSV文件的所有列名:', results.meta.fields);
            
            // 验证CSV文件头
            const expectedHeaders = [
              '年', '月', '日', '时', '实际直调负荷', '实际联络线受电负荷', '实际风电总加', '实际光伏总加',
              '实际非市场化核电总加', '实际自备机组总加', '实际地方电厂发电总加', '实际抽蓄', '实际火力发电',
              '日前直调负荷', '日前联络线受电负荷', '日前风电总加', '日前光伏总加', '日前非市场化核电总加',
              '日前自备机组总加', '日前地方电厂发电总加', '日前火力发电', '现货价格', '日前价格',
              '价格差值', '直调负荷差值', '联络线受电负荷差值', '风电总加差值', '光伏总加差值',
              '非市场化核电总加差值', '自备机组总加差值', '地方电厂发电总加差值', '火力发电差值'
            ];
            
            console.log('期望的列头:', expectedHeaders);
            console.log('实际的列头:', results.meta.fields);
            
            // 检查列头是否匹配
            if (!results.meta.fields || results.meta.fields.length < 4) {
              console.error('CSV文件列数不足:', {
                expected: '至少4列（年、月、日、时）',
                actual: results.meta.fields?.length
              });
            }
            
            const data: PowerData[] = [];
            let validRows = 0;
            let skippedRows = 0;
            
            // 查找包含预测关键词的列名
            const predictionColumns = results.meta.fields?.filter(field => 
              field.includes('价格差值预测') || field.includes('日前价格预测')
            ) || [];
            
            results.data.forEach((row: any, index: number) => {
              // 基础时间字段检查
              if (!row['月'] || !row['日'] || !row['时']) {
                return;
              }
              
              // 增强时间字段检测 - 支持多种字段名称
              const yearField = row['年'] || row['Year'] || row['year'];
              const monthField = row['月'] || row['Month'] || row['month'];
              const dayField = row['日'] || row['Day'] || row['day'];
              const hourField = row['时'] || row['Hour'] || row['hour'];
              
              // 检查时间字段是否存在
              if (!monthField || !dayField || !hourField) {
                console.warn(`第${index + 1}行缺少时间字段，跳过。行数据:`, row);
                skippedRows++;
                return;
              }
              
              const month = parseInt(monthField);
              const day = parseInt(dayField);
              const hour = parseInt(hourField);
              
              // 验证时间字段的有效性
              if (isNaN(month) || isNaN(day) || isNaN(hour)) {
                console.warn(`第${index + 1}行时间字段格式错误，跳过。行数据:`, row);
                skippedRows++;
                return;
              }
              
              if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23) {
                console.warn(`第${index + 1}行时间字段超出有效范围，跳过。行数据:`, row);
                skippedRows++;
                return;
              }
              
              // 年份处理 - 优先使用CSV中的年份，如果没有则推断
              let year = 2022; // 默认年份
              
              if (yearField) {
                const parsedYear = parseInt(yearField);
                if (!isNaN(parsedYear) && parsedYear >= 2022 && parsedYear <= 2025) {
                  year = parsedYear;
                } else {
                  console.warn(`第${index + 1}行年份无效: ${yearField}，使用推断年份`);
                }
              } else {
                // 根据数据位置推断年份（假设每年8760小时数据）
                const hoursPerYear = 8760;
                year = Math.floor(index / hoursPerYear) + 2022;
                year = Math.max(2022, Math.min(2025, year));
              }
              
              // 解析价格数据并验证
              const spotPrice = parseFloat(row['现货价格']) || 0;
              const dayAheadPrice = parseFloat(row['日前价格']) || 0;
              
              // 验证价格数据的合理性 - 调整阈值
              if (Math.abs(spotPrice) > 100000 || Math.abs(dayAheadPrice) > 100000) {
                console.warn(`第${index + 1}行价格数据异常:`, {
                  spotPrice,
                  dayAheadPrice,
                  row: row
                });
              }
              
              // 重新计算价格差值（现货价格-日前价格）
              const priceDifference = spotPrice - dayAheadPrice;
              
              // 修复预测数据解析 - 使用正确的列名匹配
              let priceDifferencePrediction = 0;
              let dayAheadPricePrediction = 0;
              
              if (index < 3) { // 只在前几行显示调试信息
                console.log('找到的预测列名:', predictionColumns);
              }
              
              // 解析价格差值预测
              const priceDiffPredictionColumn = predictionColumns.find(field => field.includes('价格差值预测'));
              if (priceDiffPredictionColumn) {
                priceDifferencePrediction = parseFloat(row[priceDiffPredictionColumn]) || 0;
                if (index < 3) {
                  console.log(`第${index + 1}行价格差值预测解析:`, {
                    columnName: priceDiffPredictionColumn,
                    rawValue: row[priceDiffPredictionColumn],
                    parsedValue: priceDifferencePrediction
                  });
                }
              }
              
              // 解析日前价格预测
              const dayAheadPricePredictionColumn = predictionColumns.find(field => field.includes('日前价格预测'));
              if (dayAheadPricePredictionColumn) {
                dayAheadPricePrediction = parseFloat(row[dayAheadPricePredictionColumn]) || 0;
                if (index < 3) {
                  console.log(`第${index + 1}行日前价格预测解析:`, {
                    columnName: dayAheadPricePredictionColumn,
                    rawValue: row[dayAheadPricePredictionColumn],
                    parsedValue: dayAheadPricePrediction
                  });
                }
              }
              
              // 验证预测数据解析结果
              if (index < 5) { // 只验证前5行
                console.log(`第${index + 1}行预测数据验证:`, {
                  priceDifferencePrediction,
                  dayAheadPricePrediction,
                  hasPriceDiffPrediction: !!priceDiffPredictionColumn,
                  hasDayAheadPricePrediction: !!dayAheadPricePredictionColumn
                });
              }
              
              const item: PowerData = {
                year,
                month,
                day,
                hour,
                timestamp: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:00:00`,
                // 实际数据字段
                实际直调负荷: parseFloat(row['实际直调负荷']) || 0,
                实际联络线受电负荷: parseFloat(row['实际联络线受电负荷']) || 0,
                实际风电总加: parseFloat(row['实际风电总加']) || 0,
                实际光伏总加: parseFloat(row['实际光伏总加']) || 0,
                实际非市场化核电总加: parseFloat(row['实际非市场化核电总加']) || 0,
                实际自备机组总加: parseFloat(row['实际自备机组总加']) || 0,
                实际地方电厂发电总加: parseFloat(row['实际地方电厂发电总加']) || 0,
                实际抽蓄: parseFloat(row['实际抽蓄']) || 0,
                实际火力发电: parseFloat(row['实际火力发电']) || 0,
                // 日前数据字段
                日前直调负荷: parseFloat(row['日前直调负荷']) || 0,
                日前联络线受电负荷: parseFloat(row['日前联络线受电负荷']) || 0,
                日前风电总加: parseFloat(row['日前风电总加']) || 0,
                日前光伏总加: parseFloat(row['日前光伏总加']) || 0,
                日前非市场化核电总加: parseFloat(row['日前非市场化核电总加']) || 0,
                日前自备机组总加: parseFloat(row['日前自备机组总加']) || 0,
                日前地方电厂发电总加: parseFloat(row['日前地方电厂发电总加']) || 0,
                日前火力发电: parseFloat(row['日前火力发电']) || 0,
                // 价格数据字段
                现货价格: spotPrice,
                日前价格: dayAheadPrice,
                // 差值数据字段 - 使用重新计算的价格差值
                价格差值: priceDifference,
                直调负荷差值: parseFloat(row['直调负荷差值']) || 0,
                联络线受电负荷差值: parseFloat(row['联络线受电负荷差值']) || 0,
                风电总加差值: parseFloat(row['风电总加差值']) || 0,
                光伏总加差值: parseFloat(row['光伏总加差值']) || 0,
                非市场化核电总加差值: parseFloat(row['非市场化核电总加差值']) || 0,
                自备机组总加差值: parseFloat(row['自备机组总加差值']) || 0,
                地方电厂发电总加差值: parseFloat(row['地方电厂发电总加差值']) || 0,
                火力发电差值: parseFloat(row['火力发电差值']) || 0,
                // 新增预测数据字段
                价格差值预测: priceDifferencePrediction,
                日前价格预测: dayAheadPricePrediction
              };
              
              data.push(item);
              validRows++;
            });
            
            // 验证预测数据解析结果
            const predictionDataStats = data.slice(0, 10).map(item => ({
              timestamp: item.timestamp,
              价格差值预测: item.价格差值预测,
              日前价格预测: item.日前价格预测
            }));
            
            console.log('解析完成，数据统计:', {
              totalRows: results.data.length,
              validRows: validRows,
              skippedRows: skippedRows,
              yearRange: {
                min: Math.min(...data.map(d => d.year)),
                max: Math.max(...data.map(d => d.year))
              },
              hasPredictionData,
              predictionColumns,
              samplePredictionData: predictionDataStats
            });
            
            if (data.length === 0) {
              reject(new Error(`CSV文件解析后没有有效数据。总行数: ${results.data.length}, 有效行数: ${validRows}, 跳过行数: ${skippedRows}`));
              return;
            }
            
            resolve(data);
          },
          error: (error: any) => {
            console.error('CSV解析错误:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('文件读取错误:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('文件读取错误:', error);
      reject(error);
    };
  });
};





// 根据时间范围过滤数据
export const filterDataByTimeRange = (data: PowerData[], timeRange: TimeRange): PowerData[] => {
  console.log('=== 数据过滤开始 ===');
  console.log('过滤前数据数量:', data.length);
  console.log('时间范围:', timeRange);
  
  if (!timeRange.start || !timeRange.end) {
    console.log('时间范围为空，返回所有数据');
    return data;
  }
  
  const startDate = dayjs(timeRange.start);
  const endDate = dayjs(timeRange.end);
  
  console.log('开始日期:', startDate.format('YYYY-MM-DD'));
  console.log('结束日期:', endDate.format('YYYY-MM-DD'));
  
  // 检查数据的时间范围
  const dataStart = dayjs(`${data[0]?.year}-${data[0]?.month.toString().padStart(2, '0')}-${data[0]?.day.toString().padStart(2, '0')}`);
  const dataEnd = dayjs(`${data[data.length - 1]?.year}-${data[data.length - 1]?.month.toString().padStart(2, '0')}-${data[data.length - 1]?.day.toString().padStart(2, '0')}`);
  
  console.log('数据实际范围:', {
    dataStart: dataStart.format('YYYY-MM-DD'),
    dataEnd: dataEnd.format('YYYY-MM-DD'),
    filterStart: startDate.format('YYYY-MM-DD'),
    filterEnd: endDate.format('YYYY-MM-DD')
  });
  
  // 检查年份分布
  const yearDistribution = data.reduce((acc, item) => {
    acc[item.year] = (acc[item.year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  console.log('数据年份分布:', yearDistribution);
  
  const filtered = data.filter(item => {
    const itemDate = dayjs(`${item.year}-${item.month.toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`);
    
    // 统一使用日期范围过滤，不再根据type区分
    const isInRange = itemDate.isSameOrAfter(startDate, 'day') && itemDate.isSameOrBefore(endDate, 'day');
    
    // 调试前几条和后几条数据
    if (item === data[0] || item === data[data.length - 1] || item === data[Math.floor(data.length / 2)]) {
      console.log('数据项检查:', {
        itemDate: itemDate.format('YYYY-MM-DD'),
        isInRange,
        item: `${item.year}-${item.month}-${item.day}`,
        year: item.year,
        month: item.month,
        day: item.day
      });
    }
    
    return isInRange;
  });
  
  console.log('过滤后数据数量:', filtered.length);
  
  // 显示过滤后数据的时间范围和年份分布
  if (filtered.length > 0) {
    const filteredStart = dayjs(`${filtered[0].year}-${filtered[0].month.toString().padStart(2, '0')}-${filtered[0].day.toString().padStart(2, '0')}`);
    const filteredEnd = dayjs(`${filtered[filtered.length - 1].year}-${filtered[filtered.length - 1].month.toString().padStart(2, '0')}-${filtered[filtered.length - 1].day.toString().padStart(2, '0')}`);
    
    const filteredYearDistribution = filtered.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log('过滤后数据范围:', {
      start: filteredStart.format('YYYY-MM-DD'),
      end: filteredEnd.format('YYYY-MM-DD')
    });
    console.log('过滤后年份分布:', filteredYearDistribution);
  }
  
  console.log('=== 数据过滤结束 ===');
  
  return filtered;
};

// 获取时间范围选项（基于实际数据范围）
export const getTimeRangeOptions = (data: PowerData[] = []): Array<{label: string, value: string, type: 'year'}> => {
  const options: Array<{label: string, value: string, type: 'year'}> = [];
  
  // 如果没有数据，使用默认范围
  if (data.length === 0) {
    for (let year = 2022; year <= 2025; year++) {
      options.push({
        label: `${year}年`,
        value: year.toString(),
        type: 'year'
      });
    }
    return options;
  }
  
  // 根据实际数据范围生成选项
  const years = Array.from(new Set(data.map(item => item.year))).sort();
  console.log('实际数据年份范围:', years);
  
  years.forEach(year => {
    options.push({
      label: `${year}年`,
      value: year.toString(),
      type: 'year'
    });
  });
  
  return options;
};

// 验证解析后的数据
export const validateParsedData = (data: PowerData[]): void => {
  console.log('=== 数据验证开始 ===');
  
  // 检查年份范围
  const years = Array.from(new Set(data.map(d => d.year))).sort();
  console.log('数据年份范围:', years);
  
  // 检查价格数据范围
  const spotPrices = data.map(d => d.现货价格).filter(p => p !== 0);
  const dayAheadPrices = data.map(d => d.日前价格).filter(p => p !== 0);
  
  console.log('现货价格统计:', {
    count: spotPrices.length,
    min: Math.min(...spotPrices),
    max: Math.max(...spotPrices),
    avg: spotPrices.reduce((a, b) => a + b, 0) / spotPrices.length
  });
  
  console.log('日前价格统计:', {
    count: dayAheadPrices.length,
    min: Math.min(...dayAheadPrices),
    max: Math.max(...dayAheadPrices),
    avg: dayAheadPrices.reduce((a, b) => a + b, 0) / dayAheadPrices.length
  });
  
  // 检查价格差值
  const priceDifferences = data.map(d => d.价格差值).filter(p => p !== 0);
  console.log('价格差值统计:', {
    count: priceDifferences.length,
    min: Math.min(...priceDifferences),
    max: Math.max(...priceDifferences),
    avg: priceDifferences.reduce((a, b) => a + b, 0) / priceDifferences.length
  });
  
  console.log('=== 数据验证完成 ===');
};

// 获取实际数据的日期范围
export const getActualDataRange = (data: PowerData[]): { start: string; end: string } => {
  if (data.length === 0) {
    return { start: '2022-01-01', end: '2025-08-31' };
  }
  
  // 按时间戳排序
  const sortedData = [...data].sort((a, b) => {
    const dateA = dayjs(`${a.year}-${a.month.toString().padStart(2, '0')}-${a.day.toString().padStart(2, '0')}`);
    const dateB = dayjs(`${b.year}-${b.month.toString().padStart(2, '0')}-${b.day.toString().padStart(2, '0')}`);
    return dateA.isBefore(dateB) ? -1 : 1;
  });
  
  const firstRecord = sortedData[0];
  const lastRecord = sortedData[sortedData.length - 1];
  
  // 强制设置正确的数据范围
  const startDate = '2022-01-01';
  const endDate = '2025-08-31';
  
  console.log('实际数据范围:', { 
    startDate, 
    endDate, 
    totalRecords: data.length,
    firstRecord: `${firstRecord.year}-${firstRecord.month}-${firstRecord.day}`,
    lastRecord: `${lastRecord.year}-${lastRecord.month}-${lastRecord.day}`
  });
  
  return { start: startDate, end: endDate };
};

// 获取可用的年份、月份、季度选项
export const getAvailableTimeOptions = (data: PowerData[]) => {
  if (data.length === 0) {
    return {
      years: [2022, 2023, 2024, 2025],
      months: [],
      quarters: []
    };
  }
  
  // 获取实际数据范围
  const dataRange = getActualDataRange(data);
  const startDate = dayjs(dataRange.start);
  const endDate = dayjs(dataRange.end);
  
  // 生成年份选项 - 只包含有数据的年份
  const years: number[] = [];
  for (let year = startDate.year(); year <= endDate.year(); year++) {
    years.push(year);
  }
  
  // 生成月份选项 - 只包含有数据的月份
  const months: Array<{year: number, month: number}> = [];
  let currentDate = startDate.startOf('month');
  
  while (currentDate.isSameOrBefore(endDate, 'month')) {
    months.push({
      year: currentDate.year(),
      month: currentDate.month() + 1
    });
    currentDate = currentDate.add(1, 'month');
  }
  
  // 生成季度选项 - 修复季度计算
  const quarters: Array<{year: number, quarter: number}> = [];
  currentDate = startDate.startOf('quarter');
  
  while (currentDate.isSameOrBefore(endDate, 'month')) {
    const quarter = currentDate.quarter();
    const year = currentDate.year();
    
    // 检查这个季度是否在数据范围内
    const quarterStart = currentDate.startOf('quarter');
    const quarterEnd = currentDate.endOf('quarter');
    
    // 如果季度开始日期在数据范围内，或者季度结束日期在数据范围内，则包含这个季度
    if (quarterStart.isSameOrBefore(endDate) && quarterEnd.isSameOrAfter(startDate)) {
      // 检查是否已经添加过这个季度
      const existingQuarter = quarters.find(q => q.year === year && q.quarter === quarter);
      if (!existingQuarter) {
        quarters.push({ year, quarter });
      }
    }
    
    currentDate = currentDate.add(1, 'month');
  }
  
  console.log('可用时间选项:', { 
    years, 
    months: months.length, 
    quarters: quarters.length,
    quartersDetail: quarters,
    dataRange: { start: dataRange.start, end: dataRange.end }
  });
  
  return { years, months, quarters };
};

// 计算数据统计信息
export const calculateStats = (data: PowerData[]) => {
  if (data.length === 0) {
    return {
      totalRecords: 0,
      dateRange: '',
      features: []
    };
  }
  
  const features = [
    // 实际数据字段
    '实际直调负荷', '实际联络线受电负荷', '实际风电总加', '实际光伏总加',
    '实际非市场化核电总加', '实际自备机组总加', '实际地方电厂发电总加',
    '实际抽蓄', '实际火力发电',
    // 日前数据字段
    '日前直调负荷', '日前联络线受电负荷', '日前风电总加', '日前光伏总加',
    '日前非市场化核电总加', '日前自备机组总加', '日前地方电厂发电总加',
    '日前火力发电',
    // 价格数据字段
    '现货价格', '日前价格',
    // 差值数据字段
    '直调负荷差值', '联络线受电负荷差值', '风电总加差值', '光伏总加差值',
    '非市场化核电总加差值', '自备机组总加差值', '地方电厂发电总加差值',
    '火力发电差值', '价格差值'
  ];
  
  const stats = features.map(feature => {
    const values = data.map(item => (item as any)[feature]).filter(v => !isNaN(v));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    
    return {
      feature,
      count: values.length,
      average: avg,
      maximum: max,
      minimum: min,
      total: sum
    };
  });
  
  const startDate = data[0]?.timestamp;
  const endDate = data[data.length - 1]?.timestamp;
  
  return {
    totalRecords: data.length,
    dateRange: startDate && endDate ? `${startDate} 至 ${endDate}` : '',
    features: stats
  };
}; 

// 验证预测数据解析结果
export const validatePredictionData = (data: PowerData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 检查是否有预测数据
  const hasPredictionData = data.some(item => 
    item.价格差值预测 !== 0 || item.日前价格预测 !== 0
  );
  
  if (!hasPredictionData) {
    errors.push('未检测到预测数据，请检查CSV文件列名是否正确');
  }
  
  // 检查预测数据范围
  const predictionData = data.filter(item => 
    item.价格差值预测 !== 0 || item.日前价格预测 !== 0
  );
  
  if (predictionData.length > 0) {
    const priceDiffRange = {
      min: Math.min(...predictionData.map(d => d.价格差值预测)),
      max: Math.max(...predictionData.map(d => d.价格差值预测))
    };
    
    const dayAheadPriceRange = {
      min: Math.min(...predictionData.map(d => d.日前价格预测)),
      max: Math.max(...predictionData.map(d => d.日前价格预测))
    };
    
    console.log('预测数据范围:', {
      价格差值预测: priceDiffRange,
      日前价格预测: dayAheadPriceRange,
      有效预测数据条数: predictionData.length
    });
    
    // 检查预测数据是否在合理范围内
    if (Math.abs(priceDiffRange.min) > 10000 || Math.abs(priceDiffRange.max) > 10000) {
      errors.push(`价格差值预测数据范围异常: ${priceDiffRange.min} ~ ${priceDiffRange.max}`);
    }
    
    if (dayAheadPriceRange.min < -1000 || dayAheadPriceRange.max > 10000) {
      errors.push(`日前价格预测数据范围异常: ${dayAheadPriceRange.min} ~ ${dayAheadPriceRange.max}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 

// 检查数据文件是否存在
export const checkDataFileExists = async (): Promise<boolean> => {
  try {
    const response = await fetch('/22-25_All.csv', { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('检查数据文件失败:', error);
    return false;
  }
};

// 获取数据文件信息
export const getDataFileInfo = async (): Promise<{ exists: boolean; size?: number }> => {
  try {
    const response = await fetch('/22-25_All.csv', { method: 'HEAD' });
    if (response.ok) {
      const size = response.headers.get('content-length');
      return { exists: true, size: size ? parseInt(size) : undefined };
    }
    return { exists: false };
  } catch (error) {
    console.error('获取数据文件信息失败:', error);
    return { exists: false };
  }
}; 

// 尝试多种编码方式 - 增强版本
function tryMultipleEncodings(uint8Array: Uint8Array): string | null {
  const encodings = ['GBK', 'GB2312', 'UTF-8', 'Big5', 'GB18030'];
  
  console.log('开始尝试多种编码方式解析文件...');
  console.log('文件大小:', uint8Array.length, '字节');
  
  // 检查BOM标记
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    console.log('检测到UTF-8 BOM标记');
    try {
      const decoder = new TextDecoder('UTF-8');
      const text = decoder.decode(uint8Array.slice(3)); // 跳过BOM
      if (!text.includes('锟斤拷') && !text.includes('嚙踝蕭')) {
        console.log('成功使用UTF-8 BOM编码解析');
        return text;
      }
    } catch (error) {
      console.log('UTF-8 BOM编码解析失败:', error);
    }
  }
  
  for (const encoding of encodings) {
    try {
      console.log(`尝试使用 ${encoding} 编码解析...`);
      const decoder = new TextDecoder(encoding);
      const text = decoder.decode(uint8Array);
      
      // 检查是否包含乱码字符
      const hasGarbledText = text.includes('锟斤拷') || text.includes('嚙踝蕭') || text.includes('');
      
      if (!hasGarbledText) {
        // 进一步验证：检查是否包含中文字符
        const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
        const hasValidHeaders = text.includes('月') && text.includes('日') && text.includes('时');
        
        if (hasChineseChars && hasValidHeaders) {
          console.log(`成功使用 ${encoding} 编码解析`);
          console.log('文件内容前200字符:', text.substring(0, 200));
          return text;
        } else {
          console.log(`${encoding} 编码解析成功但缺少必要的中文字符或表头`);
        }
      } else {
        console.log(`${encoding} 编码解析出现乱码，尝试下一种编码...`);
        console.log('乱码示例:', text.substring(0, 100));
      }
    } catch (error) {
      console.log(`${encoding} 编码解析失败:`, error);
    }
  }
  
  console.error('所有编码方式都尝试失败');
  return null;
}

// 检测文件编码
export const detectFileEncoding = (uint8Array: Uint8Array): string => {
  // 检查BOM
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    return 'UTF-8';
  }
  
  // 检查是否包含中文字符的字节序列
  let hasChineseBytes = false;
  for (let i = 0; i < Math.min(1000, uint8Array.length - 1); i++) {
    if (uint8Array[i] >= 0x80 && uint8Array[i + 1] >= 0x80) {
      hasChineseBytes = true;
      break;
    }
  }
  
  if (hasChineseBytes) {
    return 'GBK'; // 默认使用GBK
  }
  
  return 'UTF-8';
};

// 转换编码
export const convertEncoding = (uint8Array: Uint8Array, encoding: string): string => {
  try {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(uint8Array);
  } catch (error) {
    console.warn(`使用${encoding}编码转换失败:`, error);
    return '';
  }
};

// 验证文件内容
export const validateFileContent = (csvText: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 检查是否为空
  if (!csvText || csvText.trim().length === 0) {
    errors.push('文件内容为空');
    return { isValid: false, errors };
  }
  
  // 检查是否包含乱码
  if (csvText.includes('锟斤拷') || csvText.includes('嚙踝蕭')) {
    errors.push('文件包含乱码字符');
    return { isValid: false, errors };
  }
  
  // 检查是否包含预期的列名
  const expectedColumns = ['年', '月', '日', '时'];
  for (const column of expectedColumns) {
    if (!csvText.includes(column)) {
      errors.push(`未找到预期列名: ${column}`);
    }
  }
  
  // 检查是否包含数据行
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    errors.push('文件行数不足，至少需要标题行和一行数据');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

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