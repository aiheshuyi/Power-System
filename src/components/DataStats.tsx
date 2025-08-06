import React from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import { PowerData } from '../types';
import { calculateStats } from '../utils/dataUtils';
import { featureLabels } from '../utils/chartUtils';

interface DataStatsProps {
  data: PowerData[];
  selectedFeatures: string[];
}

const DataStats: React.FC<DataStatsProps> = ({ data, selectedFeatures }) => {
  const stats = calculateStats(data);
  const totalStats = calculateStats(data);

  const columns = [
    {
      title: '特征名称',
      dataIndex: 'feature',
      key: 'feature',
      render: (feature: string) => featureLabels[feature] || feature,
      width: 200
    },
    {
      title: '数据点数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (count: number, record: any) => (
        <span>
          {count}
          {totalStats.features.find((f: any) => f.feature === record.feature) && (
            <span style={{ fontSize: '12px', color: '#999', marginLeft: 4 }}>
              /{totalStats.features.find((f: any) => f.feature === record.feature)?.count}
            </span>
          )}
        </span>
      )
    },
    {
      title: '平均值',
      dataIndex: 'average',
      key: 'average',
      width: 120,
      render: (value: number) => value.toFixed(2)
    },
    {
      title: '最大值',
      dataIndex: 'maximum',
      key: 'maximum',
      width: 120,
      render: (value: number) => value.toFixed(2)
    },
    {
      title: '最小值',
      dataIndex: 'minimum',
      key: 'minimum',
      width: 120,
      render: (value: number) => value.toFixed(2)
    }
  ];

  return (
    <Card title="数据统计信息" className="stats-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="总记录数"
            value={totalStats.totalRecords}
            suffix="条"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="筛选记录数"
            value={stats.totalRecords}
            suffix="条"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="数据覆盖率"
            value={totalStats.totalRecords > 0 ? ((stats.totalRecords / totalStats.totalRecords) * 100).toFixed(1) : 0}
            suffix="%"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="特征数量"
            value={stats.features.length}
            suffix="个"
          />
        </Col>
      </Row>
      
      <Table
        columns={columns}
        dataSource={stats.features}
        rowKey="feature"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default DataStats; 