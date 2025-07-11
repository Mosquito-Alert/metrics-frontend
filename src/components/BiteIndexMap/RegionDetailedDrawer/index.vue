<template>
  <div class="region-detail-drawer bg-white overflow-hidden" :style="{ width: width + 'px' }">
    <div class="drawer-header q-pt-lg q-pb-sm q-px-lg q-ma-none" style="background-color: #f9e7b5">
      <q-btn
        dense
        flat
        icon="close"
        size="0.85rem"
        class="q-drawer-hide close-drawer"
        @click="() => resetSelectedRegionMetricId()"
      />
      <p class="text-h3 q-ma-none q-mb-xs">
        {{ municipalityName }}
      </p>
      <div class="row q-mb-sm">
        <div class="col-8">
          <p class="text-h6 text-weight-regular" style="color: #333">{{ provinceName }}</p>
          <p class="text-subtitle-1 text-weight-regular q-ma-none" style="color: #333">
            {{ date.formatDate(mapStore.lastDate, 'MMM D, YYYY') }}
            <span class="date-label">(Last available data)</span>
          </p>
        </div>
        <div class="col self-end justify-end">
          <StatusPresentation v-if="!loading" />
          <q-skeleton class="text-h6 full-width" v-if="loading" />
        </div>
      </div>
    </div>
    <!-- * CONTENT -->
    <q-scroll-area ref="drawerScrollArea" class="drawer-content col q-px-md q-py-xs">
      <div class="main-drawer-section">
        <div class="main-drawer-section-header q-mt-md q-mb-sm">
          <h4 class="text-h4 q-ml-xs q-my-none text-weight-regular" style="color: #333">
            Bite Probability
          </h4>
          <q-btn
            dense
            flat
            class="show-table q-px-sm q-mr-md"
            :class="{ active: regionDetailedStore.showTable }"
            icon="list_alt"
            size="0.8rem"
            @click="() => (regionDetailedStore.showTable = !regionDetailedStore.showTable)"
          >
            <q-tooltip anchor="center left" self="center end">
              {{ regionDetailedStore.showTable ? 'Hide table' : 'Show table' }}
            </q-tooltip>
          </q-btn>
        </div>
        <TimeSeriesChart class="q-pt-sm" />
      </div>
      <q-separator class="q-my-md" />
      <div class="secondaryDrawerSection">
        <h5 class="text-h5 q-mt-md q-mb-sm q-ml-xs text-weight-regular" style="color: #333">
          Additional Insights
        </h5>
        <RegionSeasonality />
      </div>
    </q-scroll-area>
  </div>
</template>
<script setup lang="ts">
import { date } from 'quasar';
import { historyPageSize } from 'src/constants/config';
import { useMapStore } from 'src/stores/mapStore';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { computed, ref, watch } from 'vue';

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();
const mapStore = useMapStore();

const drawerScrollArea = ref(null as any);

const updateDataHook = async () => {
  if (!regionDetailedStore.selectedRegionMetricId) return;
  await regionDetailedStore.fetchSelectedMetric(regionDetailedStore.selectedRegionMetricId!);
  await regionDetailedStore.fetchSelectedMetricSeasonality();
  await regionDetailedStore.fetchSelectedMetricAll();
  await regionDetailedStore.fetchSelectedMetricTrend();
  await regionDetailedStore.fetchSelectedMetricHistory({ page: 1, pageSize: historyPageSize });
};

const loading = computed(() => regionDetailedStore.fetchingRegionMetric);

watch(
  () => regionDetailedStore.selectedRegionMetricId,
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

const municipalityName = computed(() => {
  const defaultTitle = 'Municipality Unknown';
  const selectedRegionMetric = regionDetailedStore.selectedRegionMetric;
  if (!selectedRegionMetric) {
    return defaultTitle;
  }
  return selectedRegionMetric.region.name;
});
const provinceName = computed(() => {
  const defaultTitle = 'Province Unknown';
  const selectedRegionMetric = regionDetailedStore.selectedRegionMetric;
  if (!selectedRegionMetric) {
    return defaultTitle;
  }
  return selectedRegionMetric.region.province;
});

const resetSelectedRegionMetricId = () => {
  regionDetailedStore.$reset();
  mapStore.selectedFeatures = [];
};

const width = computed(() => uiStore.regionDetailDrawerWidth);
</script>
<style lang="scss">
.region-detail-drawer {
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .drawer-header {
    .close-drawer {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 1002;
    }

    .date-label {
      font-weight: 400;
      color: #555;
      font-style: italic;
    }
  }

  .main-drawer-section {
    .main-drawer-section-header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      .show-table {
        z-index: 1001;
        background-color: #f0f0f0;
        color: #444;
        border-radius: 4px;
        border: 1px solid #444;
        cursor: pointer;
        transition: background-color 0.3s ease;
        &.active {
          background-color: $primary2;
          .block {
            padding-right: 0.3rem;
          }
        }

        &:hover {
          background-color: $primary2;
        }
      }
    }
  }
}
</style>
