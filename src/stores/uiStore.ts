import { defineStore, acceptHMRUpdate } from 'pinia';
import { metricsApi } from '../services/apiService';
import routesNames from '../router/routesNames';
import { formattedDate } from '../utils/date';

export const useUIStore = defineStore('uiStore', {
  state: () => ({
    date: '2025-01-01',
    fetchingDate: true,
    appWidth: window.innerWidth as number,
    regionDetailDrawerWidth: 0,
    currentTab: routesNames.anomalyMap,
  }),

  getters: {
    formattedDate: (state) => {
      return formattedDate(state.date);
    },
  },

  actions: {
    // * Date
    async fetchLastDate() {
      try {
        this.fetchingDate = true;
        const response = await metricsApi.lastDateRetrieve();
        if (response.status === 200 && response.data) {
          this.setDate(response.data.date);
          this.fetchingDate = false;
        } else {
          throw new Error('Failed to fetch last date');
        }
      } catch (error) {
        console.error('Error fetching last date:', error);
      }
    },
    setDate(newDate: string) {
      this.date = newDate;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot));
}
