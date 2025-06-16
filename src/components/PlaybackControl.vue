<template>
  <q-slider
    class="playback-slider q-mt-xl"
    v-model="playbackStore.playbackCurrentIndex"
    color="purple"
    markers
    :marker-labels="markerLabels"
    :min="0"
    :max="maxIndex"
  />
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

watch(
  () => playbackStore.playbackCurrentIndex,
  (newValue) => {
    playbackStore.updateCurrentDate(newValue);
  },
);
</script>
<style lang="scss">
.q-slider {
  width: 100%;
  margin-top: 1rem;
  .playback-slider {
    width: 100%;
    margin-top: 1rem;
  }
}
</style>
