import React, { useState } from 'react';
import { Card, Checkbox, Space, Button, Tag, message } from 'antd';
import { featureLabels } from '../utils/chartUtils';
import { TimeRange } from '../types';
import dayjs from 'dayjs';

interface FeatureSelectorProps {
  selectedFeatures: string[];
  onFeatureChange: (features: string[]) => void;
  timeRange?: TimeRange;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({ 
  selectedFeatures, 
  onFeatureChange, 
  timeRange,
  onTimeRangeChange 
}) => {
  // 修改默认展开状态，确保差值分组默认展开
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    actual: true,
    prediction: true,
    price: true,
    difference: true, // 差值分组默认展开
    forecast: true // 预测分组默认展开
  });

  // 预测数据的时间范围 - 更新为全范围
  const forecastDataRange = {
    start: '2022-01-01',
    end: '2025-08-31'
  };

  // 检查当前时间范围是否在预测数据范围内
  const isInForecastRange = () => {
    if (!timeRange) return false;
    const currentStart = dayjs(timeRange.start);
    const currentEnd = dayjs(timeRange.end);
    const forecastStart = dayjs(forecastDataRange.start);
    const forecastEnd = dayjs(forecastDataRange.end);
    
    return currentStart.isSameOrAfter(forecastStart, 'day') && 
           currentEnd.isSameOrBefore(forecastEnd, 'day');
  };

  // 检查是否选择了预测特征（已移除未使用的变量）

  // 特征分组 - 使用实际CSV文件的中文字段名
  const featureGroups = {
    actual: {
      title: '实际数据',
      features: [
        '实际直调负荷', '实际联络线受电负荷', '实际风电总加', '实际光伏总加',
        '实际非市场化核电总加', '实际自备机组总加', '实际地方电厂发电总加',
        '实际抽蓄', '实际火力发电'
      ]
    },
    prediction: {
      title: '日前数据',
      features: [
        '日前直调负荷', '日前联络线受电负荷', '日前风电总加', '日前光伏总加',
        '日前非市场化核电总加', '日前自备机组总加', '日前地方电厂发电总加',
        '日前火力发电'
      ]
    },
    price: {
      title: '价格数据',
      features: ['现货价格', '日前价格']
    },
    difference: {
      title: '差值',
      features: [
        '直调负荷差值', '联络线受电负荷差值', '风电总加差值', '光伏总加差值',
        '非市场化核电总加差值', '自备机组总加差值', '地方电厂发电总加差值',
        '火力发电差值', '价格差值'
      ]
    },
    forecast: {
      title: '预测',
      features: ['价格差值预测', '日前价格预测']
    }
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    // 检查是否是预测特征
    const isForecastFeature = ['价格差值预测', '日前价格预测'].includes(feature);
    
    if (checked) {
      const newFeatures = [...selectedFeatures, feature];
      onFeatureChange(newFeatures);
    } else {
      onFeatureChange(selectedFeatures.filter(f => f !== feature));
    }
  };

  const handleSelectAll = (groupKey: string) => {
    const group = featureGroups[groupKey as keyof typeof featureGroups];
    const groupFeatures = group.features;
    const allSelected = groupFeatures.every((f: string) => selectedFeatures.includes(f));
    
    if (allSelected) {
      // 取消全选
      onFeatureChange(selectedFeatures.filter((f: string) => !groupFeatures.includes(f)));
    } else {
      // 全选
      const newSelected = [...selectedFeatures];
      groupFeatures.forEach((f: string) => {
        if (!newSelected.includes(f)) {
          newSelected.push(f);
        }
      });
      onFeatureChange(newSelected);
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const getGroupSelectionStatus = (groupKey: string) => {
    const group = featureGroups[groupKey as keyof typeof featureGroups];
    const groupFeatures = group.features;
    const selectedCount = groupFeatures.filter((f: string) => selectedFeatures.includes(f)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === groupFeatures.length) return 'all';
    return 'partial';
  };

  // 检查特征是否可用 - 预测特征现在全范围可用
  const isFeatureAvailable = (feature: string) => {
    return true; // 所有特征都可用
  };

  return (
    <Card title="数据可视化" className="sidebar-card">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          已选择 {selectedFeatures.length} 个特征
        </div>
        
        {Object.entries(featureGroups).map(([groupKey, group]) => {
          const selectionStatus = getGroupSelectionStatus(groupKey);
          const isExpanded = expandedGroups[groupKey];
          const isForecastGroup = groupKey === 'forecast';
          
          return (
            <div key={groupKey} style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#333'
                }}
                onClick={() => toggleGroup(groupKey)}
              >
                <span>{group.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {group.features.filter(f => selectedFeatures.includes(f)).length}/{group.features.length}
                  </span>
                  <Button 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll(groupKey);
                    }}
                  >
                    {selectionStatus === 'all' ? '取消全选' : '全选'}
                  </Button>
                  <span>{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>
              
              {isExpanded && (
                <div style={{ marginTop: '8px' }}>
                  {group.features.map(feature => {
                    const isSelected = selectedFeatures.includes(feature);
                    const isAvailable = isFeatureAvailable(feature);
                    
                    return (
                      <div key={feature} style={{ marginBottom: '4px' }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleFeatureToggle(feature, e.target.checked)}
                          disabled={!isAvailable}
                          style={{ 
                            color: isAvailable ? '#333' : '#999',
                            fontSize: '12px'
                          }}
                        >
                          {featureLabels[feature] || feature}
                        </Checkbox>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Space>
    </Card>
  );
};

export default FeatureSelector; 