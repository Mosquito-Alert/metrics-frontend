import { Metric } from 'anomaly-detection';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { metricsApi } from '../services/apiService';

export const usePlaybackStore = defineStore('playbackStore', {
  state: () => ({
    playbackEnabled: false as boolean,
    playbackDays: 30 as number,
    playbackSpeed: 0.5 as number, // Speed in seconds per day
    playbackStartDate: new Date() as Date,
    playbackEndDate: new Date() as Date,
    playbackPaused: true as boolean,
    playbackCurrentDate: new Date() as Date,
    data: null as Metric | any, // Replace with actual type if known
  }),

  getters: {},

  actions: {
    async fetchData(date: string, x: string, y: string, z: string) {
      const response = await metricsApi.timeseriesTilesRetrieve(
        {
          date: date,
          days: this.playbackDays,
          x: x,
          y: y,
          z: z,
        },
        { responseType: 'arraybuffer' }, // Ensure we get the data as an ArrayBuffer
      );
      this.data = response.data;
      return response.data;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlaybackStore, import.meta.hot));
}
