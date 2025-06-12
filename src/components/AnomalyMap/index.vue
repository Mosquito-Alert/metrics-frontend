<template>
  <q-page>
    <ol-map
      ref="mapRef"
      class="absolute-full"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      @pointermove="hoverFeature"
      @click="selectFeature"
    >
      <ol-view
        ref="viewRef"
        :center="center"
        :zoom="mapStore.zoom"
        :maxZoom="mapStore.maxZoom"
        :projection="mapStore.projection"
      />

      <ol-tile-layer>
        <ol-source-xyz
          :url="basemapLayer.url"
          :preload="basemapLayer.preload"
          :attributions-collapsible="basemapLayer.attributionsCollapsible"
          :attributions="basemapLayer.attributions"
        />
      </ol-tile-layer>

      <ol-vector-tile-layer ref="layerRef" class-name="feature-layer">
        <ol-source-vector-tile
          ref="sourceRef"
          :format="anomalyLayer.format"
          :projection="mapStore.projection"
          :tileLoadFunction="loadTiles"
          :url="anomalyLayer.url"
          @tileloadstart="handleSourceTileLoadStart"
          @tileloadend="handleSourceTileLoadEnd"
        />
        <ol-style :overrideStyleFunction="styleFn"></ol-style>
      </ol-vector-tile-layer>

      <ol-vector-tile-layer
        ref="hoverLayerRef"
        :z-index="9"
        render-mode="vector"
        :source="sourceRef?.source"
      >
        <ol-style :overrideStyleFunction="hoveredStyleFn"></ol-style>
      </ol-vector-tile-layer>

      <ol-vector-tile-layer
        ref="selectedLayerRef"
        :z-index="10"
        render-mode="vector"
        :source="sourceRef?.source"
      >
        <ol-style :overrideStyleFunction="selectedStyleFn"></ol-style>
      </ol-vector-tile-layer>

      <ol-tile-layer :z-index="15">
        <ol-source-xyz
          :url="labelsLayer.url"
          :preload="labelsLayer.preload"
          :opaque="labelsLayer.opaque"
        />
      </ol-tile-layer>

      <ol-zoom-control />
      <ol-scaleline-control />
    </ol-map>
  </q-page>
</template>

<script setup lang="ts">
import { Feature, MapBrowserEvent, Overlay } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { Layer } from 'ol/layer';
import VectorTileLayer from 'ol/layer/VectorTile';
import type MapRef from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { Fill, Stroke, Style } from 'ol/style';
import { getCssVar, useQuasar } from 'quasar';
import { ANOMALY_COLORS } from 'src/constants/colors';
import { metricsApi } from 'src/services/apiService';
import { useMapStore } from 'src/stores/mapStore';
import { computed, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { useRegionDetailedStore } from '../../stores/regionDetailedStore';

const props = defineProps({
  date: {
    type: String,
    required: true,
  },
});
const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();

const hoveredFeatures = ref([] as FeatureLike[]);
const selectedFeatures = computed(() => mapStore.selectedFeatures);

const mapRef = ref<{ map: MapRef } | null>(null);
const viewRef = ref();
const sourceRef = ref();
const layerRef = ref(null);
const hoverLayerRef = ref<{ vectorTileLayer: VectorTileLayer } | null>(null);
const selectedLayerRef = ref<{ vectorTileLayer: VectorTileLayer } | null>(null);

const $q = useQuasar();

/**
 * Base config
 */
const center = computed(() => fromLonLat(mapStore.center, mapStore.projection));

// * Map layers
const basemapLayer = ref({
  url: 'https://basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
  attributions:
    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap </a> contributors, © <a href='https://carto.com/about-carto'>Carto</a>",
  attributionsCollapsible: false,
  preload: Infinity,
});
const labelsLayer = ref({
  url: 'https://basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png',
  preload: Infinity,
  opaque: false,
});
const format = inject('ol-format');
mapStore.format = new format.MVT({ idProperty: 'id' }); // Store the format in the mapStore for later use

const anomalyLayer = computed(() => {
  return {
    // We need a deafult URL
    url: `https://localhost:8000/api/v1/metrics/tiles/{z}/{x}/{y}/?date=${props.date}`,
    format: mapStore.format,
  };
});

const loadTiles = (tile: any, url: string) => {
  tile.setLoader((extent: number[] | undefined, resolution: number, projection: string) => {
    const tileCoord = tile.getTileCoord();
    const z = tileCoord[0];
    const x = tileCoord[1];
    const y = tileCoord[2];
    metricsApi
      .tilesRetrieve(
        {
          date: props.date,
          x: x.toString(),
          y: y.toString(),
          z: z.toString(),
        },
        { responseType: 'arraybuffer' }, // Ensure we get the data as an ArrayBuffer
      )
      .then(async (response) => {
        const format = tile.getFormat(); // ol/format/MVT configured as source format
        const features = format.readFeatures(response.data, {
          extent: extent,
          featureProjection: projection,
        });
        tile.setFeatures(features);
        mapStore.extent = extent || [];
      });
  });
};

const handleSourceTileLoadStart = () => {
  $q.loading.show({ message: 'Loading data...' });
};
const handleSourceTileLoadEnd = () => {
  $q.loading.hide();
};

onMounted(() => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }

  map.addOverlay(hoverOverlay);
  if (!layerRef) {
    return;
  }
});

