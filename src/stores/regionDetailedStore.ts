import { defineStore, acceptHMRUpdate } from 'pinia';
import { metricsApi, regionsApi } from '../services/apiService';
import {
  MetricDetail,
  MetricSeasonality,
  MetricTrend,
  Municipality,
  PaginatedMetricList,
} from 'anomaly-detection';
import { historyPageSize } from '../constants/config';
import { FeatureLike } from 'ol/Feature';
import { GeoJSON } from 'ol/format';
import { useMapStore } from './mapStore';
import { usePlaybackStore } from './playbackStore';

const _getFormattedRegionMetric = (metric: MetricDetail | null): MetricDetail | null => {
  if (!metric) return null;
  const { value, predicted_value, lower_value, upper_value, anomaly_degree } = metric;
  const roundPercent = (value: number): number => Math.round(value * 1000) / 10;
  return {
    ...metric,
    value: value ? roundPercent(value) : 0,
    predicted_value: predicted_value ? roundPercent(predicted_value) : 0,
    lower_value: lower_value ? roundPercent(lower_value) : 0,
    upper_value: upper_value ? roundPercent(upper_value) : 0,
    anomaly_degree: anomaly_degree ? roundPercent(anomaly_degree) : 0,
  };
};

export const useRegionDetailedStore = defineStore('regionDetailedStore', {
  state: () => ({
    lastRegionMetricId: '',
    selectedRegion: null as Municipality | null,
    lastRegionMetric: null as MetricDetail | null,
    fetchingLastRegionMetric: true,
    currentRegionMetric: null as MetricDetail | null,
    fetchingCurrentRegionMetric: true,
    selectedRegionMetricsHistory: null as PaginatedMetricList | null,
    fetchingRegionMetricsHistory: true,
    selectedRegionMetricsAll: null as PaginatedMetricList | null,
    fetchingRegionMetricsAll: true,
    selectedRegionMetricTrend: null as MetricTrend | null,
    fetchingRegionMetricTrend: true,
    selectedRegionMetricSeasonality: null as MetricSeasonality | null,
    fetchingRegionMetricSeasonality: true,
    showTable: false,
  }),

  getters: {
    isRegionSelected: (state): boolean => state.lastRegionMetricId !== '',
    getFormattedLastRegionMetric: (state): MetricDetail | null =>
      _getFormattedRegionMetric(state.lastRegionMetric),
    getFormattedCurrentRegionMetric: (state): MetricDetail | null =>
      _getFormattedRegionMetric(state.currentRegionMetric),
  },

  actions: {
    async fetchSelectedRegion(id: number, metricId: string): Promise<void> {
      const mapStore = useMapStore();
      try {
        const response = await regionsApi.retrieve({ id: id });
        if (response.status === 200 && response.data) {
          const format = new GeoJSON();
          const feature = format.readFeature(response.data.geometry, {
            extent: mapStore.extent,
            featureProjection: mapStore.projection,
          }) as any;
          feature.setId(metricId);
          mapStore.selectedFeatures = [feature as FeatureLike];
        } else {
          throw new Error('Failed to fetch selected region');
        }
      } catch (error) {
        console.error('Error fetching selected region:', error);
      }
    },
    async fetchLastMetric(metricUuid: string): Promise<void> {
      try {
        this.fetchingLastRegionMetric = true;
        const response = await metricsApi.retrieve({ id: metricUuid });
        if (response.status === 200 && response.data) {
          this.lastRegionMetric = response.data;
          this.fetchingLastRegionMetric = false;
          this.fetchCurrentMetric(this.lastRegionMetric.region.code);
        } else {
          throw new Error('Failed to fetch selected region metric');
        }
      } catch (error) {
        console.error('Error fetching selected region:', error);
      }
    },
    async fetchCurrentMetric(regionCode: string): Promise<void> {
      const playbackStore = usePlaybackStore();
      const mapStore = useMapStore();
      if (playbackStore.playbackCurrentDate === mapStore.lastDate) {
        // If playback is on the last date, use the last region metric
        this.currentRegionMetric = this.lastRegionMetric;
        this.fetchingCurrentRegionMetric = false;
        return;
      }
      try {
        this.fetchingCurrentRegionMetric = true;
        // const response = await metricsApi.retrieve({ id: metricUuid });
        const response = await metricsApi.list({
          regionCode: regionCode,
          dateFrom: playbackStore.playbackCurrentDate,
          dateTo: playbackStore.playbackCurrentDate,
          page: 1,
          pageSize: 1,
        });
        if (response.status === 200 && response.data) {
          this.currentRegionMetric = response.data.results[0] || (null as any);
          this.fetchingCurrentRegionMetric = false;
        } else {
          throw new Error('Failed to fetch selected region metric');
        }
      } catch (error) {
        console.error('Error fetching selected region:', error);
      }
    },
    async fetchSelectedMetricHistory({
      daysSince = 30,
      page = 1,
      pageSize = historyPageSize,
    }: {
      daysSince?: number;
      page?: number;
      pageSize?: number;
    }): Promise<void> {
      if (!this.lastRegionMetric || !this.lastRegionMetric?.region) return;
      // Get the date from 30 days before the selected date
      const dateFrom = new Date(this.lastRegionMetric?.date || new Date());
      dateFrom.setDate(dateFrom.getDate() - daysSince);
      const dateStringFrom = dateFrom.toISOString().split('T')[0] || '';
      try {
        this.fetchingRegionMetricsHistory = true;
        const response = await metricsApi.list({
          regionCode: this.lastRegionMetric?.region?.code,
          dateFrom: dateStringFrom,
          dateTo: this.lastRegionMetric.date,
          page: page,
          pageSize: pageSize,
        });
        if (response.status === 200 && response.data) {
          this.selectedRegionMetricsHistory = response.data;
          this.fetchingRegionMetricsHistory = false;
        } else {
          throw new Error('Failed to fetch history for the selected region');
        }
      } catch (error) {
        console.error('Error fetching selected region:', error);
      }
    },
    async fetchSelectedMetricAll(): Promise<void> {
      // TODO: Improve this to fetch all metrics (change API to support this)
      const daysSince = 10 * 365; // Last 10 years
      const pageSize = 10000000; // Large page size to fetch all metrics
      if (!this.lastRegionMetric || !this.lastRegionMetric?.region) return;

      const dateFrom = new Date(this.lastRegionMetric?.date || new Date());
      dateFrom.setDate(dateFrom.getDate() - daysSince);
      const dateStringFrom = dateFrom.toISOString().split('T')[0] || '';

      try {
        this.fetchingRegionMetricsAll = true;
        const response = await metricsApi.list({
          regionCode: this.lastRegionMetric?.region?.code,
          dateFrom: dateStringFrom,
          dateTo: this.lastRegionMetric.date,
          page: 1,
          pageSize: pageSize,
          ordering: 'date',
        });
        if (response.status === 200 && response.data) {
          this.selectedRegionMetricsAll = response.data;
          this.fetchingRegionMetricsAll = false;
        } else {
          throw new Error('Failed to fetch all metrics for the selected region');
        }
      } catch (error) {
        console.error('Error fetching selected region:', error);
      }
    },
    async fetchSelectedMetricTrend(): Promise<void> {
      if (!this.lastRegionMetric || !this.lastRegionMetric?.region) return;

      try {
        this.fetchingRegionMetricTrend = true;
        const response = await metricsApi.trendRetrieve({
          id: this.lastRegionMetric?.id,
        });
        if (response.status === 200 && response.data) {
          this.selectedRegionMetricTrend = response.data;
          this.fetchingRegionMetricTrend = false;
        } else {
          throw new Error('Failed to fetch trend for the selected region');
        }
      } catch (error) {
        console.error('Error fetching selected region trend:', error);
      }
    },
    async fetchSelectedMetricSeasonality(): Promise<void> {
      if (!this.lastRegionMetric || !this.lastRegionMetric?.region) return;

      try {
        this.fetchingRegionMetricSeasonality = true;
        const response = await metricsApi.seasonalityRetrieve({
          id: this.lastRegionMetric?.id,
        });
        if (response.status === 200 && response.data) {
          this.selectedRegionMetricSeasonality = response.data;
          this.fetchingRegionMetricSeasonality = false;
        } else {
          throw new Error('Failed to fetch seasonality for the selected region');
        }
      } catch (error) {
        console.error('Error fetching selected region seasonality:', error);
      }
    },
    async selectRegionMetric(metricId: string) {
      const playbackStore = usePlaybackStore();
      this.lastRegionMetricId = metricId;
      if (!playbackStore.playbackPaused) {
        playbackStore.pause();
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRegionDetailedStore, import.meta.hot));
}
