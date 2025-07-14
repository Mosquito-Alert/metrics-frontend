<template>
  <div class="status-presentation">
    <q-badge
      :label="status"
      :color="statusColorName"
      text-color="dark"
      class="status-info q-py-sm q-px-md q-mt-xs q-mr-md text-weight-medium"
    />
    <q-circular-progress
      show-value
      size="60px"
      :value="(regionDetailedStore.currentRegionMetric?.value as number) * 100"
      color="orange"
      track-color="white"
      class="value-status"
    >
      <div class="value-status-content">
        <div class="mosquito-icon" v-html="MosquitoIcon" />
      </div>
    </q-circular-progress>
    <q-tooltip>
      <div>
        <p class="text-subtitle1 text-weight-light q-pa-none q-ma-none">
          Bite Probability:
          <span class="text-weight-medium">{{ metric.value }}%</span>
        </p>
        <p class="text-subtitle2 text-weight-light q-pa-none q-ma-none">
          Confidence levels:
          <span class="text-weight-regular"
            >[{{ metric.lower_value }}%, {{ metric.upper_value }}%]</span
          >
        </p>
        <p class="text-subtitle2 q-pa-none q-ma-none" v-if="metric.anomaly_degree">
          Anomaly:
          <span class="text-weight-light">{{
            metric.anomaly_degree < 0 ? 'Under-expected' : 'Over-expected'
          }}</span>
        </p>
      </div>
    </q-tooltip>
  </div>
</template>
<script lang="ts" setup>
import { MetricDetail } from 'anomaly-detection';
import MosquitoIcon from 'src/assets/mosquito.svg?raw';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import {
  AnomalyClassificationEnum,
  anomalyClassificationStyle,
  classifyAnomaly,
} from 'src/utils/anomalyClassification';
import { computed } from 'vue';

const regionDetailedStore = useRegionDetailedStore();

const metric = computed<MetricDetail>(
  () => regionDetailedStore.getFormattedCurrentRegionMetric as MetricDetail,
);

const status = computed(() => {
  if (
    Object.keys(metric).length === 0 ||
    metric.value.anomaly_degree === undefined ||
    metric.value.anomaly_degree === null
  ) {
    return;
  }

  return classifyAnomaly(metric.value.anomaly_degree) as AnomalyClassificationEnum;
});
const statusColorName = computed(() => {
  return anomalyClassificationStyle(status.value || AnomalyClassificationEnum.N_A);
});
</script>
<style lang="scss">
.status-presentation {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  .value-status {
    svg circle.q-circular-progress__track[stroke] {
      // stroke: #39393922;
      stroke: $dark-mode-text;
    }
    // svg circle.q-circular-progress__circle[stroke] {
    //  stroke: orange;
    // }
    .value-status-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;

      .mosquito-icon svg {
        width: 1.5rem;
        height: 1.5rem;
        // color: #393939;
        color: white;
      }
    }
  }
}
</style>
