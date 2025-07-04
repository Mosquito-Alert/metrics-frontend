<template>
  <h6 class="q-my-sm q-mb-md q-ml-sm text-weight-regular" style="color: #333">
    Summary
    <span v-if="playbackStore.playbackEnabled" class="text-italic text-subtitle1"
      >(for {{ date.formatDate(uiStore.formattedDate, 'MMMM D, YYYY') }})</span
    >
  </h6>
  <div
    class="q-pa-md q-mt-sm q-mb-lg row q-pa-xs rounded-borders"
    style="background-color: #fdf7e6"
  >
    <div class="col-5 row justify-center items-center">
      <div class="col">
        <span class="text-weight-light">Bite Index</span>
        <q-space />
        <q-badge :label="status" :color="statusColorName" v-if="!loading"></q-badge>
      </div>
      <div class="col">
        <div class="row justify-center">
          <span class="text-h4 text-weight-medium" v-if="!loading">{{ metric.value }}%</span>
          <q-skeleton class="text-h6 full-width" v-if="loading" />
        </div>
      </div>
    </div>
    <q-separator vertical class="q-mx-md" />
    <div class="col">
      <div class="row">
        <span class="text-weight-light">Confidence levels</span>
      </div>
      <div class="row flex items-center justify-center">
        <span class="text-weight-light self-end q-mr-xs q-mb-xs">min.</span>
        <span class="text-h6" v-if="!loading">{{ metric.lower_value }}%</span>
        <q-skeleton class="text-h6 col-4" v-if="loading" />
        <q-separator vertical class="q-mx-md" />
        <span class="text-weight-light self-end q-mr-xs q-mb-xs">max.</span>
        <span class="text-h6" v-if="!loading">{{ metric.upper_value }}%</span>
        <q-skeleton class="text-h6 col-4" v-if="loading" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MetricDetail } from 'anomaly-detection';
import {
  AnomalyClassificationEnum,
  anomalyClassificationStyle,
  classifyAnomaly,
} from 'src/utils/anomalyClassification';
import { useRegionDetailedStore } from '../../../stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { date } from 'quasar';
import { usePlaybackStore } from 'src/stores/playbackStore';

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();
const playbackStore = usePlaybackStore();

const metric = computed<MetricDetail>(
  () => regionDetailedStore.getFormattedRegionMetric as MetricDetail,
);
const loading = computed(() => regionDetailedStore.fetchingRegionMetric);

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
