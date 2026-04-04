<template>
  <div :data-theme="isDarkTheme ? 'dark' : 'light'">
    <a-config-provider
      :theme="{ algorithm: isDarkTheme ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }"
    >
      <a-layout
        style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;"
      >
        <a-layout-header
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDarkTheme ? '#001529' : '#fff',
            color: isDarkTheme ? '#fff' : '#000',
            borderBottom: '1px solid #d9d9d9'
          }"
        >
          <div style="display: flex; align-items: center; gap: 20px;">
            <h1 style="margin: 0; font-size: 20px;">电力数据可视化系统</h1>
            <span
              v-if="dataDateRange"
              style="font-size: 14px; color: isDarkTheme ? '#ccc' : '#666';"
            >
              数据范围: {{ dataDateRange }}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 14px;">深色主题</span>
            <a-switch v-model:checked="isDarkTheme" />

            <a-button
              :icon="h(ReloadOutlined)"
              @click="handleRefresh"
              :disabled="loading"
            >
              刷新
            </a-button>

            <a-button
              :icon="h(ClearOutlined)"
              @click="handleClearData"
              danger
            >
              清除数据
            </a-button>
          </div>
        </a-layout-header>

        <a-layout style="flex: 1; min-height: 0; overflow: hidden;">
          <a-layout-sider
            :width="350"
            :style="{
              height: '100%',
              overflow: 'hidden',
              background: isDarkTheme ? '#1f1f1f' : '#fff',
              borderRight: `1px solid ${isDarkTheme ? '#333' : '#f0f0f0'}`
            }"
          >
            <div style="padding: 16px; height: 100%; overflow-y: auto;">
              <div v-if="loading" style="text-align: center; padding: 40px 20px;">
                <a-spin size="large" tip="正在加载数据..." />
                <div style="margin-top: 16px; color: isDarkTheme ? '#ccc' : '#666';">
                  正在加载电力数据，请稍候...
                </div>
              </div>

              <div v-else-if="error" style="text-align: center; padding: 40px 20px;">
                <div
                  style="padding: 16px; background-color: #2a2a2a; border: 1px solid #ff4d4f; border-radius: 6px; color: #ff4d4f;"
                  v-if="isDarkTheme"
                >
                  <h3>数据加载失败</h3>
                  <p>{{ error }}</p>
                  <a-button type="primary" @click="loadCSVData" style="margin-top: 16px;">
                    重新加载
                  </a-button>
                </div>

                <div
                  style="padding: 16px; background-color: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; color: #cf1322;"
                  v-else
                >
                  <h3>数据加载失败</h3>
                  <p>{{ error }}</p>
                  <a-button type="primary" @click="loadCSVData" style="margin-top: 16px;">
                    重新加载
                  </a-button>
                </div>
              </div>

              <div v-else>
                <TimeSelector
                  :data="data"
                  :timeRange="timeRange"
                  @timeRangeChange="handleTimeRangeUpdate"
                />

                <div style="margin-top: 16px;">
                  <FeatureSelector
                    :selectedFeatures="selectedFeatures"
                    @featureChange="handleFeatureChange"
                  />
                </div>
              </div>
            </div>
          </a-layout-sider>

          <a-layout-content
            :style="{
              background: isDarkTheme ? '#1f1f1f' : '#f5f5f5',
              padding: '16px',
              height: '100%',
              overflow: 'hidden',
              minHeight: 0
            }"
          >
            <PowerChart
              :data="filteredData"
              :selectedFeatures="selectedFeatures"
              :loading="loading"
              :error="error"
              :theme="isDarkTheme ? 'dark' : 'light'"
              :timeRangeType="timeRange.type"
              @refresh="handleRefresh"
            />
          </a-layout-content>
        </a-layout>
      </a-layout>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h, watch } from 'vue';
import dayjs from 'dayjs';
import { ReloadOutlined, ClearOutlined } from '@ant-design/icons-vue';
import { message, theme as antdTheme } from 'ant-design-vue';

import TimeSelector from './components/TimeSelector.vue';
import FeatureSelector from './components/FeatureSelector.vue';
import PowerChart from './components/PowerChart.vue';

import type { PowerData, TimeRange } from './types';
import {
  filterDataByTimeRange,
  parseCSVFile,
  validateData,
  validateParsedData,
  getActualDataRange,
  checkFileExists,
  getFileInfo
} from './utils/dataUtils';

const data = ref<PowerData[]>([]);
const filteredData = ref<PowerData[]>([]);
const selectedFeatures = ref<string[]>([
  '实际直调负荷',
  '实际风电总加',
  '实际光伏总加',
  '直调负荷差值',
  '价格差值'
]);
const timeRange = ref<TimeRange>({
  start: '2022-01-01',
  end: '2022-01-01',
  type: 'day'
});
const loading = ref(true);
const error = ref<string | null>(null);
const isDarkTheme = ref(false);
const dataDateRange = ref<string>('');

// 添加消息去重机制
const lastSuccessMessage = ref<string>('');
let messageTimer: ReturnType<typeof setTimeout> | null = null;

// 数据加载状态标记，防止重复加载
const dataLoaded = ref(false);

