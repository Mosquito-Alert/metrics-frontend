import { Metric } from 'metrics';
import { defineStore, acceptHMRUpdate } from 'pinia';
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
    availableDates: [] as { date: string }[], // Array to hold available dates for playback
    fetchingAvailableDates: false as boolean, // Flag to indicate if available dates should be fetched
    renderCompleted: false as boolean, // Flag to indicate if the WMS render is completed
  }),

  getters: {
    formattedPlaybackCurrentDate: (state) => {
      return formattedDate(state.playbackCurrentDate);
    },
  },

  actions: {
    resetPlayback() {
      this.togglePlayback();
      this.togglePlayback();
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
        // this.toggleVideoPlayback();
        const mapStore = useMapStore();
        const firstDate = subtractDays(mapStore.lastDate, this.playbackDays - 1);
        this.playbackDaysObject = getDatesBetween(firstDate, mapStore.lastDate);
        this.playbackCurrentIndex = Object.keys(this.playbackDaysObject).length - 1; // Set index to the last day
        this.playbackCurrentDate = this.playbackDaysObject[this.playbackCurrentIndex] || firstDate;
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
    async play() {
      const baseDelay = this.playbackSpeed * 1000; // Typically 750ms
      this.playbackPaused = false;

      while (
        !this.playbackPaused &&
        this.playbackEnabled &&
        this.playbackCurrentIndex < Object.keys(this.playbackDaysObject).length - 1
      ) {
        this.playbackCurrentIndex++;
        this.renderCompleted = false; // Reset before rendering
        this.updateCurrentDate(this.playbackCurrentIndex); // Triggers WMS update

        await this.waitForRenderOrTimeout(baseDelay);

        // Add a post-render buffer
        await this.delay(200);
      }

      if (this.playbackCurrentIndex === Object.keys(this.playbackDaysObject).length - 1) {
        this.playbackPaused = true;
      }
    },

    delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    waitForRenderOrTimeout(timeout: number) {
      return new Promise<void>((resolve) => {
        const start = Date.now();

        const check = () => {
          const elapsed = Date.now() - start;

          if (this.renderCompleted || elapsed >= timeout) {
            resolve();
          } else {
            requestAnimationFrame(check); // Check again soon
          }
        };

        check();
      });
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
