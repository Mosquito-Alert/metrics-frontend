<template>
  <q-drawer
    show-if-above
    :mini="miniState"
    @mouseenter="miniState = false"
    @mouseleave="miniState = true"
    mini-to-overlay
    :width="width"
    :breakpoint="500"
    bordered
    :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
  >
    <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: '0' }">
      <q-list padding>
        <q-item v-ripple class="q-mb-lg">
          <q-item-section avatar>
            <q-avatar square>
              <img src="~assets/logo.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h6">Anomaly Detection</q-item-label>
            <q-item-label caption>Version 1.0.0</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-mb-md" />

        <q-item active clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="map" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle2"> Anomaly Map</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="replay_30" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle2">Playback last 30 days</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-mt-md q-mb-md" />

        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle2">About</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>
<script setup lang="ts">
import { useUIStore } from 'src/stores/uiStore';
import { computed } from 'vue';
import { ref } from 'vue';
const miniState = ref(true);
const uiStore = useUIStore();

const width = computed(() => Math.max(Math.floor(uiStore.appWidth / 6), 100));
</script>
