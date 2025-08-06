import React, { useState, useCallback } from 'react';
import { Layout, ConfigProvider, Switch, Button, message, theme, Upload, Spin, Alert } from 'antd';
import { ClearOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TimeSelector from './components/TimeSelector';
import FeatureSelector from './components/FeatureSelector';
import PowerChart from './components/PowerChart';
import { PowerData, TimeRange } from './types';
import { filterDataByTimeRange, parseCSVFile, validateData, validateParsedData, getActualDataRange, validatePredictionData } from './utils/dataUtils';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [dataDateRange, setDataDateRange] = useState<string>('');

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始解析CSV文件:', file.name);
      
      // 解析CSV文件
      const parsedData = await parseCSVFile(file);
      console.log('CSV解析完成，数据量:', parsedData.length);
      
      if (parsedData.length === 0) {
        throw new Error('CSV文件解析后没有有效数据，请检查文件格式');
      }
      
      // 验证解析后的数据
      validateParsedData(parsedData);
      
      // 验证预测数据
      const predictionValidation = validatePredictionData(parsedData);
      if (!predictionValidation.isValid) {
        console.warn('预测数据验证警告:', predictionValidation.errors);
        message.warning(`预测数据验证发现 ${predictionValidation.errors.length} 个问题`);
      }
      
      // 验证数据完整性
      const validation = validateData(parsedData.slice(0, 1000));
      if (!validation.isValid) {
        console.warn('数据验证警告:', validation.errors.slice(0, 10));
        message.warning(`数据验证发现 ${validation.errors.length} 个问题，但继续处理`);
      }
      
      // 计算实际数据范围
      const actualDataRange = getActualDataRange(parsedData);
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
      
      message.success(`成功加载 ${parsedData.length} 条数据记录`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件解析失败';
      console.error('文件解析错误:', err);
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



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
      message.success('数据已刷新');
    }
  }, [data, timeRange]);

  const handleClearData = useCallback(() => {
    setData([]);
    setFilteredData([]);
    setSelectedFeatures([
      '实际直调负荷', '实际风电总加', '实际光伏总加', '直调负荷差值', '价格差值'
    ]);
    setTimeRange({
      start: '2022-01-01',
      end: '2022-01-01',
      type: 'day'
    });
    setError(null);
    message.success('数据已清除');
  }, []);

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
                </div>
              ) : data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Upload.Dragger
                    accept=".csv"
                    beforeUpload={(file) => {
                      handleFileUpload(file);
                      return false;
                    }}
                    showUploadList={false}
                    disabled={loading}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text" style={{ color: isDarkTheme ? '#fff' : '#333' }}>
                      点击或拖拽CSV文件到此区域上传
                    </p>
                    <p className="ant-upload-hint" style={{ color: isDarkTheme ? '#ccc' : '#666' }}>
                      支持电力数据CSV文件格式
                    </p>
                  </Upload.Dragger>
                  
                  {error && (
                    <div style={{ marginTop: '20px' }}>
                      <Alert
                        message="数据加载错误"
                        description={error}
                        type="error"
                        showIcon
                        action={
                          <Button size="small" danger onClick={() => setError(null)}>
                            关闭
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* 时间范围选择模块 - 移到上面 */}
                  <TimeSelector
                    data={data}
                    timeRange={timeRange}
                    onTimeRangeChange={handleTimeRangeUpdate}
                  />
                  
                  {/* 数据可视化模块 - 移到下面 */}
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