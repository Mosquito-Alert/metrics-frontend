<template>
  <!-- TODO: AUTO FOCUS -->
  <q-select
    v-model="regionSelected"
    clearable
    autofocus
    use-input
    hide-selected
    fill-input
    input-debounce="250"
    label="Search by municipality"
    :options="suggestions"
    @filter="searchFilterFn"
    @filter-abort="abortFilterFn"
    @keyup.enter="onEnterPress"
    hide-dropdown-icon
    :style="searchbarStyle"
    class="q-ma-none q-py-none q-px-lg"
    bg-color="white"
    color="primary"
    label-color="black"
    standout="primary"
    outlined
    dense
  >
    <template v-slot:prepend>
      <q-icon color="black" name="place" />
    </template>
    <template v-slot:append>
      <q-icon
        color="black"
        v-if="!regionSelected"
        name="search"
        @click="selectFirstSuggestion"
        class="cursor-pointer"
      />
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { Metric } from 'anomaly-detection';
import { metricsApi, regionsApi } from 'src/services/apiService';
import { useUIStore } from 'src/stores/uiStore';
import { computed, ref, watch } from 'vue';
import { useRegionDetailedStore } from '../../stores/regionDetailedStore';

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();

const suggestions = ref<{ label: string; value: string; id: number }[]>([]);
const regionSelected = ref<{ label: string; value: string; id: number } | null>(null);

const fetchSuggestions = async (val: string) => {
  if (val.length < 2) return;

  try {
    const response = await regionsApi.list({
      regionName: val,
      pageSize: 5,
      ordering: 'name',
    });
    if (response.status === 200 && response.data.results) {
      suggestions.value = response.data.results.map((region: any) => ({
        label: `${region.name}, ${region.province}`,
        value: region.code,
        id: region.id,
      }));
    } else {
      suggestions.value = [];
    }
  } catch (error) {
    console.error('Error fetching regions:', error);
    suggestions.value = [];
  }
};
const searchFilterFn = async (val: string, update: any, abort: any) => {
  if (val.length < 3) {
    abort();
    return;
  }
  update(() => fetchSuggestions(val));
};
const selectFirstSuggestion = () => {
  if (suggestions.value.length > 0) {
    regionSelected.value = suggestions.value[0] as { label: string; value: string; id: number };
  }
};
const onEnterPress = async (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement;
  const inputValue = target?.value?.trim() ?? '';
  if (inputValue.length < 3) return;

  await fetchSuggestions(inputValue);

  selectFirstSuggestion();
};

const abortFilterFn = () => {
  suggestions.value = [];
};

const fetchMetricFromRegion = async (regionCode: string): Promise<Metric | null> => {
  if (!regionCode) return null;
  try {
    const response = await metricsApi.list({
      dateFrom: uiStore.date,
      dateTo: uiStore.date,
      regionCode,
    });
    if (response.status === 200 && response.data.results.length > 0) {
      const metric = response.data.results[0] as Metric;
      //   mapStore.selectedRegionMetricId = metric ? metric.id : '';
      return metric;
    } else {
      throw new Error('No metrics found for the selected region');
    }
  } catch (error) {
    console.error('Error fetching metric for region:', error);
    return null;
  }
};

watch(
  regionSelected,
  async (newValue) => {
    if (newValue && newValue.value) {
      const metric = await fetchMetricFromRegion(newValue.value);
      if (regionSelected.value && metric) {
        // Set the selected metric ID in the map store
        regionDetailedStore.selectRegionMetric(metric.id);
        await regionDetailedStore.fetchSelectedRegion(regionSelected.value.id, metric.id);
        regionSelected.value = null; // Reset the selection after setting
        suggestions.value = []; // Clear suggestions after selection
      }
    }
  },
  { immediate: true },
);

const width = computed(() => uiStore.regionDetailDrawerWidth);

const searchbarStyle = computed(() => {
  return {
    width: `${width.value * 0.7}px`,
  };
});
</script>
<style lang="sass"></style>
