<template>
  <div class="map-tools">
    <span class="sidemap-title">Layers</span>
    <!-- separator -->
    <q-separator color="grey-6" />
    <div class="sidemap-option" :class="{ active: mapStore.showAnomalies }">
      <div @click="mapStore.showAnomalies = !mapStore.showAnomalies">
        <span v-if="!mapStore.fetchingDate" class="column items-center">
          <q-icon :name="'troubleshoot'"></q-icon>
          <p class="q-pa-none q-ma-none">Anomalies</p>
        </span>
        <q-skeleton type="QBadge" v-if="mapStore.fetchingDate" />
        <q-tooltip anchor="center left" self="center end">{{ showAnomaliesTooltipMsg }}</q-tooltip>
      </div>
    </div>
    <div class="sidemap-option" :class="{ active: mapStore.showAutonomousCommunities }">
      <div @click="mapStore.showAutonomousCommunities = !mapStore.showAutonomousCommunities">
        <span v-if="!mapStore.fetchingDate" class="column items-center">
          <q-icon :name="'layers'"></q-icon>
          <p class="q-pa-none q-ma-none">Borders</p>
        </span>
        <q-skeleton type="QBadge" v-if="mapStore.fetchingDate" />
        <q-tooltip anchor="center left" self="center end">{{
          autonomousCommunitiesTooltipMsg
        }}</q-tooltip>
      </div>
    </div>
    <div class="sidemap-option" :class="{ active: mapStore.showLabels }">
      <div @click="mapStore.showLabels = !mapStore.showLabels">
        <span v-if="!mapStore.fetchingDate" class="column items-center">
          <q-icon :name="'title'"></q-icon>
          <p class="q-pa-none q-ma-none">Labels</p>
        </span>
        <q-skeleton type="QBadge" v-if="mapStore.fetchingDate" />
        <q-tooltip anchor="center left" self="center end">{{ labelsTooltipMsg }}</q-tooltip>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMapStore } from 'src/stores/mapStore';
import { computed } from 'vue';

const mapStore = useMapStore();

const autonomousCommunitiesTooltipMsg = computed(() =>
  mapStore.showAutonomousCommunities
    ? 'Hide autonomous communities borders'
    : 'Show autonomous communities borders',
);
const showAnomaliesTooltipMsg = computed(() =>
  mapStore.showAnomalies ? 'Hide anomalies' : 'Show anomalies',
);
const labelsTooltipMsg = computed(() => (mapStore.showLabels ? 'Hide labels' : 'Show labels'));
</script>
<style lang="scss" scoped>
.map-tools {
  background-color: $dark-opacity;
  color: $dark-mode-text;
  border: 1px solid $dark;
  border-radius: 0.5rem;
  padding: 0.3rem 0.1rem;
  .sidemap-title {
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    margin: 0.8rem auto;
  }
  .sidemap-option {
    padding: 0.6rem 0.5rem;
    margin: 0.1rem 0;
    cursor: pointer;
    transition: background-color 0.3s ease;
    p {
      font-size: 0.8rem;
    }
    &.active {
      color: $primary2;
      i {
        color: $primary2;
      }
    }

    &:hover {
      color: $primary2;
      i {
        color: $primary2;
      }
    }

    i {
      font-size: 1.8rem;
      color: $dark-mode-text;
    }
  }
}
</style>
