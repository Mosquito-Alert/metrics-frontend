import { Metric } from 'anomaly-detection';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { metricsApi } from '../services/apiService';
import { formattedDate, getDatesBetween, subtractDays } from '../utils/date';

export const usePlaybackStore = defineStore('playbackStore', {
  state: () => ({
    playbackEnabled: false as boolean,
    playbackDays: 30 as number,
    playbackDaysAxis: {} as Record<number, string>, // Axis for playback days, indexed by day
    // playbackSpeed: 0.5 as number, // Speed in seconds per day
    // playbackStartDate: new Date() as Date,
    // playbackEndDate: new Date() as Date,
    // playbackPaused: true as boolean,
    playbackCurrentIndex: 0 as number,
    playbackCurrentDate: '2025-01-01' as string, // Default date, can be updated later
    data: null as Metric | any, // Replace with actual type if known
  }),

  getters: {
    formattedPlaybackCurrentDate: (state) => {
      return formattedDate(state.playbackCurrentDate);
    },
  },

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
      const firstDate = subtractDays(date, this.playbackDays - 1);
      this.playbackDaysAxis = getDatesBetween(firstDate, date);
      this.playbackCurrentDate = firstDate;
      this.playbackCurrentIndex = 0; // Reset index to the start
      return response.data;
    },
    togglePlayback() {
      this.playbackEnabled = !this.playbackEnabled;
      if (this.playbackEnabled) {
        // Reset playback state when enabling playback
        this.playbackCurrentIndex = 0;
      }
    },
    updateCurrentIndex(index: number) {
      this.playbackCurrentIndex = index;
      this.playbackCurrentDate = this.playbackDaysAxis[index] || '';
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlaybackStore, import.meta.hot));
}
