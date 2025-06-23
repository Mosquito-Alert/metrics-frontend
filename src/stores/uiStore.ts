import { defineStore, acceptHMRUpdate } from 'pinia';
import routesNames from '../router/routesNames';
import { formattedDate } from '../utils/date';
import { useMapStore } from './mapStore';
import { usePlaybackStore } from './playbackStore';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    appWidth: window.innerWidth as number,
    regionDetailDrawerWidth: 0,
    currentTab: routesNames.anomalyMap,
  }),

  getters: {
    formattedDate: (state) => {
      const mapStore = useMapStore();
      const playbackStore = usePlaybackStore();
      return playbackStore.playbackEnabled
        ? formattedDate(playbackStore.playbackCurrentDate)
        : formattedDate(mapStore.currentDate);
    },
  },

  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot));
}
