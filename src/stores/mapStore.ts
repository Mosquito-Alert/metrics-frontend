import { defineStore, acceptHMRUpdate } from 'pinia';
import { FeatureLike } from 'ol/Feature';
import { MVT } from 'ol/format';
import { Metric } from 'anomaly-detection';
import { metricsApi } from '../services/apiService';

export const useMapStore = defineStore('mapStore', {
  state: () => ({
    format: null as MVT | null,
    projection: 'EPSG:3857' as string,
    center: [-3.6, 40.0] as number[],
    zoom: 6.8 as number,
    maxZoom: 17 as number,
    extent: [] as number[],
    basemapLayer: {
      url: 'https://basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
      attributions:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap </a> contributors, © <a href='https://carto.com/about-carto'>Carto</a>",
      attributionsCollapsible: false,
      preload: Infinity,
    },
    labelsLayer: {
      url: 'https://basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
      preload: Infinity,
      opaque: false,
    },
    selectedFeatures: [] as FeatureLike[],
    data: null as Metric | any, // Replace with actual type if known
    fetchingDate: true,
    currentDate: '' as string, // Default date, can be updated later:
    showAutonomousCommunities: false,
  }),

  getters: {},

  actions: {
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
    async fetchData(date: string, x: number, y: number, z: number) {
      const response = await metricsApi.tilesRetrieve(
        {
          date: date,
          x: x.toString(),
          y: y.toString(),
          z: z.toString(),
        },
        { responseType: 'arraybuffer' }, // Ensure we get the data as an ArrayBuffer
      );
      this.data = response.data;
      return response.data;
    },
    setDate(newDate: string) {
      this.currentDate = newDate;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot));
}
