import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layout, ConfigProvider, Switch, Button, message, theme, Spin } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TimeSelector from './components/TimeSelector';
import FeatureSelector from './components/FeatureSelector';
import PowerChart from './components/PowerChart';
import { PowerData, TimeRange } from './types';
import { filterDataByTimeRange, parseCSVFile, validateData, validateParsedData, getActualDataRange, checkFileExists, getFileInfo } from './utils/dataUtils';
import './App.css';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [data, setData] = useState<PowerData[]>([]);
  const [filteredData, setFilteredData] = useState<PowerData[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    '实际直调负荷', '实际风电总加', '实际光伏总加', '直调负荷差值', '价格差值'
  ]);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: '2022-01-01',
    end: '2022-01-01',
    type: 'day'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [dataDateRange, setDataDateRange] = useState<string>('');
  
  // 添加消息去重机制
  const [lastSuccessMessage, setLastSuccessMessage] = useState<string>('');
  
  // 添加数据加载状态标记，防止重复加载
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 使用useRef来存储定时器ID，确保清理
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 安全的成功消息显示函数
  const showSuccessMessage = useCallback((content: string) => {
    // 避免重复消息
    if (lastSuccessMessage === content) {
      console.log('跳过重复消息:', content);
      return;
    }
    
    console.log('显示成功消息:', content);
    setLastSuccessMessage(content);
    message.success(content);
    
    // 清理之前的定时器
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    
    // 3秒后清除记录
    messageTimerRef.current = setTimeout(() => {
      setLastSuccessMessage('');
      messageTimerRef.current = null;
    }, 3000);
  }, [lastSuccessMessage]);

  // 自动加载CSV文件 - 修复Vercel部署问题
  const loadCSVData = useCallback(async () => {
    // 防止重复加载
    if (dataLoaded) {
      console.log('数据已加载，跳过重复加载');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始自动加载CSV文件...');
      
      // 尝试多个可能的文件路径
      const possiblePaths = [
        '/22-25_All.csv',
        './22-25_All.csv',
        '/public/22-25_All.csv',
        '/static/22-25_All.csv'
      ];
      
      let csvText = '';
      let successfulPath = '';
      
      // 方法1：尝试多个路径
      for (const path of possiblePaths) {
        try {
          console.log(`尝试路径: ${path}`);
          
          // 检查文件是否存在
          const fileExists = await checkFileExists(path);
          console.log(`路径 ${path} 存在检查:`, fileExists);
          
          if (!fileExists) {
            console.log(`路径 ${path} 文件不存在，跳过`);
            continue;
          }
          
          // 获取文件信息
          const fileInfo = await getFileInfo(path);
          console.log(`路径 ${path} 文件信息:`, fileInfo);
          
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`路径 ${path} 返回状态: ${response.status}`);
            continue;
          }
          
          const contentType = response.headers.get('content-type');
          console.log(`路径 ${path} 内容类型: ${contentType}`);
          
          const text = await response.text();
          console.log(`路径 ${path} 内容前100字符:`, text.substring(0, 100));
          
          // 检查是否返回了HTML而不是CSV
          if (text.includes('<!doctype html>') || text.includes('<html')) {
            console.log(`路径 ${path} 返回HTML，跳过`);
            continue;
          }
          
          // 检查是否包含CSV内容
          if (text.includes('年') && text.includes('月') && text.includes('日')) {
            csvText = text;
            successfulPath = path;
            console.log(`成功使用路径: ${path}`);
            break;
          } else {
            console.log(`路径 ${path} 内容格式不正确`);
          }
        } catch (error) {
          console.log(`路径 ${path} 访问失败:`, error);
        }
      }
      
      // 方法2：如果所有路径都失败，尝试其他方法
      if (!csvText) {
        try {
          console.log('尝试方法2：使用相对路径...');
          const response = await fetch('22-25_All.csv');
          if (response.ok) {
            const text = await response.text();
            if (!text.includes('<!doctype html>') && text.includes('年')) {
              csvText = text;
              successfulPath = '22-25_All.csv';
              console.log('方法2成功');
            }
          }
        } catch (error) {
          console.log('方法2失败:', error);
        }
      }
      
      // 方法3：如果前两种方法都失败，尝试ArrayBuffer方法
      if (!csvText) {
        try {
          console.log('尝试方法3：使用ArrayBuffer...');
          const response = await fetch('/22-25_All.csv');
          if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          console.log('文件大小:', uint8Array.length, '字节');
          
          // 检查BOM
          if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
            console.log('检测到UTF-8 BOM');
            csvText = new TextDecoder('UTF-8').decode(uint8Array.slice(3));
          } else {
            console.log('未检测到BOM，尝试UTF-8解码');
            csvText = new TextDecoder('UTF-8').decode(uint8Array);
          }
          
          console.log('方法3成功，文件内容前100字符:', csvText.substring(0, 100));
          successfulPath = '/22-25_All.csv (ArrayBuffer)';
        } catch (error) {
          console.log('方法3失败:', error);
        }
      }
      
      // 方法4：如果前三种方法都失败，尝试其他编码
      if (!csvText || csvText.includes('锟斤拷')) {
        try {
          console.log('尝试方法4：尝试其他编码...');
          const response = await fetch('/22-25_All.csv');
          if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // 尝试多种编码
          const encodings = ['UTF-8', 'GBK', 'GB2312', 'Big5', 'GB18030'];
          for (const encoding of encodings) {
            try {
              console.log(`尝试使用 ${encoding} 编码...`);
              const decoder = new TextDecoder(encoding);
              const testText = decoder.decode(uint8Array);
              
              if (!testText.includes('锟斤拷') && !testText.includes('嚙踝蕭')) {
                csvText = testText;
                successfulPath = `/22-25_All.csv (${encoding})`;
                console.log(`成功使用 ${encoding} 编码`);
                break;
              } else {
                console.log(`${encoding} 编码出现乱码`);
              }
            } catch (error) {
              console.log(`${encoding} 编码失败:`, error);
            }
          }
        } catch (error) {
          console.log('方法4失败:', error);
        }
      }
      
      // 检查最终结果
      if (!csvText) {
        throw new Error(`无法访问CSV文件。尝试的路径: ${possiblePaths.join(', ')}`);
      }
      
      if (csvText.includes('<!doctype html>') || csvText.includes('<html')) {
        throw new Error('服务器返回HTML页面而不是CSV文件，请检查文件路径');
      }
      
      if (csvText.includes('锟斤拷') || csvText.includes('嚙踝蕭')) {
        throw new Error('文件内容包含乱码，编码解析失败');
      }
      
      // 检查文件内容是否包含预期的列名
      if (!csvText.includes('年') || !csvText.includes('月') || !csvText.includes('日')) {
        throw new Error('文件内容格式不正确，未找到预期的列名');
      }
      
      console.log('文件读取成功，开始解析...');
      console.log('成功路径:', successfulPath);
      console.log('文件内容前500字符:', csvText.substring(0, 500));
      
      // 创建File对象用于解析
      const file = new File([csvText], '22-25_All.csv', { type: 'text/csv' });
      
      console.log('开始解析主CSV文件...');
      const parsedData = await parseCSVFile(file);
      console.log('主CSV解析完成，数据条数:', parsedData.length);
      
      if (parsedData.length === 0) {
        throw new Error('CSV文件解析后没有有效数据，请检查文件格式');
      }
      
      // 添加数据验证
      validateParsedData(parsedData);
      
      // 验证数据 - 限制验证数量
      const validation = validateData(parsedData.slice(0, 1000)); // 只验证前1000行
      if (!validation.isValid) {
        console.warn('数据验证发现问题:', validation.errors.slice(0, 10)); // 只显示前10个错误
        // 继续处理，不中断
      }
      
      // 计算实际数据范围
      const actualDataRange = getActualDataRange(parsedData);
      console.log('实际数据范围:', actualDataRange);
      setDataDateRange(`${actualDataRange.start} ~ ${actualDataRange.end}`);
      
      setData(parsedData);
      setFilteredData(parsedData);
      
      // 设置默认时间范围为数据的第一天
      const defaultStart = dayjs(actualDataRange.start).format('YYYY-MM-DD');
      setTimeRange({
        start: defaultStart,
        end: defaultStart,
        type: 'day'
      });
      
      // 标记数据已加载
      setDataLoaded(true);
      
      // 只在这里调用一次成功消息
      showSuccessMessage(`成功加载 ${parsedData.length} 条数据记录`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '数据加载失败';
      console.error('数据加载错误:', err);
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showSuccessMessage, dataLoaded]);

  // 组件挂载时自动加载数据 - 确保只执行一次
  useEffect(() => {
    console.log('=== App组件挂载 ===');
    console.log('数据加载状态:', dataLoaded);
    console.log('当前时间:', new Date().toISOString());
    
    if (!dataLoaded) {
      console.log('开始加载数据...');
      loadCSVData();
    } else {
      console.log('数据已加载，跳过重复加载');
    }
    
    return () => {
      console.log('=== App组件卸载 ===');
    };
  }, [dataLoaded, loadCSVData]); // 添加依赖，但loadCSVData已经用useCallback包装

  // 组件卸载时清理定时器
  useEffect(() => {
    console.log('=== 设置清理定时器 ===');
    return () => {
      console.log('=== 清理定时器 ===');
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        console.log('定时器已清理');
      }
    };
  }, []);

  // 添加数据状态变化监听
  useEffect(() => {
    console.log('=== 数据状态变化 ===');
    console.log('数据条数:', data.length);
    console.log('过滤后数据条数:', filteredData.length);
    console.log('加载状态:', loading);
    console.log('错误状态:', error);
  }, [data.length, filteredData.length, loading, error]);

  const handleTimeRangeUpdate = useCallback((newTimeRange: TimeRange) => {
    console.log('时间范围更新:', newTimeRange);
    setTimeRange(newTimeRange);
    
    if (data.length > 0) {
      const filtered = filterDataByTimeRange(data, newTimeRange);
      setFilteredData(filtered);
      console.log('数据过滤完成，过滤后数据量:', filtered.length);
    }
  }, [data]);

  const handleFeatureChange = useCallback((features: string[]) => {
    console.log('特征选择更新:', features);
    setSelectedFeatures(features);
  }, []);

  const handleRefresh = useCallback(() => {
    if (data.length > 0) {
      const filtered = filterDataByTimeRange(data, timeRange);
      setFilteredData(filtered);
      showSuccessMessage('数据已刷新');
    }
  }, [data, timeRange, showSuccessMessage]);

  const handleClearData = useCallback(() => {
    setData([]);
    setFilteredData([]);
    setSelectedFeatures([]);
    setTimeRange({
      start: '2022-01-01',
      end: '2022-01-01',
      type: 'day'
    });
    setError(null);
    setDataLoaded(false); // 重置数据加载状态
    showSuccessMessage('数据已清除');
  }, [showSuccessMessage]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: isDarkTheme ? '#001529' : '#fff',
          color: isDarkTheme ? '#fff' : '#000',
          borderBottom: '1px solid #d9d9d9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>电力数据可视化系统</h1>
            {dataDateRange && (
              <span style={{ fontSize: '14px', color: isDarkTheme ? '#ccc' : '#666' }}>
                数据范围: {dataDateRange}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>深色主题</span>
            <Switch checked={isDarkTheme} onChange={setIsDarkTheme} />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              disabled={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleClearData}
              danger
            >
              清除数据
            </Button>
          </div>
        </Header>

        <Layout>
          <Sider 
            width={350} 
            style={{ 
              background: isDarkTheme ? '#1f1f1f' : '#fff',
              borderRight: `1px solid ${isDarkTheme ? '#333' : '#f0f0f0'}`
            }}
          >
            <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Spin size="large" tip="正在加载数据..." />
                  <div style={{ marginTop: '16px', color: isDarkTheme ? '#ccc' : '#666' }}>
                    正在加载电力数据，请稍候...
                  </div>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: isDarkTheme ? '#2a2a2a' : '#fff2f0',
                    border: `1px solid ${isDarkTheme ? '#ff4d4f' : '#ffccc7'}`,
                    borderRadius: '6px',
                    color: isDarkTheme ? '#ff4d4f' : '#cf1322'
                  }}>
                    <h3>数据加载失败</h3>
                    <p>{error}</p>
                    <Button 
                      type="primary" 
                      onClick={loadCSVData}
                      style={{ marginTop: '16px' }}
                    >
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 时间范围选择模块 */}
                  <TimeSelector
                    data={data}
                    timeRange={timeRange}
                    onTimeRangeChange={handleTimeRangeUpdate}
                  />
                  
                  {/* 数据可视化模块 */}
                  <div style={{ marginTop: '16px' }}>
                    <FeatureSelector
                      selectedFeatures={selectedFeatures}
                      onFeatureChange={handleFeatureChange}
                    />
                  </div>
                </>
              )}
            </div>
          </Sider>

          <Content style={{ 
            background: isDarkTheme ? '#1f1f1f' : '#f5f5f5',
            padding: '16px'
          }}>
            <PowerChart
              data={filteredData}
              selectedFeatures={selectedFeatures}
              loading={loading}
              error={error}
              theme={isDarkTheme ? 'dark' : 'light'}
              timeRangeType={timeRange.type}
              onRefresh={handleRefresh}
            />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App; 