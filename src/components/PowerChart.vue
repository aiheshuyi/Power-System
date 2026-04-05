<template>
  <a-card class="chart-container" :style="{ padding: '20px', margin: '0', height: '100%' }">
    <div
      v-if="loading"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: themeColor;"
    >
      <a-spin size="large" />
      <div style="margin-top: 16px;">正在加载电力数据...</div>
      <div style="margin-top: 8px; font-size: 12px; color: theme === 'dark' ? '#ccc' : '#666';">
        数据范围：2022.1.1 ~ 2025.8.31
      </div>
    </div>

    <div v-else-if="error" class="error-container chart-state-full">
      <a-alert message="数据加载错误" :description="error" type="error" show-icon>
        <template #action>
          <a-button size="small" danger @click="handleRefresh">重试</a-button>
        </template>
      </a-alert>
    </div>

    <div v-else-if="data.length === 0" class="loading-container chart-state-full">
      <a-alert
        message="暂无数据"
        description="请选择时间范围和数据特征来查看图表"
        type="info"
        show-icon
      />
    </div>

    <div v-else-if="selectedFeatures.length === 0" class="loading-container chart-state-full">
      <a-alert
        message="请选择数据特征"
        description="请在左侧面板中选择要显示的数据特征"
        type="warning"
        show-icon
      />
    </div>

    <div v-else-if="!hasValidData" class="loading-container chart-state-full">
      <a-alert
        message="数据验证失败"
        description="选中的特征在当前时间范围内没有有效数据，请检查数据或调整时间范围"
        type="warning"
        show-icon
      />
    </div>

    <div v-else style="position: relative; width: 100%; height: 100%; padding: 10px; min-height: 0;">
      <div ref="chartEl" class="power-chart-echarts" style="height: 100%; width: 100%;" />

      <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
        <a-space>
          <a-button size="small" :icon="h(DownloadOutlined)" type="primary" @click="handleExport">
            导出
          </a-button>
          <a-button size="small" :icon="h(ReloadOutlined)" @click="handleRefresh">
            刷新
          </a-button>
        </a-space>
      </div>

      <div
        style="position: absolute; top: 10px; left: 10px; z-index: 10; font-size: 12px; color: #666; background-color: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px;"
      >
        <div>{{ data.length }} 条记录, {{ selectedFeatures.length }} 个特征</div>
        <div v-if="data.length > 0" style="margin-top: 4px;">
          时间范围:
          {{ dayjs(data[0].timestamp).format('YYYY-MM-DD HH:mm') }} ~
          {{ dayjs(data[data.length - 1].timestamp).format('YYYY-MM-DD HH:mm') }}
        </div>
      </div>

      <div
        v-if="showPriceDebug"
        style="position: absolute; top: 40px; left: 10px; background: rgba(255,255,255,0.9); padding: 8px; border-radius: 4px; font-size: 12px; z-index: 1000; max-width: 300px;"
      >
        <div style="font-weight: bold; margin-bottom: 4px;">价格数据调试信息:</div>
        <div>现货价格范围: {{ priceSpotRange.min }} - {{ priceSpotRange.max }}</div>
        <div>日前价格范围: {{ priceDayAheadRange.min }} - {{ priceDayAheadRange.max }}</div>
        <div>价格差值范围: {{ priceDiffRange.min }} - {{ priceDiffRange.max }}</div>
        <div>数据时间范围: {{ data[0]?.timestamp }} ~ {{ data[data.length - 1]?.timestamp }}</div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, h } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue';

import {
  generateChartConfig,
  generateEChartsOption,
  exportChartAsImage,
  debugMonthTicks,
  debugXAxisConfig,
  debugYearDataDisplay
} from '../utils/chartUtils';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  selectedFeatures: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  theme: {
    type: String,
    default: 'light'
  },
  timeRangeType: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['refresh']);

const chartEl = ref(null);
let chartInstance = null;
let resizeObserver = null;

const themeColor = computed(() => (props.theme === 'dark' ? '#fff' : '#333'));
const chartConfig = computed(() => generateChartConfig(props.data, props.selectedFeatures, props.theme, props.timeRangeType));
const chartOption = computed(() => generateEChartsOption(chartConfig.value, props.theme));

const shouldShowChart = computed(
  () => !props.loading && !props.error && props.data.length > 0 && props.selectedFeatures.length > 0 && hasValidData.value
);

const hasValidData = computed(() => chartConfig.value.series.some((series) => series.data.some((value) => value > 0)));

const showPriceDebug = computed(
  () => props.selectedFeatures.includes('现货价格') || props.selectedFeatures.includes('日前价格')
);

const priceSpotRange = computed(() => {
  if (!props.data.length) return { min: 0, max: 0 };
  const arr = props.data.map((item) => item.现货价格);
  return { min: Math.min(...arr).toFixed(2), max: Math.max(...arr).toFixed(2) };
});

const priceDayAheadRange = computed(() => {
  if (!props.data.length) return { min: 0, max: 0 };
  const arr = props.data.map((item) => item.日前价格);
  return { min: Math.min(...arr).toFixed(2), max: Math.max(...arr).toFixed(2) };
});

const priceDiffRange = computed(() => {
  if (!props.data.length) return { min: 0, max: 0 };
  const arr = props.data.map((item) => item.价格差值);
  return { min: Math.min(...arr).toFixed(2), max: Math.max(...arr).toFixed(2) };
});

function handleRefresh() {
  emit('refresh');
}

function handleExport() {
  if (!chartInstance) return;
  exportChartAsImage(chartInstance);
}

function initChart() {
  if (!chartEl.value) return;
  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(chartEl.value, undefined, { renderer: 'canvas' });
}

function renderChart() {
  if (!chartInstance) return;
  chartInstance.setOption(chartOption.value, true);
  chartInstance.resize();
}

watch(
  shouldShowChart,
  async (value) => {
    if (!value) {
      chartInstance?.dispose();
      chartInstance = null;
      return;
    }

    await nextTick();
    initChart();
    renderChart();
    chartInstance?.resize();
  },
  { immediate: true }
);

watch(
  () => [props.data.length, props.selectedFeatures.join(','), props.theme, props.timeRangeType],
  async () => {
    if (!shouldShowChart.value) return;
    await nextTick();
    renderChart();
    chartInstance?.resize();
  }
);

watch(
  () => props.timeRangeType,
  () => {
    debugXAxisConfig(props.timeRangeType, props.data.length);
    if (props.timeRangeType === 'quarter' || props.timeRangeType === 'year') {
      debugMonthTicks(props.data, props.timeRangeType);
    }
    if (props.timeRangeType === 'year') {
      debugYearDataDisplay(props.data, props.timeRangeType, chartConfig.value.xAxis.length);
    }
  },
  { immediate: true }
);

watch(
  () => props.theme,
  async () => {
    await nextTick();
    if (chartInstance) renderChart();
  }
);

const onResize = () => {
  chartInstance?.resize();
};

onMounted(async () => {
  await nextTick();
  window.addEventListener('resize', onResize);
  if (chartEl.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(chartEl.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});
</script>
