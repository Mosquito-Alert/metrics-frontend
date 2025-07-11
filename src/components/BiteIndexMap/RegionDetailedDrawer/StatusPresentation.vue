<template>
  <div class="status-presentation">
    <!-- :value="95" -->
    <q-circular-progress
      show-value
      size="70px"
      :value="(regionDetailedStore.selectedRegionMetric?.value as number) * 100"
      color="orange"
      track-color="white"
      class="value-status"
    >
      <div class="value-status-content">
        <div class="mosquito-icon" v-html="MosquitoIcon" />
      </div>
    </q-circular-progress>
    <span class="anomaly-status" :style="{ backgroundColor: anomalyStatusColor }">
      <q-icon :name="statusIcon" size="1.5rem" color="white" />
    </span>
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
import { ANOMALY_COLORS } from 'src/constants/colors';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { computed } from 'vue';
import MosquitoIcon from 'src/assets/mosquito.svg?raw';

const regionDetailedStore = useRegionDetailedStore();

const statusIcon = computed(() => {
  const anomalyDegree = regionDetailedStore.getFormattedRegionMetric?.anomaly_degree;
  if (anomalyDegree === undefined || anomalyDegree === null) {
    return 'check_circle';
  } else if (anomalyDegree < 0) {
    return 'keyboard_arrow_down';
  } else if (anomalyDegree > 0) {
    return 'keyboard_arrow_up';
  } else {
    return 'check';
  }
});

const metric = computed<MetricDetail>(
  () => regionDetailedStore.getFormattedRegionMetric as MetricDetail,
);
const anomalyStatusColor = computed(() => {
  const anomalyDegree = metric.value.anomaly_degree;
  if (anomalyDegree === undefined || anomalyDegree === null) {
    return ANOMALY_COLORS.USUAL_LIGHT;
  } else if (anomalyDegree < 0) {
    return ANOMALY_COLORS.LOW;
  } else if (anomalyDegree > 0) {
    return ANOMALY_COLORS.HIGH;
  } else {
    return ANOMALY_COLORS.USUAL;
  }
});
</script>
<style lang="scss">
.status-presentation {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  .value-status {
    svg circle.q-circular-progress__circle[stroke] {
      stroke: orange;
    }
    svg circle.q-circular-progress__track[stroke] {
      stroke: #39393922;
    }
    .value-status-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;

      .mosquito-icon svg {
        width: 1.5rem;
        height: 1.5rem;
        color: #393939;
      }
    }
  }
  .anomaly-status {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
  }
}
</style>