onUnmounted(() => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }
  map.removeOverlay(hoverOverlay);

  // .clear();
  mapStore.selectedFeatures = [];
});

/**
 * Select and hover features
 */
const layerFilter = (layerCandidate: Layer) => {
  return layerCandidate.getClassName().includes('feature-layer');
};

const selectFeature = async (event: MapBrowserEvent<PointerEvent>) => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }

  // store selected feature
  const features = map.getFeaturesAtPixel(event.pixel, {
    hitTolerance: 0,
    layerFilter,
  });
  if (!features.length) {
    return;
  }
  // So only one feature is selected
  const firstFeature = features[0] as Feature;
  mapStore.selectedFeatures = [firstFeature];
  regionDetailedStore.selectedRegionMetricId = firstFeature.getId() as string;
};

const tooltipEl = document.createElement('div');
tooltipEl.className = 'custom-tooltip';
const hoverOverlay = new Overlay({
  element: tooltipEl,
  offset: [-15, -5],
  positioning: 'bottom-left',
});

const hoverFeature = async (event: MapBrowserEvent<PointerEvent>) => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }

  // store hovered feature
  const features = map.getFeaturesAtPixel(event.pixel, {
    hitTolerance: 0,
    layerFilter,
  });
  if (!features.length) {
    hoveredFeatures.value = [];
    // hoverTooltip.removeFeature();
    tooltipEl.classList.remove('visible');
    hoverOverlay.setPosition(undefined); // hide
    return;
  }
  hoveredFeatures.value = features as Feature[];

  const feature = features[0] as FeatureLike;
  tooltipEl.innerHTML = feature.get('region__name');
  tooltipEl.classList.add('visible');
  hoverOverlay.setPosition(event.coordinate);
};

// Zoom to selectedFeature
watchEffect(() => {
  if (regionDetailedStore.isRegionSelected && selectedFeatures.value.length > 0) {
    const feature = selectedFeatures.value[0] as FeatureLike;
    const geometry = feature.getGeometry() as Geometry;
    viewRef.value.view.fit(geometry.getExtent(), {
      padding: [250, 250, 250, 250], //Padding around the feature
      duration: 600, // duration of the zoom animation in milliseconds
    });
  } else if (viewRef.value && !regionDetailedStore.isRegionSelected) {
    viewRef.value.view.animate({
      center: center.value,
      zoom: mapStore.zoom,
      duration: 600, // duration of the zoom animation in milliseconds
    });
  }
});

watch(hoveredFeatures, () => {
  hoverLayerRef.value?.vectorTileLayer.changed();
});
watch(selectedFeatures, () => {
  selectedLayerRef.value?.vectorTileLayer.changed();
});

/**
 * Styles
 */
const styleFn = (feature: Feature) => {
  // TODO: Add a gradient to the fill color based on the anomaly degree
  let fillColor;
  const anomaly_degree = feature.get('anomaly_degree');
  if (anomaly_degree && anomaly_degree !== 0) {
    fillColor = anomaly_degree > 0 ? ANOMALY_COLORS.HIGH : ANOMALY_COLORS.LOW;
  } else {
    fillColor = ANOMALY_COLORS.USUAL_LIGHT + '48'; // with alpha 0.7
  }

  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
  });
};

const selectedStyleFn = (feature: any) => {
  const selectedFeaturesIds = selectedFeatures.value.map((f) => f.getId());
  if (!selectedFeaturesIds.includes(feature.getId())) return;

  const style = styleFn(feature);
  style.setStroke(
    new Stroke({
      color: getCssVar('accent') || '#FF0000',
      width: 4,
    }),
  );
  return style;
};

const hoveredStyleFn = (feature: any) => {
  const hoveredFeaturesIds = hoveredFeatures.value.map((f) => f.getId());
  if (!hoveredFeaturesIds.includes(feature.getId())) return;
  const style = styleFn(feature);

  style.setStroke(
    new Stroke({
      color: getCssVar('accent') || '#FF0000',
      width: 2,
    }),
  );
  return style;
};
</script>
<style lang="scss">
#map-date {
  background-color: #f3c954;
  color: #444;
  border-radius: 4px;
  border: 1px solid #edb20c;
}
.custom-tooltip {
  position: relative; /* Needed for the arrow positioning */
  background-color: rgba(0, 0, 0, 0.75); /* dark with transparency */
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 0.85rem;
  white-space: nowrap;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  opacity: 0;
  transform: scale(0.95);
}

.custom-tooltip.visible {
  opacity: 1;
  transform: scale(1);
}

/* Add a triangle pointer */
.custom-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px; /* position below the tooltip */
  left: 10px; /* adjust to align with cursor or center */
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, 0.75); /* same as tooltip background */
}
</style>
