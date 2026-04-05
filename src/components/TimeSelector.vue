<template>
  <a-card title="时间范围选择" size="small">
    <a-space direction="vertical" style="width: 100%;">
      <div>
        <label>时间类型:</label>
        <a-select
          :value="timeRange.type"
          style="width: 100%; margin-top: 8px;"
          @change="handleTypeChange"
        >
          <a-select-option value="day">单日</a-select-option>
          <a-select-option value="month">月度</a-select-option>
          <a-select-option value="quarter">季度</a-select-option>
          <a-select-option value="year">年度</a-select-option>
          <a-select-option value="custom">任意选择</a-select-option>
        </a-select>
      </div>

      <div>
        <label>日期选择:</label>
        <div v-if="timeRange.type === 'day'">
          <a-date-picker
            v-model:value="selectedDate"
            format="YYYY-MM-DD"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            :default-picker-value="defaultPanelDate"
            style="width: 100%;"
            @change="handleDayChange"
          />
        </div>

        <div v-else-if="timeRange.type === 'month'">
          <a-date-picker
            v-model:value="selectedMonth"
            picker="month"
            format="YYYY-MM"
            placeholder="选择月份"
            :disabled-date="disabledDate"
            :default-picker-value="defaultPanelDate"
            style="width: 100%;"
            @change="handleMonthChange"
          />
        </div>

        <div v-else-if="timeRange.type === 'quarter'">
          <a-select
            :value="selectedQuarter ? `${selectedQuarter.year}-Q${selectedQuarter.quarter}` : undefined"
            placeholder="选择季度"
            style="width: 100%;"
            @change="handleQuarterChange"
          >
            <a-select-option v-for="opt in getQuarterOptions()" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </div>

        <div v-else-if="timeRange.type === 'year'">
          <a-select
            :value="selectedYear"
            placeholder="选择年份"
            style="width: 100%;"
            @change="handleYearChange"
          >
            <a-select-option v-for="y in getYearOptions()" :key="y.value" :value="y.value">
              {{ y.label }}
            </a-select-option>
          </a-select>
        </div>

        <div v-else-if="timeRange.type === 'custom'">
          <a-range-picker
            v-model:value="customDateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            :disabled-date="disabledDate"
            :default-picker-value="defaultPanelDate"
            style="width: 100%;"
            @change="handleCustomRangeChange"
          />
        </div>
      </div>

      <div v-if="actualDataRange" style="font-size: 12px; color: #666;">
        数据范围: {{ actualDataRange.start }} ~ {{ actualDataRange.end }}
      </div>
    </a-space>
  </a-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { getActualDataRange, getAvailableTimeOptions } from '../utils/dataUtils';

dayjs.extend(quarterOfYear);

const props = defineProps({
  timeRange: {
    type: Object,
    required: true
  },
  onTimeRangeChange: {
    type: Function,
    default: null
  },
  data: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['timeRangeChange']);

const selectedDate = ref(null);
const selectedMonth = ref(null);
const selectedQuarter = ref(null);
const selectedYear = ref(null);
const customDateRange = ref(null);

const actualDataRange = computed(() => (props.data.length > 0 ? getActualDataRange(props.data) : null));
const availableOptions = computed(() => getAvailableTimeOptions(props.data));
const defaultPanelDate = dayjs('2025-07-01');

watch(
  () => props.timeRange.type,
  () => {
    selectedDate.value = null;
    selectedMonth.value = null;
    selectedQuarter.value = null;
    selectedYear.value = null;
    customDateRange.value = null;
  }
);

function emitChange(next) {
  emit('timeRangeChange', next);
  props.onTimeRangeChange?.(next);
}

function handleTypeChange(type) {
  if (!actualDataRange.value) return;

  const defaultDate = dayjs(actualDataRange.value.start);
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

  emitChange({ start, end, type });
}

function disabledDate(date) {
  if (!actualDataRange.value) return false;
  const dataStart = dayjs(actualDataRange.value.start);
  const dataEnd = dayjs(actualDataRange.value.end);
  return date.isBefore(dataStart, 'day') || date.isAfter(dataEnd, 'day');
}

function limitDateToDataRange(date, isEndDate = false) {
  if (!actualDataRange.value) return date;
  const dataStart = dayjs(actualDataRange.value.start);
  const dataEnd = dayjs(actualDataRange.value.end);

  if (isEndDate) {
    return date.isAfter(dataEnd) ? dataEnd : date;
  }
  return date.isBefore(dataStart) ? dataStart : date;
}

function handleDayChange(date) {
  if (!date || !actualDataRange.value) return;
  selectedDate.value = date;
  emitChange({
    start: date.format('YYYY-MM-DD'),
    end: date.format('YYYY-MM-DD'),
    type: 'day'
  });
}

function handleMonthChange(date) {
  if (!date || !actualDataRange.value) return;
  selectedMonth.value = date;
  emitChange({
    start: date.startOf('month').format('YYYY-MM-DD'),
    end: limitDateToDataRange(date.endOf('month'), true).format('YYYY-MM-DD'),
    type: 'month'
  });
}

function handleQuarterChange(value) {
  if (!value || !actualDataRange.value) return;

  const [year, quarter] = value.split('-Q');
  const yearNum = parseInt(year, 10);
  const quarterNum = parseInt(quarter, 10);
  const quarterStartMonth = (quarterNum - 1) * 3 + 1;
  const quarterEndMonth = quarterNum * 3;

  const quarterStartDate = dayjs(`${yearNum}-${String(quarterStartMonth).padStart(2, '0')}-01`);
  const quarterEndDate = dayjs(`${yearNum}-${String(quarterEndMonth).padStart(2, '0')}-01`).endOf('month');
  const limitedEndDate = limitDateToDataRange(quarterEndDate, true);

  selectedQuarter.value = { year: yearNum, quarter: quarterNum };
  emitChange({
    start: quarterStartDate.format('YYYY-MM-DD'),
    end: limitedEndDate.format('YYYY-MM-DD'),
    type: 'quarter'
  });
}

function handleYearChange(year) {
  if (!year || !actualDataRange.value) return;

  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  const yearStart = dayjs(`${yearNum}-01-01`);
  const yearEnd = dayjs(`${yearNum}-12-31`);
  const limitedEndDate = limitDateToDataRange(yearEnd, true);

  selectedYear.value = yearNum;
  emitChange({
    start: yearStart.format('YYYY-MM-DD'),
    end: limitedEndDate.format('YYYY-MM-DD'),
    type: 'year'
  });
}

function handleCustomRangeChange(dates) {
  if (!dates || dates.length !== 2) return;
  const [startDate, endDate] = dates;
  customDateRange.value = dates;
  emitChange({
    start: startDate.format('YYYY-MM-DD'),
    end: endDate.format('YYYY-MM-DD'),
    type: 'custom'
  });
}

function getQuarterOptions() {
  return availableOptions.value.quarters.map(({ year, quarter }) => {
    const quarterStartMonth = (quarter - 1) * 3 + 1;
    const quarterEndMonth = quarter * 3;
    const quarterNames = ['第一季度', '第二季度', '第三季度', '第四季度'];
    return {
      value: `${year}-Q${quarter}`,
      label: `${year}年${quarterNames[quarter - 1]} (${quarterStartMonth}月-${quarterEndMonth}月)`
    };
  });
}

function getYearOptions() {
  return availableOptions.value.years.map((year) => ({ value: year, label: `${year}年` }));
}
</script>
