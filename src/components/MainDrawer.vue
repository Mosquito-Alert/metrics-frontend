<template>
  <q-drawer
    show-if-above
    :mini="miniState"
    @mouseenter="miniState = false"
    @mouseleave="miniState = true"
    mini-to-overlay
    :width="width"
    :mini-width="70"
    :breakpoint="500"
    bordered
    :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
  >
    <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: '0' }">
      <q-list padding>
        <q-item v-ripple class="q-mb-lg">
          <q-item-section avatar>
            <q-avatar square>
              <img src="/icons/mosquito_alert_squared_logo.png" style="width: 40px; height: 40px" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h6">Metrics</q-item-label>
            <q-item-label caption>Mosquito Alert insights</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-mb-md" />

        <q-item
          clickable
          v-ripple
          @click="navigateTo(routesNames.biteIndexMap)"
          :active="uiStore.currentTab === routesNames.biteIndexMap"
        >
          <q-item-section avatar>
            <q-icon name="map" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle2"> Bite Probability Map</q-item-label>
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
import routesNames from 'src/router/routesNames';
import { computed } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const miniState = ref(true);
const uiStore = useUIStore();
const router = useRouter();

const width = computed(() => Math.max(Math.floor(uiStore.appWidth / 6.8), 100));

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
  uiStore.currentTab = routeName;
};
</script>
