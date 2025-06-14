<template>
  <q-drawer
    show-if-above
    side="left"
    :width="width"
    v-model="mapStore.isRegionSelected"
    class="bg-white overflow-hidden column"
  >
    <div class="drawer-header q-pt-lg q-pb-sm q-px-lg q-ma-none" style="background-color: #f9e7b5">
      <q-btn
        dense
        flat
        icon="close"
        size="0.85rem"
        class="q-drawer-hide absolute"
        style="top: 1rem; right: 1rem"
        @click="() => mapStore.$reset()"
      />
      <p class="text-h3 q-ma-none q-mb-xs">
        {{ municipalityName }}
      </p>
      <div class="row q-mb-sm">
        <div class="col-10">
          <p class="text-h6 text-weight-regular" style="color: #333">{{ provinceName }}</p>
          <p class="text-subtitle-1 text-weight-regular q-ma-none" style="color: #333">
            {{ uiStore.formattedDate }}
          </p>
        </div>
        <div class="col self-end">
          <!-- <span>Anomaly</span> -->
          <q-badge
            :label="status"
            :color="statusColorName"
            class="q-py-sm q-px-md q-mt-xs"
            v-if="!loading"
            ><q-tooltip>
              <div v-if="!loading">
                <p class="text-subtitle1 text-weight-light q-pa-none q-ma-none">
                  Bite Index:
                  <span class="text-weight-medium">{{ metric.value }}%</span>
                </p>
                <p class="text-subtitle2 text-weight-light q-pa-none q-ma-none">
                  Confidence levels:
                  <span class="text-weight-regular"
                    >[{{ metric.lower_value }}%, {{ metric.upper_value }}%]</span
                  >
                </p>
              </div>
            </q-tooltip>
          </q-badge>
          <q-skeleton class="text-h6 full-width" v-if="loading" />
        </div>
      </div>
    </div>
    <!-- * CONTENT -->
    <q-scroll-area
      ref="drawerScrollArea"
      class="drawer-content full-height q-px-md q-py-xs col overflow-auto"
    >
      <RegionAnomaliesChart class="q-pt-sm" />
      <RegionSeasonality />
      <RegionSummary />
      <RegionAnomaliesHistoryTable />
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { MetricDetail } from 'anomaly-detection';
import { historyPageSize } from 'src/constants/config';
import { useMapStore } from 'src/stores/mapStore';
import { useUIStore } from 'src/stores/uiStore';
import {
  AnomalyClassificationEnum,
  anomalyClassificationStyle,
  classifyAnomaly,
} from 'src/utils/anomalyClassification';
import { computed, onMounted, ref, watch } from 'vue';

const uiStore = useUIStore();
const mapStore = useMapStore();

const drawerScrollArea = ref(null as any);

const updateDataHook = async () => {
  if (!mapStore.selectedRegionMetricId) return;
  await mapStore.fetchSelectedMetric(mapStore.selectedRegionMetricId!);
  await mapStore.fetchSelectedMetricSeasonality();
  await mapStore.fetchSelectedMetricAll();
  await mapStore.fetchSelectedMetricTrend();
  await mapStore.fetchSelectedMetricHistory({ page: 1, pageSize: historyPageSize });
};

const metric = computed<MetricDetail>(() => mapStore.getFormattedRegionMetric as MetricDetail);
const loading = computed(() => mapStore.fetchingRegionMetric);

watch(
  () => mapStore.selectedRegionMetricId,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      // Also, reset the scroll position of the drawer
      if (drawerScrollArea.value) {
        drawerScrollArea.value?.setScrollPosition('vertical', 0, 150);
      }
      await updateDataHook();
    }
  },
  { immediate: true },
);
onMounted(async () => {
  if (mapStore.selectedRegionMetricId) {
    await updateDataHook();
  }
});

const municipalityName = computed(() => {
  const defaultTitle = 'Municipality Unknown';
  const selectedRegionMetric = mapStore.selectedRegionMetric;
  if (!selectedRegionMetric) {
    return defaultTitle;
  }
  return selectedRegionMetric.region.name;
});
const provinceName = computed(() => {
  const defaultTitle = 'Province Unknown';
  const selectedRegionMetric = mapStore.selectedRegionMetric;
  if (!selectedRegionMetric) {
    return defaultTitle;
  }
  return selectedRegionMetric.region.province;
});

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

const width = computed(() => uiStore.drawerWidth);
</script>
