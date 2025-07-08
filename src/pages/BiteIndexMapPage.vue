<template>
  <q-page>
    <!-- DRAWERS -->
    <RegionDetailedDrawer v-if="regionDetailedStore.isRegionSelected" />
    <RegionDetailExtraDrawer v-if="regionDetailedStore.showTable" />
    <!-- MAP -->
    <BiteIndexMap v-if="dateFetched" />

    <!-- SEARCH BAR -->
    <q-page-sticky position="top-left" :offset="[searchboxOffsetLeft, 20]">
      <SearchBox :style="{ zIndex: 1002 }" />
    </q-page-sticky>

    <!-- RIGHT SIDE OPTIONS -->
    <q-page-sticky position="top-right" :offset="[20, 20]">
      <MapToolbar />
    </q-page-sticky>

    <!-- LEGEND -->
    <q-page-sticky position="bottom-right" :offset="[20, 110]">
      <MapLegend />
    </q-page-sticky>

    <!-- LAYER STYLE SELECTION -->
    <q-page-sticky v-if="!mapStore.showAnomalies" position="bottom-left" :offset="[20, 110]">
      <LayerStyleSelector />
    </q-page-sticky>

    <!-- PLAYBACK CONTROL -->
    <q-page-sticky
      position="bottom-left"
      :offset="[0, 0]"
      class="sticky-playback-control flex justify-center"
    >
      <PlaybackControl v-if="playbackStore.playbackEnabled && !playbackStore.fetchingData" />
      <q-skeleton type="QBadge" v-if="playbackStore.fetchingData" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { computed, onMounted, ref } from 'vue';
import { usePlaybackStore } from '../stores/playbackStore';
import { useMapStore } from 'src/stores/mapStore';

const $q = useQuasar();

const uiStore = useUIStore();
const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();
const playbackStore = usePlaybackStore();

const dateFetched = ref(false);

// * Lifecycle
onMounted(async () => {
  $q.loading.show({ message: 'Loading data...' });
  await mapStore.fetchLastDate();
  playbackStore.togglePlayback();
  dateFetched.value = true;
  $q.loading.hide();
});

uiStore.appWidth = window.innerWidth;
const getDrawerWidth = (appWidth: number) => {
  return Math.max(Math.floor(appWidth / 2.75), 500);
};
uiStore.regionDetailDrawerWidth = getDrawerWidth(uiStore.appWidth);

const searchboxOffsetLeft = computed(() => {
  const offset = regionDetailedStore.isRegionSelected ? uiStore.regionDetailDrawerWidth : 0;
  return 20 + offset;
});

// Watch for window resize to adjust the drawer width
window.addEventListener('resize', () => {
  uiStore.appWidth = window.innerWidth;
  uiStore.regionDetailDrawerWidth = getDrawerWidth(uiStore.appWidth);
});
</script>
<style lang="scss">
#map-date {
  > span {
    background-color: #f0f0f0;
    color: #444;
    border-radius: 4px;
    border: 1px solid #444;
  }
}
.sticky-playback-control {
  width: 100%;
  > div {
    width: 100%;
    height: 100%;
  }
}

.ol-zoom {
  top: auto !important;
  bottom: 5em !important;
  left: auto !important;
  right: 1em !important;

  button {
    width: 1.75em !important;
    height: 1.75em !important;
  }
}
.ol-scale-line {
  top: auto !important;
  bottom: 2em !important;
  left: auto !important;
  right: 1em !important;
}
</style>
