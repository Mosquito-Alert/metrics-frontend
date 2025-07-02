import { Metric } from 'anomaly-detection';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { metricsApi } from '../services/apiService';
import { formattedDate, getDatesBetween, subtractDays } from '../utils/date';
import { useRegionDetailedStore } from './regionDetailedStore';
import { useMapStore } from './mapStore';

export const usePlaybackStore = defineStore('playbackStore', {
  state: () => ({
    playbackEnabled: false as boolean,
    playbackFinished: false as boolean, // Flag to indicate if playback has finished
    playbackDays: 30 as number,
    playbackDaysObject: {} as Record<number, string>, // Axis for playback days, indexed by day
    playbackSpeed: 0.75 as number, // Speed in seconds per day
    playbackPaused: true as boolean,
    playbackCurrentIndex: 0 as number,
    playbackCurrentDate: '' as string, // Default date, can be updated later
    data: null as Metric | any, // Replace with actual type if known
    fetchingData: false as boolean, // Flag to indicate if data is being fetched
  }),

  getters: {
    formattedPlaybackCurrentDate: (state) => {
      return formattedDate(state.playbackCurrentDate);
    },
  },

  actions: {
    async fetchData(date: string, x: string, y: string, z: string) {
      this.fetchingData = true; // Set fetching flag to true
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
      const firstDate = subtractDays(date, this.playbackDays - 1);
      this.playbackDaysObject = getDatesBetween(firstDate, date);
      this.playbackCurrentDate = this.playbackCurrentDate || firstDate;
      // this.playbackCurrentIndex = 0; // Reset index to the start
      this.fetchingData = false; // Reset fetching flag
      return response.data;
    },
    togglePlayback() {
      const regionDetailedStore = useRegionDetailedStore();
      this.playbackEnabled = !this.playbackEnabled;
      if (!this.playbackEnabled) {
        // Enabling playback
        // Reset playback state when enabling playback
        this.playbackCurrentDate = this.playbackDaysObject[0] || '';
        this.playbackCurrentIndex = 0;
        this.data = null; // Clear previous data
      } else {
        this.toggleVideoPlayback();
        const mapStore = useMapStore();
        const firstDate = subtractDays(mapStore.lastDate, this.playbackDays - 1);
        this.playbackDaysObject = getDatesBetween(firstDate, mapStore.lastDate);
        this.playbackCurrentDate = this.playbackCurrentDate || firstDate;
      }
      regionDetailedStore.$reset(); // Reset region detailed store
    },
    updateCurrentDate(index: number) {
      this.playbackCurrentDate = this.playbackDaysObject[index] || '';
      if (this.playbackCurrentIndex == Object.keys(this.playbackDaysObject).length - 1) {
        this.playbackFinished = true; // Set playback finished flag
      } else {
        this.playbackFinished = false; // Reset playback finished flag
      }
    },
    play() {
      const delay = this.playbackSpeed * 1000; // Convert seconds to milliseconds
      // Update the current index and date every delay seconds. But between each update,
      // we need to check if playback is paused or not.
      const interval = setInterval(() => {
        if (this.playbackPaused || !this.playbackEnabled) {
          clearInterval(interval);
          return;
        }
        if (this.playbackCurrentIndex == Object.keys(this.playbackDaysObject).length - 1) {
          clearInterval(interval); // Stop playback when reaching the end
          this.playbackPaused = true; // Pause playback at the end
          return;
        }
        this.playbackCurrentIndex++;
        this.updateCurrentDate(this.playbackCurrentIndex);
      }, delay);
    },
    pause() {
      this.playbackPaused = true; // Set playback to paused
    },
    toggleVideoPlayback() {
      this.playbackPaused = !this.playbackPaused; // Toggle playback paused state
      if (!this.playbackPaused) {
        if (this.playbackCurrentIndex >= Object.keys(this.playbackDaysObject).length - 1) {
          this.playbackCurrentIndex = 0; // Reset index to the start
          this.updateCurrentDate(this.playbackCurrentIndex); // Update current date
        }
        this.play(); // Start playback if not paused
      }
    },
    goBackDays(days: number) {
      if (this.playbackCurrentIndex - days < 0) {
        this.playbackCurrentIndex = 0; // Prevent going below zero
      } else {
        this.playbackCurrentIndex -= days;
      }
      this.updateCurrentDate(this.playbackCurrentIndex);
    },
    goForwardDays(days: number) {
      if (this.playbackCurrentIndex + days >= Object.keys(this.playbackDaysObject).length) {
        this.playbackCurrentIndex = Object.keys(this.playbackDaysObject).length - 1; // Prevent going beyond the last index
      } else {
        this.playbackCurrentIndex += days;
      }
      this.updateCurrentDate(this.playbackCurrentIndex);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlaybackStore, import.meta.hot));
}
