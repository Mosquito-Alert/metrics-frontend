import { defineStore, acceptHMRUpdate } from 'pinia';
import routesNames from '../router/routesNames';
import { formattedDate } from '../utils/date';
import { useMapStore } from './mapStore';
import { usePlaybackStore } from './playbackStore';
import { useRegionDetailedStore } from './regionDetailedStore';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    appWidth: window.innerWidth as number,
    regionDetailDrawerWidth: 0,
    currentTab: routesNames.anomalyMap,
  }),

  getters: {
    getDate: (state) => {
      const mapStore = useMapStore();
      const playbackStore = usePlaybackStore();
      return playbackStore.playbackEnabled
        ? new Date(playbackStore.playbackCurrentDate)
        : new Date(mapStore.currentDate);
    },
    formattedDate: (state) => {
      const mapStore = useMapStore();
      const playbackStore = usePlaybackStore();
      return playbackStore.playbackEnabled
        ? formattedDate(playbackStore.playbackCurrentDate)
        : formattedDate(mapStore.currentDate);
    },
    getOffsetBottom: (state) => {
      const playbackStore = usePlaybackStore();
      const regionDetailedStore = useRegionDetailedStore();
      return playbackStore.playbackEnabled && !regionDetailedStore.isRegionSelected ? '110' : '20';
    },
  },

  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot));
}
