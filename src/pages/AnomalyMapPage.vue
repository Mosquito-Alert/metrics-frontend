<template>
  <q-page>
    <RegionDetailedDrawer v-if="regionDetailedStore.isRegionSelected" />
    <!-- MAP -->
    <AnomalyMap v-if="dateFetched" />

    <!-- SEARCH BAR -->
    <q-page-sticky position="top-left" :offset="[0, 20]">
      <SearchBox v-if="!regionDetailedStore.selectedRegionMetricId" />
    </q-page-sticky>

    <!-- RIGHT SIDE OPTIONS -->
    <q-page-sticky position="top-right" :offset="[20, 20]">
      <span
        class="q-px-lg q-py-sm text-weight-medium text-subtitle1"
        id="map-date"
        v-if="!uiStore.fetchingDate"
      >
        {{ currentDate }}
      </span>
      <q-skeleton type="QBadge" v-if="uiStore.fetchingDate" />
    </q-page-sticky>

    <q-page-sticky position="top-right" :offset="[20, 80]" class="map-tools">
      <div class="playback sidemap-option" :class="{ active: sideOptionActive === 'active' }">
        <div @click="playbackStore.togglePlayback()">
          <span v-if="!uiStore.fetchingDate" class="column items-center">
            <q-icon name="history"></q-icon>
            <p class="q-pa-none q-ma-none">Playback</p>
            <!-- <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="rangeDate" range>
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn label="Cancel" color="primary" flat v-close-popup />
                  <q-btn label="OK" color="primary" flat v-close-popup />
                </div>
              </q-date>
            </q-popup-proxy> -->
          </span>
          <q-skeleton type="QBadge" v-if="uiStore.fetchingDate" />
          <q-tooltip anchor="center left" self="center end">{{ playbackTooltipMsg }}</q-tooltip>
        </div>
      </div>
    </q-page-sticky>

    <!-- PLAYBACK CONTROL -->
    <q-page-sticky
      position="bottom-left"
      :offset="[50, 20]"
      class="sticky-playback-control flex justify-center"
    >
      <PlaybackControl
        v-if="
          playbackStore.playbackEnabled &&
          !regionDetailedStore.selectedRegionMetricId &&
          !playbackStore.fetchingData
        "
      />
      <q-skeleton type="QBadge" v-if="playbackStore.fetchingData" />
    </q-page-sticky>

    <!-- LOGO -->
    <q-img
      style="z-index: 1"
      class="absolute-bottom q-mb-sm"
      position="calc(50% - 11px) center"
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

const $q = useQuasar();

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();
const playbackStore = usePlaybackStore();

const dateFetched = ref(false);
const sideOptionActive = computed(() => {
  return playbackStore.playbackEnabled ? 'active' : 'inactive';
});
// const rangeDate = ref([new Date(), new Date()]);

// * Lifecycle
onMounted(async () => {
  $q.loading.show({ message: 'Loading data...' });
  await uiStore.fetchLastDate();
  dateFetched.value = true;
  $q.loading.hide();
});

const currentDate = computed(() => {
  return playbackStore.playbackEnabled
    ? playbackStore.formattedPlaybackCurrentDate
    : uiStore.formattedDate;
});
const playbackTooltipMsg = computed(() => {
  return playbackStore.playbackEnabled ? 'Return to current date' : 'Playback last 30 days';
});

uiStore.appWidth = window.innerWidth;
uiStore.regionDetailDrawerWidth = Math.max(Math.floor(uiStore.appWidth / 2.75), 500);
</script>
<style lang="scss">
#map-date {
  background-color: #f0f0f0;
  color: #444;
  border-radius: 4px;
  border: 1px solid #444;
}
.map-tools {
  background-color: #393939cc;
  color: #e1e1e1;
  border: 1px solid #393939;
  border-radius: 0.5rem;
  padding: 0.3rem 0.1rem;
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
  width: 32%;
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
