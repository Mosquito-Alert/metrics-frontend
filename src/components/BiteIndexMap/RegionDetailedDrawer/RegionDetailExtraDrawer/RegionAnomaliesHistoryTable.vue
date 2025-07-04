<template>
  <h6 class="q-my-md q-ml-sm text-weight-regular" style="color: #333">Last month history</h6>
  <q-table
    flat
    :rows="data"
    :columns="columns"
    :loading="loading"
    v-model:pagination="pagination"
    :rows-per-page-options="[5, 10, 25, 50]"
    @request="onRequest"
    :hide-bottom="data.length > 0"
    :table-row-class-fn="rowClassFn"
  >
    <template v-slot:loading>
      <q-inner-loading showing color="primary" />
    </template>

    <template v-slot:body-cell-anomaly="props">
      <q-td :props="props">
        <div>
          <q-badge :color="anomalyClassificationStyle(props.value)" :label="props.value" />
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Metric, PaginatedMetricList } from 'anomaly-detection';
import { date, QTableProps } from 'quasar';
import { anomalyClassificationStyle, classifyAnomaly } from 'src/utils/anomalyClassification';
import { historyPageSize } from 'src/constants/config';
import { useRegionDetailedStore } from '../../../../stores/regionDetailedStore';
import { useUIStore } from 'src/stores/uiStore';
import { formattedDate } from 'src/utils/date';

const columns: QTableProps['columns'] = [
  {
    name: 'date',
    field: 'date',
    required: true,
    label: 'Date',
    align: 'left',
    format: (val: string, row: any): string => date.formatDate(new Date(val), 'DD-MM-YYYY'),
  },
  {
    name: 'anomaly',
    field: 'anomaly_degree',
    required: true,
    align: 'center',
    label: 'Anomaly',
    format: (val: number, row: any): string => classifyAnomaly(val),
  },
  {
    name: 'value',
    field: 'value',
    required: true,
    label: 'Bite Index (%)',
    format: (val: number, row: any): string => (val ? `${(val * 100).toFixed(2)}%` : 'N/A'),
    align: 'center',
  },
  {
    name: 'lowerValue',
    field: 'lower_value',
    required: true,
    label: 'Lower bound (%)',
    format: (val: number, row: any): string => (val ? `${(val * 100).toFixed(2)}%` : 'N/A'),
    align: 'center',
  },
  {
    name: 'upperValue',
    field: 'upper_value',
    required: true,
    label: 'Upper bound (%)',
    format: (val: number, row: any): string => (val ? `${(val * 100).toFixed(2)}%` : 'N/A'),
    align: 'center',
  },
];

const uiStore = useUIStore();
const regionDetailedStore = useRegionDetailedStore();

const loading = computed(() => regionDetailedStore.fetchingRegionMetricsHistory);
const history = computed<PaginatedMetricList>(
  () => regionDetailedStore.selectedRegionMetricsHistory as PaginatedMetricList,
);
const data = computed<Array<Metric>>(() => {
  if (!history.value || !history.value.results) {
    return [];
  }
  return history.value.results;
});

const pagination = ref({
  rowsPerPage: historyPageSize,
  rowsNumber: history.value?.count || 0,
  page: 1,
  sortBy: 'date',
  descending: true,
});

watch(
  () => history.value,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      pagination.value.rowsNumber = newValue?.count || 0;
    }
  },
  { immediate: true },
);

const onRequest = async (props: any) => {
  const { page, rowsPerPage } = props.pagination;

  const returnedData = await regionDetailedStore.fetchSelectedMetricHistory({
    page: page,
    pageSize: rowsPerPage,
  });

  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;

  return returnedData;
};

const rowClassFn = (row: Metric) =>
  formattedDate(row.date) === uiStore.formattedDate ? 'cell-highlight' : '';
</script>

<style lang="scss">
.cell-highlight {
  background-color: #fdf7e6 !important; /* Light blue background for the highlighted cell */
  font-weight: 600;
}
</style>
