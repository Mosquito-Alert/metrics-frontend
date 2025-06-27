<template>
  <div class="bg-white rounded-borders">
    <h6 class="q-my-sm q-ml-sm text-weight-regular" style="color: #333">Bite Index Time Series</h6>
    <v-chart style="height: 330px" :option="option" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts';
import { date, getCssVar } from 'quasar';
import { computed } from 'vue';
import { use } from 'echarts/core';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, ScatterChart } from 'echarts/charts';
import { ANOMALY_COLORS } from 'src/constants/colors';
import { Metric } from 'anomaly-detection';
import { trendDataCorrection } from 'src/utils/trendDataCorrection';
import { useRegionDetailedStore } from '../../../stores/regionDetailedStore';
import { useMapStore } from 'src/stores/mapStore';
import { useUIStore } from 'src/stores/uiStore';

const uiStore = useUIStore();
const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();
use([
  TooltipComponent,
  LineChart,
  ScatterChart,
  CanvasRenderer,
  GridComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

const anomaliesLoading = computed(() => regionDetailedStore.fetchingRegionMetricsAll);
const anomaliesData = computed(() => regionDetailedStore.selectedRegionMetricsAll?.results || []);
const trendLoading = computed(() => regionDetailedStore.fetchingRegionMetricTrend);
const trendDate = computed((): Date => {
  return regionDetailedStore.selectedRegionMetricTrend?.date
    ? new Date(regionDetailedStore.selectedRegionMetricTrend.date)
    : new Date(mapStore.currentDate); // Default to the data date if no trend date is available
});
const trend = computed(() => {
  const data = regionDetailedStore.selectedRegionMetricTrend?.trend || [];
  return trendDataCorrection(data, trendDate.value);
});
const loading = computed(() => anomaliesLoading.value || trendLoading.value);
const percentageLastMonth = computed(() => {
  return 100 - ((365 * 2) / anomaliesData.value.length) * 100; // Assuming the last month has 30 days
});

// Calculates the indexes for today and the beginning of the year, to mark the dates on the chart
const indexes = computed(() => {
  const today = new Date(uiStore.getDate);
  const todayString = date.formatDate(today, 'YYYY-MM-DD');
  let lastYear: number | null = null;
  let indexToday = -1;
  let indexLastYearFirstDay = -1;

  anomaliesData.value.forEach((item, index) => {
    const itemDate = new Date(item.date);
    const itemYear = itemDate.getFullYear();
    const itemString = date.formatDate(itemDate, 'YYYY-MM-DD');

    // Find the index for today
    if (indexToday === -1 && itemString === todayString) {
      indexToday = index;
    }

    // Find the first day of the year
    if (lastYear === null || itemYear > lastYear) {
      lastYear = itemYear;
      indexLastYearFirstDay = index; // Reset to the first occurrence of the new year
    }
  });
  return { indexToday, indexLastYearFirstDay };
});

const option = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        animation: false,
        label: {
          backgroundColor: '#ccc',
          borderColor: '#aaa',
          borderWidth: 1,
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          color: '#222',
        },
      },
      formatter: (params: any) => {
        const date = params[0]?.name || 'Unknown Date';
        const value = params[0]?.value ? `${params[0].value.toFixed(2)}%` : 'N/A';
        const lowerBound = params[1]?.value ? `${params[1].value.toFixed(2)}%` : 'N/A';
        const upperBound =
          params[1].value && params[2]?.value
            ? `${(params[1].value + params[2].value).toFixed(2)}%`
            : 'N/A';
        const trend = params[4]?.value ? `${params[4].value.toFixed(2)}%` : 'N/A';
        // TODO: Conditionally show trend depending if it is disabled or not in the UI
        return `
          <strong>${date}</strong>
          <br/><hr>
          <span>Value: ${value}</span><br/>
          <span>Lower bound: ${lowerBound}</span><br/>
          <span>Upper bound: ${upperBound}</span><br/>
          <span>Trend: ${trend}</span><br/>
        `;
      },
    },
    legend: {
      data: [
        {
          name: 'Actuals',
          itemStyle: {
            color: '#909090',
          },
        },
        {
          name: 'Trend',
          itemStyle: {
            color: '#006400',
          },
        },
        {
          name: 'Confidence band',
          icon: 'rect',
          itemStyle: {
            color: '#6dad6d66',
          },
        },
        {
          name: 'Anomalies',
          icon: 'circle',
          itemStyle: {
            color: ANOMALY_COLORS.HIGH,
            borderWidth: 0.25,
          },
        },
      ],
      selected: {
        Trend: false,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: anomaliesData.value.map((item) => date.formatDate(item.date, 'YYYY-MM-DD')),
      boundaryGap: false,
    },
    yAxis: {
      name: 'Bite Index (%)',
      // min: 0, // Sets the minimum value to 0
      axisLabel: {
        formatter: (val: any) => val.toFixed(0) + '%', // Converts fractions to percentages
      },
      axisPointer: {
        label: {
          formatter: (params: any) => params.value.toFixed(2) + '%', // Converts fractions to percentages
        },
      },
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: percentageLastMonth.value,
        end: 100,
        // Change background color to red
        backgroundColor: '#a8a8a809',
        fillerColor: '#a8a8a844',
        dataBackground: {
          lineStyle: {
            color: '#a8a8a8',
          },
          areaStyle: {
            color: '#a8a8a866',
          },
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#a8a8a8',
          },
          areaStyle: {
            color: '#000',
          },
        },
        moveHandleStyle: { color: '#a8a8a8aa' },
        emphasis: { moveHandleStyle: { color: '#a8a8a8' } },
      },
      {
        type: 'inside',
        xAxisIndex: [0],
      },
    ],
    series: [
      {
        name: 'Actuals',
        type: 'line',
        lineStyle: {
          color: '#a8a8a8',
          width: 1.2,
        },
        data: anomaliesData.value.map((item: Metric) => ({
          value: (item.value || 0) * 100,
        })),
        showSymbol: false,
        markLine: {
          data: [
            {
              name: "Today's mark",
              xAxis: indexes.value.indexToday,
              label: {
                padding: [0, 58, 0, 0],
                formatter: () => date.formatDate(uiStore.getDate, 'MMM D, YYYY'),
                color: '#605158',
              },
              lineStyle: {
                color: '#909198',
                width: 1,
              },
            },
            {
              name: 'Beggining of the year',
              xAxis: indexes.value.indexLastYearFirstDay,
              label: { formatter: () => '' },
              lineStyle: {
                color: '#d1d1d1',
                width: 1,
                type: 'dotted',
              },
            },
          ],
          symbol: ['none', 'none'],
        },
      },
      {
        name: 'Uncertainty interval lower bound',
        type: 'line',
        data: anomaliesData.value.map((item) => (item.lower_value || 0) * 100),
        lineStyle: {
          opacity: 0,
        },
        stack: 'confidence-band',
        symbol: 'none',
      },
      {
        name: 'Confidence band',
        type: 'line',
        data: anomaliesData.value.map(
          (item) => (item.upper_value || 0) * 100 - (item.lower_value || 0) * 100,
        ),
        lineStyle: {
          opacity: 0,
        },
        areaStyle: {
          color: '#6dad6d66',
        },
        stack: 'confidence-band',
        symbol: 'none',
      },
      {
        name: 'Anomalies',
        type: 'scatter',
        // Put this above the confidence band
        z: 10,
        symbolSize: (value: any, params: any) => {
          const anomalyDegree = params.data.anomalyDegree || 0;
          if (anomalyDegree === 0) return 0; // Don't show symbols for non-anomalies
          return 6;
        },
        itemStyle: {
          color: '#909090',
          width: 1,
          borderColor: '#333333',
          borderWidth: 0.25,
          opacity: 1,
        },
        data: anomaliesData.value
          // .filter((item: Metric) => item.anomaly_degree !== null && item.anomaly_degree !== 0)
          .map((item: Metric) => ({
            value: (item.value as number) * 100,
            anomalyDegree: item.anomaly_degree,
            itemStyle: {
              color: (item.anomaly_degree as number) > 0 ? ANOMALY_COLORS.HIGH : ANOMALY_COLORS.LOW,
            },
          })),
        showSymbol: false,
      },
      {
        name: 'Trend',
        type: 'line',
        data: trend.value.map((item) => item.value * 1.0),
        itemStyle: {
          color: getCssVar('accent'),
        },
        lineStyle: {
          color: '#006400',
          width: 2,
          opacity: 0.8,
          type: 'dashed',
        },
        showSymbol: false,
      },
    ],
  };
});
</script>
