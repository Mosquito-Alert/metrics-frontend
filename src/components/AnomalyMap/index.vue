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
          :url="mapStore.basemapLayer.url"
          :preload="mapStore.basemapLayer.preload"
          :attributions-collapsible="mapStore.basemapLayer.attributionsCollapsible"
          :attributions="mapStore.basemapLayer.attributions"
        />
      </ol-tile-layer>

      <ol-vector-tile-layer
        v-if="!playbackStore.playbackEnabled"
        ref="layerRef"
        class-name="feature-layer"
      >
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
          :url="mapStore.labelsLayer.url"
          :preload="mapStore.labelsLayer.preload"
          :opaque="mapStore.labelsLayer.opaque"
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
import { useMapStore } from 'src/stores/mapStore';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue';
import { useRegionDetailedStore } from '../../stores/regionDetailedStore';
import { usePlaybackStore } from 'src/stores/playbackStore';
import { useUIStore } from 'src/stores/uiStore';
import MVT from 'ol/format/MVT.js';
import WebGLVectorTileLayer from 'ol/layer/WebGLVectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';

const uiStore = useUIStore();
const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();
const playbackStore = usePlaybackStore();

const hoveredFeatures = ref([] as FeatureLike[]);
const selectedFeatures = computed(() => mapStore.selectedFeatures);

const mapRef = ref<{ map: MapRef } | null>(null);
const viewRef = ref();
const sourceRef = ref();
const layerRef = ref<{ vectorTileLayer: VectorTileLayer } | null>(null);
const hoverLayerRef = ref<{ vectorTileLayer: VectorTileLayer } | null>(null);
const selectedLayerRef = ref<{ vectorTileLayer: VectorTileLayer } | null>(null);

const $q = useQuasar();
/**
 * Base config
 */
const center = computed(() => fromLonLat(mapStore.center, mapStore.projection));

// * Map layers
const format = inject('ol-format');
mapStore.format = new format.MVT({ idProperty: 'id' }); // Store the format in the mapStore for later use

const anomalyLayer = computed(() => {
  return {
    // We need a deafult URL
    url: `http://dummy.url/{z}/{x}/{y}/`,
    format: mapStore.format,
  };
});

const loadTiles = (tile: any, url: string) => {
  tile.setLoader(async (extent: number[] | undefined, resolution: number, projection: string) => {
    const tileCoord = tile.getTileCoord();
    const z = tileCoord[0].toString();
    const x = tileCoord[1].toString();
    const y = tileCoord[2].toString();
    const data = await mapStore.fetchData(uiStore.date, x, y, z);

    const format = tile.getFormat(); // ol/format/MVT configured as source format
    const features = format.readFeatures(data, {
      extent: extent,
      featureProjection: projection,
    });
    tile.setFeatures(features);
    mapStore.extent = extent || [];
  });
};

const handleSourceTileLoadStart = () => {
  $q.loading.show({ message: 'Loading data...' });
};
const handleSourceTileLoadEnd = () => {
  $q.loading.hide();
};

/**
 * Playback
 */
const loadPlaybackTiles = (tile: any, url: string) => {
  tile.setLoader(async (extent: number[] | undefined, resolution: number, projection: string) => {
    const tileCoord = tile.getTileCoord();
    const z = tileCoord[0].toString();
    const x = tileCoord[1].toString();
    const y = tileCoord[2].toString();
    const data = await playbackStore.fetchData(uiStore.date, x, y, z);

    const format = tile.getFormat(); // ol/format/MVT configured as source format
    const features = format.readFeatures(data, {
      extent: extent,
      featureProjection: projection,
    });

    for (const feature of features) {
      const timeseries = JSON.parse(feature.get('timeseries'));
      timeseries.forEach((item: any) => {
        // const dayKey = `day-${item.date}`;
        const dayKey = new Date(item.date).getTime();
        feature.properties_[dayKey] = item.anomaly_degree;
      });
    }

    tile.setFeatures(features);
    mapStore.extent = extent || [];
  });
};
const playbackWebGLStyle = computed(() => [
  {
    style: {
      'fill-color': [
        'case',
        ['>', ['get', new Date(playbackStore.playbackCurrentDate).getTime()], 0],
        ANOMALY_COLORS.HIGH,
        ['<', ['get', new Date(playbackStore.playbackCurrentDate).getTime()], 0],
        ANOMALY_COLORS.LOW,
        ANOMALY_COLORS.USUAL_LIGHT + '48', // with alpha 0.7
      ],
      'fill-opacity': 1,
      'stroke-color': 'rgba(255, 255, 255, 0.3)',
      'stroke-width': 0.5,
    },
  },
]);
const playbackSource = new VectorTileSource({
  format: mapStore.format as MVT,
  projection: mapStore.projection,
  tileLoadFunction: loadPlaybackTiles,
  // We need a deafult URL
  url: 'http://dummy.url/{z}/{x}/{y}/',
}) as any;
const playbackLayer = new WebGLVectorTileLayer({
  className: 'playback-layer',
  zIndex: 8,
  source: playbackSource,
  style: playbackWebGLStyle.value,
});
const playbackInteractionLayer = new VectorTileLayer({
  className: 'playback-interaction-layer',
  source: playbackSource,
  visible: true, // invisible but still interactive
  style: new Style({
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)', // transparent fill
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0)', // transparent stroke
      width: 0,
    }),
  }),
});

