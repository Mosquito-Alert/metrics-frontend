<template>
  <div class="seasonality-header">
    <h6 class="q-my-sm q-ml-sm text-weight-regular" style="color: #333">Seasonality</h6>
    <div>
      <div class="seasonality-selector q-mr-md">
        <button
          v-for="option in seasonalitySelectorOptions"
          :key="option.value"
          class="seasonality-selector-option"
          @click="seasonalitySelectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
  <v-chart
    ref="chartRef"
    style="height: 300px"
    :option="option"
    :loading="loading"
    autoresize
    @legendselectchanged="legendSelectChanged"
  />
</template>

<script setup lang="ts">
import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { date } from 'quasar';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { getDayIndexInYear } from 'src/utils/date';
import { computed, ref } from 'vue';
import VChart from 'vue-echarts';

use([TooltipComponent, LineChart, CanvasRenderer, GridComponent, TitleComponent]);

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();

const chartRef = ref(null as any);
const seasonalitySelectorOptions = [
  { label: 'Deviation', value: 'Deviation' },
  { label: 'Previous Years', value: 'Previous Years' },
];
const seasonalitySelector = ref('Deviation'); // Example toggle model, adjust as needed
const updateDataZoom = ref(0.23); // Dummy ref to trigger reactivity
const seasonalitySelectOption = (value: string) => {
  seasonalitySelector.value = value;
  updateDataZoom.value = Math.random();
};

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
    [year: number]: {
      dayOfYear: number;
      value: number | undefined;
      upper_band: number | undefined;
      lower_band: number | undefined;
      anomaly_degree: number | undefined;
    }[];
  } = {};

  // Group anomalies by year and convert date to day of the year
  let lastUsedTrendValue = null;
  for (const entry_i in rawData) {
    const entry = rawData[entry_i] as {
      date: string;
      value: number;
      upper_value: number | undefined;
      lower_value: number | undefined;
      anomaly_degree: number | undefined;
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
      upper_band: (entry.upper_value || 0) * 100 - trendValue * 100,
      lower_band: -((entry.upper_value || 0) - (entry.lower_value || 0)) * 100,
      anomaly_degree: entry.anomaly_degree || 0, // Default to 0 if undefined
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

  const series = years.flatMap((year: number) => {
    const isLastYear = year === mostRecentYear;
    const yearData = anomaliesData.value[year] || [];
    const sortedData = yearData.sort((a, b) => a.dayOfYear - b.dayOfYear);
    // Format for chart: [x, y] => [dayOfYear, value]
    const chartData = sortedData.map((d) => [d.dayOfYear, d.value]);

    if (isLastYear) {
      const currentDate = new Date(uiStore.getDate);
      const currentDateIndex = getDayIndexInYear(currentDate);
      const lastPoint = sortedData.find((item) => item.dayOfYear === currentDateIndex) || null;
      const xMarkLabelPadding =
        lastPoint && seasonalityData.value.length
          ? lastPoint.dayOfYear / (seasonalityData.value.length - 1) < 0.2
            ? -58
            : lastPoint.dayOfYear / (seasonalityData.value.length - 1) > 0.8
              ? 58
              : 0
          : 0;

      // Prepare data for deviation areas
      const belowBase = [];
      const belowTop = [];
      const aboveBase = [];
      const aboveTop = [];
      for (const i in sortedData) {
        const d = sortedData[i] as {
          dayOfYear: number;
          value: number | undefined;
        };
        const seasonalityValue = Number(seasonalityData.value[i]?.value || 0);
        const value = d.value || 0;
        if (value < seasonalityValue) {
          // Fill below seasonality area
          belowTop.push([d.dayOfYear, value - seasonalityValue]); // - trend.value[i]
          belowBase.push([d.dayOfYear, seasonalityValue]);
          aboveBase.push([d.dayOfYear, seasonalityValue]); // - trend.value[i]
          aboveTop.push([d.dayOfYear, 0]);
        } else {
          // Fill above seasonality area
          belowBase.push([d.dayOfYear, seasonalityValue]); // - trend.value[i]
          belowTop.push([d.dayOfYear, 0]);
          aboveBase.push([d.dayOfYear, value]); // - trend.value[i]
          aboveTop.push([d.dayOfYear, -(value - seasonalityValue)]);
        }
      }

      const markLine = lastPoint
        ? {
            markLine: {
              animation: false,
              // animationDuration: 100,
              data: [
                {
                  name: "Today's mark",
                  xAxis: lastPoint.dayOfYear,
                  label: {
                    padding: [0, xMarkLabelPadding, 0, 0],
                    formatter: () => ` ${date.formatDate(uiStore.getDate, 'MMM D, YYYY')} `,
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

      // Above Seasonality Area (red)
      const aboveBaseSeries = {
        name: 'Seasonal Deviation',
        type: 'line',
        data: aboveBase,
        lineStyle: { opacity: 0 },
        stack: 'above',
        symbol: 'none',
      };

      const aboveTopSeries = {
        name: 'Seasonal Deviation',
        type: 'line',
        data: aboveTop,
        lineStyle: { opacity: 0 },
        areaStyle: { color: '#e21b1f', opacity: 0.65 },
        stack: 'above',
        symbol: 'none',
        z: 5,
      };

      // Below Seasonality Area (blue)
      const belowBaseSeries = {
        name: 'Seasonal Deviation',
        type: 'line',
        data: belowBase,
        lineStyle: { opacity: 0 },
        stack: 'below',
        symbol: 'none',
      };

      const belowTopSeries = {
        name: 'Seasonal Deviation',
        type: 'line',
        data: belowTop,
        lineStyle: { opacity: 0 },
        areaStyle: { color: '#0072c4', opacity: 0.65 },
        stack: 'below',
        symbol: 'none',
        z: 4,
      };

      return [
        {
          name: 'Values Present Year',
          type: 'line',
          data: chartData,
          z: 10,
          showSymbol: false,
          symbol: 'none',
          silent: true,
          lineStyle: {
            color: '#000',
            width: 1,
            opacity: 1,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              opacity: 0, // Hide hover circle
            },
            symbol: 'none',
          },
          ...markLine,
        },
        aboveBaseSeries,
        aboveTopSeries,
        belowBaseSeries,
        belowTopSeries,
      ];
    }

    // Previous years
    return {
      name: 'Values Previous Years',
      type: 'line',
      data: chartData,
      z: 1,
      showSymbol: false,
      symbol: 'none',
      silent: true,
      lineStyle: {
        color: '#c4c4c4',
        width: 0.8,
        opacity: 0.8,
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          opacity: 0, // Hide hover circle
        },
        symbol: 'none',
      },
    };
  });

  const seasonalitySeries = {
    name: 'Average',
    type: 'line',
    smooth: true,
    data: seasonalityData.value.map((item: any) => item),
    itemStyle: {
      color: '#333333',
    },
    silent: true,
    z: 8,
    showSymbol: false,
    symbol: 'none',
    lineStyle: {
      color: '#006400',
      width: 2,
      opacity: 0.8,
      type: 'dashed',
    },
    emphasis: {
      focus: 'series',
      itemStyle: {
        opacity: 0, // Hide hover circle
      },
      symbol: 'none',
    },
  };

  return [...series, seasonalitySeries];
});

const option = computed(() => {
  updateDataZoom.value; // Trigger reactivity
  return {
    xAxis: {
      type: 'category',
      // data: seasonalityData.value.map((item: any) => date.formatDate(item.date, 'MMM')),
      data: seasonalityData.value.map((item: any) => item.date),
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#a8a8a8',
        },
      },
      axisLabel: {
        interval: 30, // Adjust this number to show fewer labels if needed
        formatter: (value: string) => date.formatDate(value, 'MMM'),
      },
      axisPointer: {
        show: true,
        label: {
          formatter: (params: any) => {
            const dateValue = new Date(params.value);
            return date.formatDate(dateValue, 'MMM D, YYYY');
          },
        },
      },
    },
    yAxis: {
      // name: 'Bite Probability',
      type: 'value',
      axisLabel: {
        formatter: (val: any) => val.toFixed(0) + '%', // Converts fractions to percentages
      },
      axisPointer: {
        show: true,
        label: {
          formatter: (params: any) => params.value.toFixed(2) + '%',
        },
      },
    },
    legend: {
      type: 'scroll',
      selected: {
        'Values Previous Years': seasonalitySelector.value === 'Previous Years',
        'Seasonal Deviation': seasonalitySelector.value === 'Deviation',
      },
      data: [
        {
          name: 'Average',
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
          name: 'Seasonal Deviation',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                {
                  offset: 0.49,
                  color: '#e21b1fa6',
                },
                {
                  offset: 0.5,
                  color: '#0072c4a6',
                },
              ],
            },
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
    series: seriesValuesData.value,
  };
});

// Ensure that the seasonality never gets deselected
const legendSelectChanged = (params: any) => {
  if (params.name === 'Average' && !params.selected['Average']) {
    const chartInstance = chartRef.value;
    chartInstance.setOption({
      legend: {
        selected: {
          Average: true,
        },
      },
    });
  }
};
</script>
<style lang="scss">
.seasonality-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .seasonality-selector {
    .seasonality-selector-option {
      width: 6.5rem;
      height: 1.7rem;
      font-size: 0.7rem;
      margin-left: 0.55rem;
      padding: 0;
      border: 0px solid transparent;
      border-radius: 0.3rem;
      color: #444;
      font-weight: 600;
      background-color: #f0f0f0;

      cursor: pointer;
      &:hover {
        background-color: $primary2;
        transition: background-color 0.3s ease;
      }
    }
  }
}
</style>
