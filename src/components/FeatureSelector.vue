<template>
  <a-card title="数据可视化" class="sidebar-card">
    <a-space direction="vertical" style="width: 100%;">
      <div style="font-size: 12px; color: #666;">
        已选择 {{ selectedFeatures.length }} 个特征
      </div>

      <div v-for="(group, groupKey) in featureGroups" :key="groupKey" style="border: 1px solid #d9d9d9; border-radius: 6px; padding: 8px;">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            font-weight: bold;
            color: #333;
          "
          @click="toggleGroup(groupKey)"
        >
          <span>{{ group.title }}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: #666;">
              {{ group.features.filter((f) => selectedFeatures.includes(f)).length }}/{{ group.features.length }}
            </span>

            <a-button
              size="small"
              @click.stop="handleSelectAll(groupKey)"
            >
              {{ getGroupSelectionStatus(groupKey) === 'all' ? '取消全选' : '全选' }}
            </a-button>

            <span>{{ expandedGroups[groupKey] ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="expandedGroups[groupKey]" style="margin-top: 8px;">
          <div v-for="feature in group.features" :key="feature" style="margin-bottom: 4px;">
            <a-checkbox
              :checked="selectedFeatures.includes(feature)"
              :disabled="!isFeatureAvailable(feature)"
              style="color: #333; font-size: 12px;"
              @change="(e: any) => handleFeatureToggle(feature, e?.target?.checked)"
            >
              {{ featureLabels[feature] || feature }}
            </a-checkbox>
          </div>
        </div>
      </div>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TimeRange } from '../types';
import { featureLabels } from '../utils/chartUtils';

const props = defineProps<{
  selectedFeatures: string[];
  timeRange?: TimeRange;
}>();

const emit = defineEmits<{
  (e: 'featureChange', features: string[]): void;
}>();

const expandedGroups = ref<Record<string, boolean>>({
  actual: true,
  prediction: true,
  price: true,
  difference: true,
  forecast: true
});

const featureGroups = {
  actual: {
    title: '实际数据',
    features: [
      '实际直调负荷',
      '实际联络线受电负荷',
      '实际风电总加',
      '实际光伏总加',
      '实际非市场化核电总加',
      '实际自备机组总加',
      '实际地方电厂发电总加',
      '实际抽蓄',
      '实际火力发电'
    ]
  },
  prediction: {
    title: '日前数据',
    features: [
      '日前直调负荷',
      '日前联络线受电负荷',
      '日前风电总加',
      '日前光伏总加',
      '日前非市场化核电总加',
      '日前自备机组总加',
      '日前地方电厂发电总加',
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
      '直调负荷差值',
      '联络线受电负荷差值',
      '风电总加差值',
      '光伏总加差值',
      '非市场化核电总加差值',
      '自备机组总加差值',
      '地方电厂发电总加差值',
      '火力发电差值',
      '价格差值'
    ]
  },
  forecast: {
    title: '预测',
    features: ['价格差值预测', '日前价格预测']
  }
};

function handleFeatureToggle(feature: string, checked: boolean) {
  if (checked) {
    const newFeatures = [...props.selectedFeatures, feature];
    emit('featureChange', newFeatures);
  } else {
    emit('featureChange', props.selectedFeatures.filter((f) => f !== feature));
  }
}

function handleSelectAll(groupKey: string) {
  const group = (featureGroups as any)[groupKey] as { features: string[] };
  const groupFeatures = group.features;
  const allSelected = groupFeatures.every((f) => props.selectedFeatures.includes(f));

  if (allSelected) {
    emit(
      'featureChange',
      props.selectedFeatures.filter((f) => !groupFeatures.includes(f))
    );
  } else {
    const newSelected = [...props.selectedFeatures];
    groupFeatures.forEach((f) => {
      if (!newSelected.includes(f)) newSelected.push(f);
    });
    emit('featureChange', newSelected);
  }
}

function toggleGroup(groupKey: string) {
  expandedGroups.value[groupKey] = !expandedGroups.value[groupKey];
}

function getGroupSelectionStatus(groupKey: string): 'none' | 'all' | 'partial' {
  const group = (featureGroups as any)[groupKey] as { features: string[] };
  const groupFeatures = group.features;
  const selectedCount = groupFeatures.filter((f) => props.selectedFeatures.includes(f)).length;

  if (selectedCount === 0) return 'none';
  if (selectedCount === groupFeatures.length) return 'all';
  return 'partial';
}

function isFeatureAvailable(_feature: string) {
  return true;
}
</script>

