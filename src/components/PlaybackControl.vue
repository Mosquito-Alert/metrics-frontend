<template>
  <div class="playback-control">
    <q-btn
      dense
      flat
      icon="close"
      size="0.85rem"
      class="q-drawer-hide absolute"
      @click="() => playbackStore.togglePlayback()"
    />
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
    <q-slider
      class="playback-slider"
      v-model="playbackStore.playbackCurrentIndex"
      color="white"
      :marker-labels="markerLabels"
      label
      :label-value="currentLabel"
      :label-always="true"
      label-color="white"
      label-text-color="black"
      markers
      :min="0"
      :max="maxIndex"
    />
  </div>
</template>
<script setup lang="ts">
import { usePlaybackStore } from 'src/stores/playbackStore';
import { formattedDate } from 'src/utils/date';
import { computed, ref, watch } from 'vue';

const playbackStore = usePlaybackStore();

const maxIndex = ref(Object.keys(playbackStore.playbackDaysObject).length - 1);
// Only show first and last markers
const markerLabels = computed(() => {
  const labels = playbackStore.playbackDaysObject;
  return Object.keys(labels).reduce((acc: any, key: any, index) => {
    if (index === 0 || index === Object.keys(labels).length - 1) {
      acc[key] = formattedDate(labels[key] as string);
    }
    return acc;
  }, {});
});

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
  border-radius: 0.5rem;
  padding: 1rem 3rem 0.1rem 2rem;
  margin: auto 20px;
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
      color: white; //#f3c954;
      i {
        color: white; //#f3c954;
      }
    }
  }
  .q-slider {
    flex: 1;
    min-width: 0; // Prevent slider from overflowing
    width: 100%;
    margin-top: 1rem;
    .playback-slider {
      width: 100%;
      margin-top: 1rem;
    }
  }
}
.q-drawer-hide {
  top: 0.5rem;
  right: 1.7rem;
  background-color: #393939;
  color: #e1e1e1;
  border: 1px solid #393939;
  border-radius: 0.5rem;
  &:hover {
    background-color: #f3c954;
    color: #393939;
    i {
      color: #393939;
    }
  }
}
</style>