watch(playbackWebGLStyle, (newVariables) => {
  playbackLayer.setStyle(newVariables);
});

/**
 * Vue lyfecycle hooks
 */
onMounted(() => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }

  map.addOverlay(hoverOverlay);
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

onBeforeUnmount(() => {
  // See: https://github.com/openlayers/openlayers/blob/29c58d08fb8ddc22b4b7384b38851323359c5706/src/ol/layer/WebGLPoints.js#L58-L59
  // See: https://stackoverflow.com/questions/69295838/how-to-properly-release-webgl-resources-of-removed-layers-in-openlayers
  playbackLayer.dispose();
});

/**
 * Select and hover features
 */
const layerFilter = (layerCandidate: Layer) => {
  const className = layerCandidate.getClassName?.() || '';
  return className.includes(
    playbackStore.playbackEnabled ? 'playback-interaction-layer' : 'feature-layer',
  );
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
  // if (playbackStore.playbackEnabled) {
  //   const timeseries = JSON.parse(feature.get('timeseries'));
  //   const hoveredFeature = timeseries.find(
  //     (item: any) => item.date === playbackStore.playbackCurrentDate,
  //   );
  //   if (!hoveredFeature) return;
  //   // (feature as any).properties_.value = hoveredFeature.value;
  // }
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
// Switch between normal and playback layers
watch(
  () => playbackStore.playbackEnabled,
  (playbackEnabled) => {
    const map = mapRef.value?.map;
    if (!map) {
      return;
    }

    if (playbackEnabled) {
      // Remove the normal layer and add the playback layer
      if (layerRef.value) {
        // map.removeLayer(layerRef.value);
        layerRef.value.vectorTileLayer.setVisible(false);
      }
      // Set the source to the hover and selected layers
      map.addLayer(playbackLayer);
      map.addLayer(playbackInteractionLayer);
      hoverLayerRef.value?.vectorTileLayer.setSource(playbackSource);
      selectedLayerRef.value?.vectorTileLayer.setSource(playbackSource);
    } else {
      // Remove the playback layer and add the normal layer
      map.removeLayer(playbackLayer);
      map.removeLayer(playbackInteractionLayer);
      if (layerRef.value) {
        layerRef.value.vectorTileLayer.setVisible(true);
        hoverLayerRef.value?.vectorTileLayer.setSource(layerRef.value.vectorTileLayer.getSource());
        selectedLayerRef.value?.vectorTileLayer.setSource(
          layerRef.value.vectorTileLayer.getSource(),
        );
      }
    }
  },
);

/**
 * Styles
 */
const styleFn = (feature: Feature) => {
  if (playbackStore.playbackEnabled) {
    const timeseries = JSON.parse(feature.get('timeseries'));
    return styleProperties(
      timeseries.find((item: any) => item.date === playbackStore.playbackCurrentDate)
        ?.anomaly_degree || 0,
    );
  }
  return styleProperties(feature.get('anomaly_degree'));
};

const styleProperties = (anomaly_degree: number) => {
  // TODO: Add a gradient to the fill color based on the anomaly degree
  let fillColor;
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
  if (playbackStore.playbackEnabled) {
    const timeseries = JSON.parse(feature.get('timeseries'));
    const hoveredFeature = timeseries.find(
      (item: any) => item.date === playbackStore.playbackCurrentDate,
    );
    if (!hoveredFeature) return;
    feature.id_ = hoveredFeature.id; // Set the id directly
    feature.properties_.anomaly_degree = hoveredFeature.anomaly_degree;
  }
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
  if (playbackStore.playbackEnabled) {
    const timeseries = JSON.parse(feature.get('timeseries'));
    const hoveredFeature = timeseries.find(
      (item: any) => item.date === playbackStore.playbackCurrentDate,
    );
    if (!hoveredFeature) return;
    feature.id_ = hoveredFeature.id; // Set the id directly
    feature.properties_.anomaly_degree = hoveredFeature.anomaly_degree;
  }
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
