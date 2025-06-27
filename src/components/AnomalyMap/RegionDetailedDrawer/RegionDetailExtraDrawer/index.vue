<template>
  <div
    class="region-detail-table-drawer bg-white overflow-hidden"
    :style="{ width: width + 'px', left: width + 'px' }"
  >
    <q-btn
      dense
      flat
      icon="close"
      size="0.85rem"
      class="q-drawer-hide"
      @click="() => (regionDetailedStore.showTable = !regionDetailedStore.showTable)"
    />
    <!-- * CONTENT -->
    <q-scroll-area ref="drawerScrollArea" class="drawer-content col q-px-md q-py-xs">
      <RegionSummary />
      <RegionAnomaliesHistoryTable />
    </q-scroll-area>
  </div>
</template>
<script setup lang="ts">
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { computed } from 'vue';

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();

const width = computed(() => uiStore.regionDetailDrawerWidth);
</script>
<style lang="scss">
.q-drawer-hide {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1002;
}
.region-detail-table-drawer {
  z-index: 1001;
  position: absolute;
  top: 0;
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e0e0e0;
}
</style>
