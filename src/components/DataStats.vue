<template>
  <a-card title="数据统计信息" class="stats-container">
    <a-row :gutter="16" style="margin-bottom: 16px;">
      <a-col :span="6">
        <a-statistic title="总记录数" :value="totalStats.totalRecords" suffix="条" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="筛选记录数" :value="stats.totalRecords" suffix="条" />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="数据覆盖率"
          :value="totalStats.totalRecords > 0 ? ((stats.totalRecords / totalStats.totalRecords) * 100).toFixed(1) : 0"
          suffix="%"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic title="特征数量" :value="stats.features.length" suffix="个" />
      </a-col>
    </a-row>

    <a-table
      :columns="columns"
      :data-source="stats.features"
      row-key="feature"
      :pagination="false"
      size="small"
      :scroll="{ x: 800 }"
    />
  </a-card>
</template>

<script setup>
import { computed, h } from 'vue';
import { calculateStats } from '../utils/dataUtils';
import { featureLabels } from '../utils/chartUtils';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  selectedFeatures: {
    type: Array,
    default: () => []
  }
});

const stats = computed(() => calculateStats(props.data));
const totalStats = computed(() => calculateStats(props.data));

const columns = computed(() => [
  {
    title: '特征名称',
    dataIndex: 'feature',
    key: 'feature',
    width: 200,
    customRender: ({ text }) => featureLabels[text] || text
  },
  {
    title: '数据点数',
    dataIndex: 'count',
    key: 'count',
    width: 100,
    customRender: ({ text, record }) => {
      const total = totalStats.value.features.find((item) => item.feature === record.feature);
      return h('span', null, [
        text,
        total
          ? h('span', { style: { fontSize: '12px', color: '#999', marginLeft: 4 } }, `/${total.count}`)
          : null
      ]);
    }
  },
  {
    title: '平均值',
    dataIndex: 'average',
    key: 'average',
    width: 120,
    customRender: ({ text }) => text.toFixed(2)
  },
  {
    title: '最大值',
    dataIndex: 'maximum',
    key: 'maximum',
    width: 120,
    customRender: ({ text }) => text.toFixed(2)
  },
  {
    title: '最小值',
    dataIndex: 'minimum',
    key: 'minimum',
    width: 120,
    customRender: ({ text }) => text.toFixed(2)
  }
]);
</script>