async function loadCSVData() {
  // 防止重复加载
  if (dataLoaded.value) {
    console.log('数据已加载，跳过重复加载');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    console.log('开始自动加载CSV文件...');

    // 尝试多个可能的文件路径
    const possiblePaths = ['/22-25_All.csv', './22-25_All.csv', '/public/22-25_All.csv'];

    let csvText = '';

    // 方法1：逐个路径尝试读取（含存在性/返回HTML跳过）
    for (const path of possiblePaths) {
      try {
        console.log(`尝试路径: ${path}`);

        const fileExists = await checkFileExists(path);
        if (!fileExists) {
          console.log(`路径 ${path} 文件不存在，跳过`);
          continue;
        }

        await getFileInfo(path);
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

        // 简单内容校验
        if (text.includes('年') && text.includes('月') && text.includes('日')) {
          csvText = text;
          console.log(`成功使用路径: ${path}`);
          break;
        } else {
          console.log(`路径 ${path} 内容格式不正确`);
        }
      } catch (e) {
        console.log(`路径 ${path} 访问失败:`, e);
      }
    }

    // 方法2：相对路径兜底
    if (!csvText) {
      try {
        console.log('尝试方法2：使用相对路径...');
        const response = await fetch('22-25_All.csv');
        if (response.ok) {
          const text = await response.text();
          if (!text.includes('<!doctype html>') && text.includes('年')) {
            csvText = text;
          }
        }
      } catch (e) {
        console.log('方法2失败:', e);
      }
    }

    // 方法3：ArrayBuffer + UTF-8/BOM
    if (!csvText) {
      try {
        console.log('尝试方法3：使用ArrayBuffer...');
        const response = await fetch('/22-25_All.csv');
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        if (
          uint8Array.length >= 3 &&
          uint8Array[0] === 0xef &&
          uint8Array[1] === 0xbb &&
          uint8Array[2] === 0xbf
        ) {
          csvText = new TextDecoder('UTF-8').decode(uint8Array.slice(3));
        } else {
          csvText = new TextDecoder('UTF-8').decode(uint8Array);
        }

        console.log('方法3成功，文件内容前100字符:', csvText.substring(0, 100));
      } catch (e) {
        console.log('方法3失败:', e);
      }
    }

    // 方法4：尝试其它编码，处理乱码
    if (!csvText || csvText.includes('锟斤拷')) {
      try {
        console.log('尝试方法4：尝试其他编码...');
        const response = await fetch('/22-25_All.csv');
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const encodings = ['UTF-8', 'GBK', 'GB2312', 'Big5', 'GB18030'];
        for (const encoding of encodings) {
          try {
            const decoder = new TextDecoder(encoding);
            const testText = decoder.decode(uint8Array);

            if (!testText.includes('锟斤拷') && !testText.includes('嚙踝蕭')) {
              csvText = testText;
              console.log(`成功使用 ${encoding} 编码`);
              break;
            } else {
              console.log(`${encoding} 编码出现乱码`);
            }
          } catch (e) {
            console.log(`${encoding} 编码失败:`, e);
          }
        }
      } catch (e) {
        console.log('方法4失败:', e);
      }
    }

    // 最终结果检查
    if (!csvText) {
      throw new Error(`无法访问CSV文件。尝试的路径: ${possiblePaths.join(', ')}`);
    }

    if (csvText.includes('<!doctype html>') || csvText.includes('<html')) {
      throw new Error('服务器返回HTML页面而不是CSV文件，请检查文件路径');
    }

    if (csvText.includes('锟斤拷') || csvText.includes('嚙踝蕭')) {
      throw new Error('文件内容包含乱码，编码解析失败');
    }

    if (!csvText.includes('年') || !csvText.includes('月') || !csvText.includes('日')) {
      throw new Error('文件内容格式不正确，未找到预期的列名');
    }

    const file = new File([csvText], '22-25_All.csv', { type: 'text/csv' });
    const parsedData = await parseCSVFile(file);

    if (parsedData.length === 0) {
      throw new Error('CSV文件解析后没有有效数据，请检查文件格式');
    }

    validateParsedData(parsedData);

    // 验证数据 - 限制验证数量
    const validation = validateData(parsedData.slice(0, 1000));
    if (!validation.isValid) {
      console.warn('数据验证发现问题:', validation.errors.slice(0, 10));
    }

    const actualDataRange = getActualDataRange(parsedData);
    dataDateRange.value = `${actualDataRange.start} ~ ${actualDataRange.end}`;

    data.value = parsedData;
    filteredData.value = parsedData;

    // 默认 timeRange：数据的第一天
    const defaultStart = dayjs(actualDataRange.start).format('YYYY-MM-DD');
    timeRange.value = {
      start: defaultStart,
      end: defaultStart,
      type: 'day'
    };

    dataLoaded.value = true;

    showSuccessMessage(`成功加载 ${parsedData.length} 条数据记录`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '数据加载失败';
    console.error('数据加载错误:', err);
    error.value = errorMessage;
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

function showSuccessMessage(content: string) {
  if (lastSuccessMessage.value === content) {
    console.log('跳过重复消息:', content);
    return;
  }

  lastSuccessMessage.value = content;
  message.success(content);

  if (messageTimer) clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    lastSuccessMessage.value = '';
    messageTimer = null;
  }, 3000);
}

function handleTimeRangeUpdate(newTimeRange: TimeRange) {
  timeRange.value = newTimeRange;

  if (data.value.length > 0) {
    filteredData.value = filterDataByTimeRange(data.value, newTimeRange);
  }
}

function handleFeatureChange(features: string[]) {
  selectedFeatures.value = features;
}

function handleRefresh() {
  if (data.value.length > 0) {
    filteredData.value = filterDataByTimeRange(data.value, timeRange.value);
    showSuccessMessage('数据已刷新');
  }
}

function handleClearData() {
  data.value = [];
  filteredData.value = [];
  selectedFeatures.value = [];
  timeRange.value = {
    start: '2022-01-01',
    end: '2022-01-01',
    type: 'day'
  };
  error.value = null;
  dataLoaded.value = false;
  showSuccessMessage('数据已清除');
}

onMounted(() => {
  if (!dataLoaded.value) {
    loadCSVData();
  }
});

watch(
  () => dataLoaded.value,
  (v) => {
    if (!v) loadCSVData();
  }
);

onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer);
});
</script>

