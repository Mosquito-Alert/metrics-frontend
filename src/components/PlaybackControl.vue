<template>
  <div class="playback-control">
    <div class="playback-buttons q-gutter-md row items-center justify-between">
      <div class="playback-step-buttons">
        <q-btn class="control-button q-mr-sm" icon="replay_5" @click="playbackStore.goBackDays(5)">
          <q-tooltip anchor="top middle" self="bottom middle">Go back 5 days</q-tooltip>
        </q-btn>
        <q-btn
          class="control-button q-mr-sm"
          icon="navigate_before"
          @click="playbackStore.goBackDays(1)"
        >
          <q-tooltip anchor="top middle" self="bottom middle">Go back 1 day</q-tooltip>
        </q-btn>
      </div>
      <q-btn
        class="control-button q-mr-sm"
        :icon="playIcon"
        @click="playbackStore.toggleVideoPlayback"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          {{ playbackStore.playbackPaused ? 'Play' : 'Pause' }}
        </q-tooltip>
      </q-btn>
      <div class="playback-step-buttons">
        <q-btn
          class="control-button q-ml-sm"
          icon="navigate_next"
          @click="playbackStore.goForwardDays(1)"
        >
          <q-tooltip anchor="top middle" self="bottom middle">Go forward 1 day</q-tooltip>
        </q-btn>
        <q-btn
          class="control-button q-ml-sm"
          icon="forward_5"
          @click="playbackStore.goForwardDays(5)"
        >
          <q-tooltip anchor="top middle" self="bottom middle">Go forward 5 days</q-tooltip>
        </q-btn>
      </div>
    </div>
    <q-slider
      class="playback-slider q-mt-xl"
      v-model="playbackStore.playbackCurrentIndex"
      color="white"
      :marker-labels="markerLabels"
      label
      :label-value="currentLabel"
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
  return playbackStore.playbackPaused ? 'play_arrow' : 'pause';
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
  background-color: #393939cc;
  color: #e1e1e1;
  border: 1px solid #393939;
  border-radius: 0.5rem;
  padding: 2rem 3.2rem 0.4rem 3rem;
  display: flex;
  flex-direction: column;
  .control-button {
    background-color: #393939;
    color: #e1e1e1;
    border: 1px solid #393939;
    border-radius: 0.5rem;
    color: white; //#f3c954;
    i {
      color: white; //#f3c954;
    }
  }
  .q-slider {
    width: 100%;
    margin-top: 1rem;
    .playback-slider {
      width: 100%;
      margin-top: 1rem;
    }
  }
}
</style>
