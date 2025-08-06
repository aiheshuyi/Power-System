import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Space } from 'antd';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { TimeRange, PowerData } from '../types';
import { getActualDataRange, getAvailableTimeOptions } from '../utils/dataUtils';

dayjs.extend(quarterOfYear);

const { Option } = Select;

interface TimeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  dataDateRange?: { start: string; end: string } | null;
  data: PowerData[];
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  timeRange, 
  onTimeRangeChange, 
  dataDateRange,
  data
}) => {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<{year: number, quarter: number} | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // 获取实际数据范围
  const actualDataRange = data.length > 0 ? getActualDataRange(data) : null;
  const availableOptions = getAvailableTimeOptions(data);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedMonth(null);
    setSelectedQuarter(null);
    setSelectedYear(null);
    setCustomDateRange(null);
  }, [timeRange.type]);

  const handleTypeChange = (type: 'day' | 'month' | 'quarter' | 'year' | 'custom') => {
    if (!actualDataRange) return;
    const defaultDate = dayjs(actualDataRange.start);
    let start = '';
    let end = '';
    switch (type) {
      case 'day':
        start = defaultDate.format('YYYY-MM-DD');
        end = defaultDate.format('YYYY-MM-DD');
        break;
      case 'month':
        start = defaultDate.startOf('month').format('YYYY-MM-DD');
        end = limitDateToDataRange(defaultDate.endOf('month'), true).format('YYYY-MM-DD');
        break;
      case 'quarter':
        start = defaultDate.startOf('quarter').format('YYYY-MM-DD');
        end = limitDateToDataRange(defaultDate.endOf('quarter'), true).format('YYYY-MM-DD');
        break;
      case 'year':
        start = defaultDate.startOf('year').format('YYYY-MM-DD');
        end = limitDateToDataRange(defaultDate.endOf('year'), true).format('YYYY-MM-DD');
        break;
      case 'custom':
        start = defaultDate.format('YYYY-MM-DD');
        end = defaultDate.format('YYYY-MM-DD');
        break;
    }
    onTimeRangeChange({ start, end, type });
  };

  // 统一的日期禁用函数
  const disabledDate = (date: dayjs.Dayjs) => {
    if (!actualDataRange) return false;
    const dataStart = dayjs(actualDataRange.start);
    const dataEnd = dayjs(actualDataRange.end);
    return date.isBefore(dataStart, 'day') || date.isAfter(dataEnd, 'day');
  };

  // 限制日期范围在数据范围内
  const limitDateToDataRange = (date: dayjs.Dayjs, isEndDate: boolean = false) => {
    if (!actualDataRange) return date;
    const dataStart = dayjs(actualDataRange.start);
    const dataEnd = dayjs(actualDataRange.end);
    
    if (isEndDate) {
      return date.isAfter(dataEnd) ? dataEnd : date;
    } else {
      return date.isBefore(dataStart) ? dataStart : date;
    }
  };

  const handleDayChange = (date: dayjs.Dayjs | null) => {
    if (date && actualDataRange) {
      setSelectedDate(date);
      const start = date.format('YYYY-MM-DD');
      const end = date.format('YYYY-MM-DD');
      onTimeRangeChange({ start, end, type: 'day' });
    }
  };

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date && actualDataRange) {
      setSelectedMonth(date);
      const start = date.startOf('month').format('YYYY-MM-DD');
      const end = limitDateToDataRange(date.endOf('month'), true).format('YYYY-MM-DD');
      onTimeRangeChange({ start, end, type: 'month' });
    }
  };

  const handleQuarterChange = (value: string) => {
    if (value && actualDataRange) {
      const [year, quarter] = value.split('-Q');
      const quarterNum = parseInt(quarter);
      const yearNum = parseInt(year);
      
      // 计算季度的正确开始和结束月份
      const quarterStartMonth = (quarterNum - 1) * 3 + 1;
      const quarterEndMonth = quarterNum * 3;
      
      const quarterStartDate = dayjs(`${yearNum}-${quarterStartMonth.toString().padStart(2, '0')}-01`);
      const quarterEndDate = dayjs(`${yearNum}-${quarterEndMonth.toString().padStart(2, '0')}-01`).endOf('month');
      
      // 限制结束日期在数据范围内
      const limitedEndDate = limitDateToDataRange(quarterEndDate, true);
      
      console.log('季度选择:', {
        year: yearNum,
        quarter: quarterNum,
        startMonth: quarterStartMonth,
        endMonth: quarterEndMonth,
        startDate: quarterStartDate.format('YYYY-MM-DD'),
        endDate: limitedEndDate.format('YYYY-MM-DD'),
        originalEndDate: quarterEndDate.format('YYYY-MM-DD')
      });
      
      setSelectedQuarter({ year: yearNum, quarter: quarterNum });
      const start = quarterStartDate.format('YYYY-MM-DD');
      const end = limitedEndDate.format('YYYY-MM-DD');
      onTimeRangeChange({ start, end, type: 'quarter' });
    }
  };

  const handleYearChange = (year: number | null) => {
    if (year && actualDataRange) {
      const yearStart = dayjs(`${year}-01-01`);
      const yearEnd = dayjs(`${year}-12-31`);
      
      // 限制结束日期在数据范围内
      const limitedEndDate = limitDateToDataRange(yearEnd, true);
      
      console.log('年度选择:', {
        year,
        startDate: yearStart.format('YYYY-MM-DD'),
        endDate: limitedEndDate.format('YYYY-MM-DD'),
        originalEndDate: yearEnd.format('YYYY-MM-DD'),
        actualDataRange
      });
      
      setSelectedYear(year);
      const start = yearStart.format('YYYY-MM-DD');
      const end = limitedEndDate.format('YYYY-MM-DD');
      onTimeRangeChange({ start, end, type: 'year' });
    }
  };

  const handleCustomRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      setCustomDateRange(dates);
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      onTimeRangeChange({ start, end, type: 'custom' });
    }
  };

  const getQuarterOptions = () => {
    return availableOptions.quarters.map(({ year, quarter }) => {
      const quarterStartMonth = (quarter - 1) * 3 + 1;
      const quarterEndMonth = quarter * 3;
      const quarterNames = ['第一季度', '第二季度', '第三季度', '第四季度'];
      
      return (
        <Option key={`${year}-Q${quarter}`} value={`${year}-Q${quarter}`}>
          {year}年{quarterNames[quarter - 1]} ({quarterStartMonth}月-{quarterEndMonth}月)
        </Option>
      );
    });
  };

  const getYearOptions = () => {
    return availableOptions.years.map(year => (
      <Option key={year} value={year}>
        {year}年
      </Option>
    ));
  };

  const renderDateSelector = () => {
    if (!actualDataRange) return null;
    
    // 设置默认面板日期为2025年7月
    const defaultPanelDate = dayjs('2025-07-01');
    
    switch (timeRange.type) {
      case 'day':
        return (
          <DatePicker
            value={selectedDate}
            onChange={handleDayChange}
            format="YYYY-MM-DD"
            placeholder="选择日期"
            disabledDate={disabledDate}
            defaultPickerValue={defaultPanelDate}
            style={{ width: '100%' }}
          />
        );
      case 'month':
        return (
          <DatePicker
            value={selectedMonth}
            onChange={handleMonthChange}
            format="YYYY-MM"
            picker="month"
            placeholder="选择月份"
            disabledDate={disabledDate}
            defaultPickerValue={defaultPanelDate}
            style={{ width: '100%' }}
          />
        );
      case 'quarter':
        return (
          <Select
            value={selectedQuarter ? `${selectedQuarter.year}-Q${selectedQuarter.quarter}` : undefined}
            onChange={handleQuarterChange}
            placeholder="选择季度"
            style={{ width: '100%' }}
          >
            {getQuarterOptions()}
          </Select>
        );
      case 'year':
        return (
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            placeholder="选择年份"
            style={{ width: '100%' }}
          >
            {getYearOptions()}
          </Select>
        );
      case 'custom':
        return (
          <DatePicker.RangePicker
            value={customDateRange}
            onChange={handleCustomRangeChange}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            disabledDate={disabledDate}
            defaultPickerValue={defaultPanelDate}
            style={{ width: '100%' }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card title="时间范围选择" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <label>时间类型:</label>
          <Select
            value={timeRange.type}
            onChange={handleTypeChange}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="day">单日</Option>
            <Option value="month">月度</Option>
            <Option value="quarter">季度</Option>
            <Option value="year">年度</Option>
            <Option value="custom">任意选择</Option>
          </Select>
        </div>
        
        <div>
          <label>日期选择:</label>
          {renderDateSelector()}
        </div>
        
        {actualDataRange && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            数据范围: {actualDataRange.start} ~ {actualDataRange.end}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default TimeSelector; 