<template>
  <div class="playback-control" :style="compactWithDrawerStyle">
    <div class="playback-buttons">
      <q-btn
        class="control-button"
        icon="navigate_before"
        @click="playbackStore.goBackDays(1)"
        :disabled="playbackStore.playbackCurrentIndex <= 0"
      >
        <q-tooltip anchor="top middle" self="bottom middle">Go back 1 day</q-tooltip>
      </q-btn>
      <q-btn class="control-button" :icon="playIcon" @click="playbackStore.toggleVideoPlayback">
        <q-tooltip anchor="top middle" self="bottom middle">
          {{
            !playbackStore.playbackPaused
              ? 'Pause'
              : playbackStore.playbackFinished
                ? 'Replay'
                : 'Play'
          }}
        </q-tooltip>
      </q-btn>
      <q-btn
        class="control-button"
        icon="navigate_next"
        @click="playbackStore.goForwardDays(1)"
        :disabled="playbackStore.playbackCurrentIndex >= maxIndex"
      >
        <q-tooltip anchor="top middle" self="bottom middle">Go forward 1 day</q-tooltip>
      </q-btn>
    </div>
    <div class="playback-slider">
      <q-slider
        v-model="playbackStore.playbackCurrentIndex"
        color="white"
        label
        :label-value="currentLabel"
        :label-always="true"
        label-color="white"
        label-text-color="black"
        markers
        :min="0"
        :max="maxIndex"
      />
      <div class="playback-labels">
        <span class="playback-label first-label">
          {{ formattedDate(fromDate) }}
        </span>
        <span class="playback-label last-label">
          {{ formattedDate(toDate) }}
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { usePlaybackStore } from 'src/stores/playbackStore';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { formattedDate } from 'src/utils/date';
import { computed, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';

const uiStore = useUIStore();
const playbackStore = usePlaybackStore();
const regionDetailedStore = useRegionDetailedStore();

const maxIndex = ref(Object.keys(playbackStore.playbackDaysObject).length - 1);
const fromDate = ref<string>(playbackStore.playbackDaysObject[0] as string);
const toDate = ref<string>(playbackStore.playbackDaysObject[maxIndex.value] as string);

const currentLabel = computed(() => {
  const currentDate = playbackStore.playbackDaysObject[playbackStore.playbackCurrentIndex];
  return formattedDate(currentDate as string);
});

const playIcon = computed(() => {
  return !playbackStore.playbackPaused
    ? 'pause'
    : playbackStore.playbackFinished
      ? 'replay'
      : 'play_arrow';
});

const compactWithDrawerStyle = computed<CSSProperties>(() => {
  return regionDetailedStore.selectedRegionMetricId
    ? {
        width: uiStore.playbackWidth + 'px',
        position: 'absolute',
        left: uiStore.regionDetailDrawerWidth + 'px',
        bottom: '0px',
      }
    : {};
});

watch(
  () => playbackStore.playbackCurrentIndex,
  (newValue) => {
    playbackStore.updateCurrentDate(newValue);
  },
);
</script>
<style lang="scss">
.playback-control {
  display: flex;
  align-items: center;

  background-color: #393939cc;
  color: #e1e1e1;
  border: 1px solid #393939;
  // border-radius: 0.5rem;
  padding: 1rem 3rem 0.1rem 2rem;
  // margin: auto 20px;
  .playback-buttons {
    display: flex;
    flex-shrink: 0; // Prevent buttons from shrinking
    margin-right: 3rem;
    .control-button {
      width: 1.2rem;
      height: 1.2rem;
      margin-right: 2px;
      background-color: #393939;
      color: #e1e1e1;
      border: 1px solid #393939;
      border-radius: 0.5rem;
      color: white;
      i {
        color: white;
      }
    }
  }
  .playback-slider {
    width: 100%;
    // margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: center;
    .q-slider {
      flex: 1;
      min-width: 0; // Prevent slider from overflowing
      width: 100%;
      margin-top: 1rem;
    }
    .playback-labels {
      display: flex;
      justify-content: space-between;
      width: 100%;
      .playback-label {
        color: #e1e1e1;
        margin-bottom: 2px;
      }
      .first-label {
        text-align: left;
      }
      .last-label {
        text-align: right;
      }
    }
  }
}
</style>
