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
  const groups: {
    [year: number]: { dayOfYear: number; value: any; upper_band?: any; lower_band?: any }[];
  } = {};

  // Group anomalies by year and convert date to day of the year
  let lastUsedTrendValue = null;
  for (const entry_i in rawData) {
    const entry = rawData[entry_i] as {
      date: string;
      value: number;
      upper_value: number; //| undefined;
      lower_value: number; //| undefined;
    };
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

    const values = {
      dayOfYear,
      value: (entry.value - trendValue) * 100, // Convert to percentage
      upper_band: entry.upper_value * 100 - trendValue * 100,
      lower_band: -(entry.upper_value - entry.lower_value) * 100,
    };
    groups[year].push(values);
  }

  return groups;
});

const seriesValuesData = computed(() => {
  const years = Object.keys(anomaliesData.value)
    .map(Number)
    .sort((a, b) => a - b);
  const mostRecentYear = Math.max(...years);
  let confidenceBand: any[] = [];

  const series = years.map((year: number) => {
    const isLastYear = year === mostRecentYear;
    const yearData = anomaliesData.value[year] || [];
    const sortedData = yearData.sort((a, b) => a.dayOfYear - b.dayOfYear);
    // Format for chart: [x, y] => [dayOfYear, value]
    const chartData = sortedData.map((d) => [d.dayOfYear, d.value]);

    if (isLastYear) {
      const lastPoint = sortedData.at(-1) || null;
      const xMarkLabelPadding =
        lastPoint && seasonalityData.value.length
          ? lastPoint.dayOfYear / (seasonalityData.value.length - 1) < 0.2
            ? -58
            : lastPoint.dayOfYear / (seasonalityData.value.length - 1) > 0.8
              ? 58
              : 0
          : 0;

      const markLine = lastPoint
        ? {
            markLine: {
              data: [
                {
                  name: "Today's mark",
                  xAxis: lastPoint.dayOfYear,
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
          }
        : {};

      // // Confidence band for the last year
      confidenceBand = [
        {
          name: 'Uncertainty interval upper bound',
          type: 'line',
          data: sortedData.map((item) => [item.dayOfYear, item.upper_band]),
          lineStyle: {
            opacity: 0,
          },
          stack: 'confidence-band',
          symbol: 'none',
        },
        {
          name: 'Confidence band',
          type: 'line',
          data: sortedData.map((item) => [item.dayOfYear, item.lower_band]),
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            color: '#6dad6d66',
          },
          stack: 'confidence-band',
          symbol: 'none',
        },
      ];

      return {
        name: 'Values Present Year',
        type: 'line',
        data: chartData,
        z: 10,
        showSymbol: false,
        silent: true,
        lineStyle: {
          color: '#000',
          width: 1.2,
          opacity: 1,
        },
        ...markLine,
      };
    }

    // Previous years
    return {
      name: 'Values Previous Years',
      type: 'line',
      data: chartData,
      z: 1,
      showSymbol: false,
      silent: true,
      lineStyle: {
        color: '#c4c4c4',
        width: 0.8,
        opacity: 0.8,
      },
    };
  });

  return [...series, ...confidenceBand];
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
          name: 'Values Present Year',
          itemStyle: {
            color: '#000',
          },
        },
        {
          name: 'Values Previous Years',
          itemStyle: {
            color: '#a8a8a8',
          },
        },
        {
          name: 'Confidence band',
          itemStyle: {
            color: '#6dad6d66',
          },
          icon: 'rect',
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
    series: [
      ...seriesValuesData.value,
      {
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
      },
    ],
  };
});
</script>
