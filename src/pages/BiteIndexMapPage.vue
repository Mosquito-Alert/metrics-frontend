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
    <q-page-sticky position="top-right" :offset="[20, 20]" class="map-tools">
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
          <q-tooltip anchor="center left" self="center end">{{
            showAnomaliesTooltipMsg
          }}</q-tooltip>
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
    </q-page-sticky>

    <!-- LEGEND -->
    <q-page-sticky position="bottom-right" :offset="[20, 110]">
      <MapLegend />
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

    <!-- LOGO -->
    <q-img
      :style="{
        zIndex: 1,
        position: 'absolute',
        bottom: '110px',
        margin: 'auto',
      }"
      class="absolute-bottom q-mb-sm"
      fit="contain"
      src="~assets/logo_horizontal_black.png"
      height="1.8rem"
    />
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
// const rangeDate = ref([new Date(), new Date()]);

// * Lifecycle
onMounted(async () => {
  $q.loading.show({ message: 'Loading data...' });
  await mapStore.fetchLastDate();
  playbackStore.togglePlayback();
  dateFetched.value = true;
  $q.loading.hide();
});

const autonomousCommunitiesTooltipMsg = computed(() =>
  mapStore.showAutonomousCommunities
    ? 'Hide autonomous communities borders'
    : 'Show autonomous communities borders',
);
const showAnomaliesTooltipMsg = computed(() =>
  mapStore.showAnomalies ? 'Hide anomalies' : 'Show anomalies',
);
const labelsTooltipMsg = computed(() => (mapStore.showLabels ? 'Hide labels' : 'Show labels'));

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
.map-tools {
  background-color: #393939cc;
  color: #e1e1e1;
  border: 1px solid #393939;
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
      color: #f3c954;
      i {
        color: #f3c954;
      }
    }

    &:hover {
      color: #f3c954;
      i {
        color: #f3c954;
      }
    }

    i {
      font-size: 1.8rem;
      color: #e1e1e1;
    }
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
