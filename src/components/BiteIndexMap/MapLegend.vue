<template>
  <q-card>
    <q-card-section v-if="mapStore.showAnomalies || regionDetailedStore.lastRegionMetricId">
      <div class="text-subtitle2 text-weight-bold text-uppercase q-ma-none q-pa-none q-mb-md">
        Bite Probability Anomalies
      </div>
      <div>
        <div class="legend-item">
          <span class="legend-color anomaly-high"></span>
          <span class="legend-text text-weight-light text-uppercase">Over-expected</span>
        </div>
        <div class="legend-item">
          <span class="legend-color anomaly-low"></span>
          <span class="legend-text text-weight-light text-uppercase">Under-expected</span>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle2 text-weight-medium text-uppercase q-ma-none q-pa-none q-mb-md">
        Bites Probability Values
      </div>
      <div>
        <div class="legend-item legend-gradient">
          <span class="label-left">0%</span>
          <div
            class="gradient-box"
            :style="{
              background: `linear-gradient(to right, ${gradientStops(mapStore.layerStyle)})`,
            }"
          ></div>
          <span class="label-right">100%</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { gradientStops } from 'src/constants/colors';
import { useMapStore } from 'src/stores/mapStore';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';

const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();
</script>
<style lang="scss">
.q-card {
  background-color: #f0f0f0;
  color: #444;
  border-radius: 4px;
  border: 1px solid #888;
  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .legend-color {
      width: 25px;
      height: 20px;
      // border-radius: 50%;
      margin-right: 10px;
    }

    .anomaly-low {
      background-color: #85b0d5be; // Green
    }

    .anomaly-high {
      background-color: #ff795b; // Red
    }

    .legend-text {
      font-size: 0.8rem;
      color: #333;
    }
  }

  .legend-gradient {
    display: flex;
    align-items: center;
    gap: 8px; /* space between labels and box */
    font-size: 14px;
  }

  .gradient-box {
    width: 150px;
    height: 20px;
    border: 1px solid #aaa;
    border-radius: 3px;
  }
}
</style>
