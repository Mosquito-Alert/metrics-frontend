import { defineStore, acceptHMRUpdate } from 'pinia';
import { FeatureLike } from 'ol/Feature';
import { MVT } from 'ol/format';

export const useMapStore = defineStore('mapStore', {
  state: () => ({
    format: null as MVT | null,
    projection: 'EPSG:3857' as string,
    center: [-3.6, 40.0] as number[],
    zoom: 6.8 as number,
    maxZoom: 17 as number,
    extent: [] as number[],
    selectedFeatures: [] as FeatureLike[],
  }),

  getters: {},

  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot));
}
