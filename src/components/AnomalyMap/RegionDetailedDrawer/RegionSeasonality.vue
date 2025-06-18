<template>
  <h6 class="q-mt-lg q-mb-none q-ml-sm text-weight-regular" style="color: #333">
    Seasonality Component
  </h6>
  <v-chart style="height: 250px" :option="option" :loading="loading" />
</template>

<script setup lang="ts">
import { LineChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { date, getCssVar } from 'quasar';
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { useRegionDetailedStore } from '../../../stores/regionDetailedStore';

use([
  TooltipComponent,
  LineChart,
  ScatterChart,
  CanvasRenderer,
  GridComponent,
  TitleComponent,
  DataZoomComponent,
]);

const regionDetailedStore = useRegionDetailedStore();

const loading = computed(() => regionDetailedStore.fetchingRegionMetricSeasonality);
const seasonalityData = computed(() => {
  const seasonality = regionDetailedStore.selectedRegionMetricSeasonality?.yearly || [];
  return seasonality.map((seasonalityItem: string, index: number) => ({
    date: new Date(2017, 0, index + 1), // Assuming index starts from 0 for January
    value: (Number(seasonalityItem) * 100).toFixed(2), // Convert to percentage
  }));
});

const trend = computed(() => regionDetailedStore.selectedRegionMetricTrend?.trend || []);
const anomaliesData = computed(() => {
  const rawData = regionDetailedStore.selectedRegionMetricsAll?.results || [];
  const groups: { [year: number]: [number, any][] } = {};

  // Group anomalies by year and convert date to day of the year
  for (const entry_i in rawData) {
    const entry = rawData[entry_i] as { date: string; value: number };
    const date = new Date(entry.date);
    const year = date.getFullYear();
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (!groups[year]) groups[year] = [];
    const value = (entry.value - trend.value[entry_i]) * 100; // Convert to percentage
    groups[year].push([dayOfYear, value]);
  }

  return groups;
});
const seriesData = computed(() => {
  return Object.keys(anomaliesData.value).map((year: any) => {
    const data = anomaliesData.value[year]?.sort((a: any, b: any) => a[0] - b[0]);
    return {
      name: year,
      type: 'line',
      data: data,
      lineStyle: {
        color: '#d94e1f55', // Highlight the last year's data
        width: 3,
        opacity: 1,
      },
    };
  });
});

const option = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return '<strong>' + params[0].name + '</strong>' + '<br />' + params[0].value;
      },
    },
    xAxis: {
      type: 'category',
      data: seasonalityData.value.map((item: any) => date.formatDate(item.date, 'MMM')),
      axisLabel: {
        interval: 30, // Adjust this number to show fewer labels if needed
      },
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      top: '20%',
      left: '3%',
      right: '4%',
      bottom: '20%',
      containLabel: true,
    },
    series: [
      {
        data: seasonalityData.value.map((item: any) => item),
        type: 'line',
        smooth: true,
        itemStyle: {
          color: getCssVar('accent'),
        },
      },
      ...seriesData.value,
    ],
  };
});
</script>
