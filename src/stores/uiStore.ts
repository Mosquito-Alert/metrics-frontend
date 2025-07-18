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
    currentTab: routesNames.biteIndexMap,
  }),

  getters: {
    getDate: (state) => {
      const mapStore = useMapStore();
      const playbackStore = usePlaybackStore();
      return playbackStore.playbackEnabled
        ? new Date(playbackStore.playbackCurrentDate)
        : new Date(mapStore.lastDate);
    },
    formattedDate: (state) => {
      const mapStore = useMapStore();
      const playbackStore = usePlaybackStore();
      return playbackStore.playbackEnabled
        ? formattedDate(playbackStore.playbackCurrentDate)
        : formattedDate(mapStore.lastDate);
    },
    playbackWidth: (state) => {
      const regionDetailedStore = useRegionDetailedStore();
      return regionDetailedStore.lastRegionMetricId
        ? state.appWidth - state.regionDetailDrawerWidth
        : state.appWidth;
    },
  },

  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot));
}
