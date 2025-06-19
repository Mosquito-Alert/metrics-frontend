<template>
  <h6 class="q-mt-lg q-my-sm q-mb-none q-ml-sm text-weight-regular" style="color: #333">
    Seasonality Component
  </h6>
  <v-chart style="height: 300px" :option="option" :loading="loading" />
</template>

<script setup lang="ts">
import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { date } from 'quasar';
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { useRegionDetailedStore } from '../../../stores/regionDetailedStore';

use([TooltipComponent, LineChart, CanvasRenderer, GridComponent, TitleComponent]);

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
  let lastUsedTrendValue = null;
  for (const entry_i in rawData) {
    const entry = rawData[entry_i] as { date: string; value: number };
    const date = new Date(entry.date);
    const year = date.getFullYear();
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (!groups[year]) groups[year] = [];
    let trendValue = trend.value?.[entry_i];
    if (trendValue == null || isNaN(trendValue)) {
      trendValue = lastUsedTrendValue; // Use last used trend value if current is null
    }

    lastUsedTrendValue = trendValue; // Update last used trend value

    const value = (entry.value - trendValue) * 100; // Convert to percentage
    groups[year].push([dayOfYear, value]);
  }

  return groups;
});
const seriesData = computed(() => {
  const years = Object.keys(anomaliesData.value)
    .map(Number)
    .sort((a, b) => a - b);
  const mostRecentYear = Math.max(...years);
  const totalYears = years.length;
  const series: any = years.map((year: any, idx: number) => {
    const isLastYear = year === mostRecentYear;

    let color;
    if (isLastYear) {
      color = '#000'; // Highlight the last year's data
    } else {
      const grayLevel = Math.floor(215 - (idx / (totalYears - 1)) * 100);
      color = `rgb(${grayLevel}, ${grayLevel}, ${grayLevel})`; // Grayscale for other years
    }

    const sortedData = anomaliesData.value[year]?.sort((a, b) => a[0] - b[0]);
    const lastPoint = sortedData?.at(-1) || null;

    let markLine = undefined;
    if (isLastYear && lastPoint) {
      const xMarkLabelPadding =
        lastPoint[0] / (seasonalityData.value.length - 1) < 0.2
          ? -58
          : lastPoint[0] / (seasonalityData.value.length - 1) > 0.8
            ? 58
            : 0;
      markLine = {
        markLine: {
          data: [
            {
              name: "Today's mark",
              xAxis: lastPoint[0],
              label: {
                padding: [0, xMarkLabelPadding, 0, 0],
                formatter: () => {
                  const fullDate =
                    regionDetailedStore.selectedRegionMetricsAll?.results?.at(-1)?.date;
                  return ` ${date.formatDate(fullDate, 'MMMM D, YYYY')} `;
                },
                color: '#605158',
              },
              lineStyle: {
                color: '#909198',
                width: 1,
              },
            },
          ],
          symbol: ['none', 'none'],
        },
      };
    }

    return {
      name: isLastYear ? 'Present Year' : 'Previous Years',
      type: 'line',
      data: sortedData,
      z: isLastYear ? 10 : 1,
      showSymbol: false,
      silent: true,
      lineStyle: {
        color,
        width: isLastYear ? 1 : 0.8,
        opacity: isLastYear ? 1 : 0.8,
      },
      ...markLine,
    };
  });

  const seasonalitySeries = {
    name: 'Seasonality',
    type: 'line',
    smooth: true,
    data: seasonalityData.value.map((item: any) => item),
    itemStyle: {
      color: '#333333',
    },
    silent: true,
    z: 8,
    showSymbol: false,
    lineStyle: {
      color: '#006400',
      width: 2,
      opacity: 0.8,
      type: 'dashed',
    },
  };

  return [...series, seasonalitySeries];
});

const option = computed(() => {
  return {
    xAxis: {
      type: 'category',
      data: seasonalityData.value.map((item: any) => date.formatDate(item.date, 'MMM')),
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#a8a8a8',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val: any) => val.toFixed(0) + '%', // Converts fractions to percentages
      },
    },
    legend: {
      data: [
        {
          name: 'Seasonality',
          itemStyle: {
            color: '#006400',
          },
        },
        {
          name: 'Present Year',
          itemStyle: {
            color: '#000',
          },
        },
        {
          name: 'Previous Years',
          itemStyle: {
            color: '#a8a8a8',
          },
        },
      ],
    },
    grid: {
      top: '20%',
      left: '3%',
      right: '4%',
      bottom: '20%',
      containLabel: true,
    },
    series: [...seriesData.value],
  };
});
</script>
