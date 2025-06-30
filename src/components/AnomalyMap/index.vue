<template>
  <q-page>
    <ol-map
      ref="mapRef"
      class="absolute-full"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      @pointermove="hoverFeature"
      @click="selectFeature"
      :controls="[]"
    >
      <ol-view
        ref="viewRef"
        :center="center"
        :zoom="mapStore.zoom"
        :maxZoom="mapStore.maxZoom"
        :projection="mapStore.projection"
      />

      <ol-tile-layer :z-index="2">
        <ol-source-xyz
          :url="mapStore.basemapLayer.url"
          :preload="mapStore.basemapLayer.preload"
          :attributions-collapsible="mapStore.basemapLayer.attributionsCollapsible"
          :attributions="mapStore.basemapLayer.attributions"
        />
      </ol-tile-layer>

      <ol-vector-tile-layer ref="layerRef" class-name="feature-layer" z-index="3">
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
        :z-index="6"
        render-mode="vector"
        :source="sourceRef?.source"
      >
        <ol-style :overrideStyleFunction="hoveredStyleFn"></ol-style>
      </ol-vector-tile-layer>

      <ol-vector-tile-layer
        ref="selectedLayerRef"
        :z-index="7"
        render-mode="vector"
        :source="sourceRef?.source"
      >
        <ol-style :overrideStyleFunction="selectedStyleFn"></ol-style>
      </ol-vector-tile-layer>

      <ol-tile-layer :z-index="8">
        <ol-source-xyz
          :url="mapStore.labelsLayer.url"
          :preload="mapStore.labelsLayer.preload"
          :opaque="mapStore.labelsLayer.opaque"
        />
      </ol-tile-layer>

      <ol-zoom-control className="custom-zoom-control" v-if="!playbackStore.playbackEnabled" />
      <ol-scaleline-control
        className="custom-scaleline-control"
        v-if="!playbackStore.playbackEnabled"
      />
      <ol-attribution-control />
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
import { fromLonLat, transformExtent } from 'ol/proj';
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
import MVT from 'ol/format/MVT.js';
import WebGLVectorTileLayer from 'ol/layer/WebGLVectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import { regionsApi } from 'src/services/apiService';

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
    const [z, x, y] = tile.getTileCoord();
    const data = await mapStore.fetchData(
      mapStore.currentDate,
      x.toString(),
      y.toString(),
      z.toString(),
    );

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
 * Borders Autonomous Communities
 */
const loadAutonomousCommunitiesTiles = (tile: any, url: string) => {
  tile.setLoader((extent: number[] | undefined, resolution: number, projection: string) => {
    const [z, x, y] = tile.getTileCoord();
    regionsApi
      .autonomousCommunitiesTilesRetrieve(
        { x: x.toString(), y: y.toString(), z: z.toString() },
        { responseType: 'arraybuffer' }, // Ensure we get the data as an ArrayBuffer
      )
      .then(async (response) => {
        const format = tile.getFormat(); // ol/format/MVT configured as source format
        const features = format.readFeatures(response.data, {
          extent: extent,
          featureProjection: projection,
        });
        tile.setFeatures(features);
      });
  });
};
const autonomousCommunitiesSource = new VectorTileSource({
  format: mapStore.format as MVT,
  projection: mapStore.projection,
  url: 'http://dummy.url/{z}/{x}/{y}/', // We need a default URL
  tileLoadFunction: loadAutonomousCommunitiesTiles,
}) as any;
const autonomousCommunitiesLayer = new VectorTileLayer({
  className: 'autonomous-communities-layer',
  zIndex: 9,
  source: autonomousCommunitiesSource,
  style: new Style({
    stroke: new Stroke({
      color: '#aaa',
      width: 0.4,
    }),
  }),
});

/**
 * Playback
 */
const loadPlaybackTiles = (tile: any, url: string) => {
  tile.setLoader(async (extent: number[] | undefined, resolution: number, projection: string) => {
    const [z, x, y] = tile.getTileCoord();
    const data = await playbackStore.fetchData(
      mapStore.currentDate,
      x.toString(),
      y.toString(),
      z.toString(),
    );

    const format = tile.getFormat(); // ol/format/MVT configured as source format
    const features = format.readFeatures(data, {
      extent: extent,
      featureProjection: projection,
    });

    for (const feature of features) {
      const timeseries = JSON.parse(feature.get('timeseries'));
      timeseries.forEach((item: any) => {
        const dayKey = new Date(item.date).getTime();
        feature.properties_['anomaly_degree' + dayKey] = item.anomaly_degree;
        feature.properties_['value' + dayKey] = item.value;
      });
    }

    tile.setFeatures(features);
    mapStore.extent = extent || [];
  });
};
const playbackWebGLStyle = computed(() => {
  const timestampKey = new Date(playbackStore.playbackCurrentDate).getTime();

  return [
    {
      style: {
        'fill-color': mapStore.showActualValues
          ? [
              'interpolate',
              ['linear'],
              ['get', 'value' + timestampKey],
              0,
              'rgb(253, 247, 230)', // Start color: #fdf7e6
              1,
              'rgb(255, 121, 91)', // End color: #ff795b
            ]
          : [
              'case',
              ['>', ['get', 'anomaly_degree' + timestampKey], 0],
              ANOMALY_COLORS.HIGH,
              ['<', ['get', 'anomaly_degree' + timestampKey], 0],
              ANOMALY_COLORS.LOW,
              ANOMALY_COLORS.USUAL_LIGHT + '48', // default
            ],
        'fill-opacity': 1,
        'stroke-color': 'rgba(255, 255, 255, 0.3)',
        'stroke-width': 0.5,
      },
    },
  ];
});
const playbackSource = new VectorTileSource({
  format: mapStore.format as MVT,
  projection: mapStore.projection,
  tileLoadFunction: loadPlaybackTiles,
  // We need a deafult URL
  url: 'http://dummy.url/{z}/{x}/{y}/',
}) as any;
const playbackLayer = new WebGLVectorTileLayer({
  className: 'playback-layer',
  zIndex: 4,
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

  const spainExtent = [-9.5, 35.9, 3.3, 43.9];
  const spainExtent3857 = transformExtent(spainExtent, 'EPSG:4326', mapStore.projection);
  map.getView().fit(spainExtent3857, {
    size: map.getSize(),
    padding: [50, 50, 50, 50], // Padding around the feature
    duration: 200, // duration of the zoom animation in milliseconds
  });

  map.addOverlay(hoverOverlay);

  // Cursor pointer on feature hover
  map.on('pointermove', (evt: any) => {
    if (!evt.dragging) {
      map.getTargetElement().style.cursor = map.hasFeatureAtPixel(
        map.getEventPixel(evt.originalEvent),
      )
        ? 'pointer'
        : '';
    }
  });
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
const featureLayerFilter = (layerCandidate: Layer) => {
  const className = layerCandidate.getClassName?.() || '';
  return className.includes('feature-layer');
};

const selectFeature = async (event: MapBrowserEvent<PointerEvent>) => {
  const map = mapRef.value?.map;
  if (!map) {
    return;
  }

  // store selected feature
  const features = map.getFeaturesAtPixel(event.pixel, {
    hitTolerance: 0,
    layerFilter: featureLayerFilter,
  });
  if (!features.length) {
    mapStore.selectedFeatures = [];
    return;
  }
  // So only one feature is selected
  const firstFeature = features[0] as Feature;
  mapStore.selectedFeatures = [firstFeature];
  regionDetailedStore.selectRegionMetric(firstFeature.getId() as string);
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
    layerFilter: featureLayerFilter,
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
  tooltipEl.innerHTML = `
  <div><strong>${feature.get('region__name')}</strong></div>
  <div>(${feature.get('region__province__autonomous_community__name')})</div>
  <div>Bites Index: <i>${(feature.get('value') * 100).toFixed(1)}%</i></div>
  `;
  tooltipEl.classList.add('visible');
  hoverOverlay.setPosition(event.coordinate);
};

// Zoom to selectedFeature
watchEffect(() => {
  if (regionDetailedStore.isRegionSelected && selectedFeatures.value.length > 0) {
    const feature = selectedFeatures.value[0] as FeatureLike;
    const geometry = feature.getGeometry() as Geometry;
    viewRef.value.view.fit(geometry.getExtent(), {
      padding: [350, 350, 350, 350], //Padding around the feature
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
      // Set the source to the hover and selected layers
      layerRef.value?.vectorTileLayer.setZIndex(1);
      map.addLayer(playbackLayer);
      map.addLayer(playbackInteractionLayer);
      hoverLayerRef.value?.vectorTileLayer.setSource(playbackSource);
    } else {
      // Remove the playback layer and add the normal layer
      layerRef.value?.vectorTileLayer.setZIndex(3);
      map.removeLayer(playbackLayer);
      map.removeLayer(playbackInteractionLayer);
      if (layerRef.value) {
        hoverLayerRef.value?.vectorTileLayer.setSource(layerRef.value.vectorTileLayer.getSource());
      }
    }
  },
);
watch(
  () => mapStore.showAutonomousCommunities,
  (showAutonomousCommunities) => {
    const map = mapRef.value?.map;
    if (!map) {
      return;
    }
    if (showAutonomousCommunities) {
      map.addLayer(autonomousCommunitiesLayer);
    } else {
      map.removeLayer(autonomousCommunitiesLayer);
    }
  },
);
watch(
  () => mapStore.showActualValues,
  (showActualValues) => {
    const map = mapRef.value?.map;
    if (!map) {
      return;
    }
    layerRef.value?.vectorTileLayer.setStyle(styleFn as any);
  },
);

/**
 * Styles
 */
const styleFn = (feature: Feature) => {
  const showValues = mapStore.showActualValues;
  let anomalyDegree = feature.get('anomaly_degree');
  let value = feature.get('value');

  return showValues ? generateValueStyle(value) : generateAnomalyStyle(anomalyDegree);
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
const generateAnomalyStyle = (anomalyDegree: number) => {
  let fillColor = ANOMALY_COLORS.USUAL_LIGHT + '48'; // default

  if (anomalyDegree > 0) {
    fillColor = ANOMALY_COLORS.HIGH;
  } else if (anomalyDegree < 0) {
    fillColor = ANOMALY_COLORS.LOW;
  }

  return new Style({
    fill: new Fill({ color: fillColor }),
  });
};

const generateValueStyle = (value: number) => {
  const startColor = { r: 253, g: 247, b: 230 }; // #fdf7e6
  const endColor = { r: 255, g: 121, b: 91 }; // #ff795b

  const r = Math.round(startColor.r + (endColor.r - startColor.r) * value);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * value);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * value);

  return new Style({
    fill: new Fill({ color: `rgb(${r}, ${g}, ${b})` }),
  });
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
.custom-zoom-control {
  top: auto !important;
  bottom: 5em !important;
  left: 20px !important;
  right: auto !important;

  background-color: var(--ol-subtle-background-color);
  border-radius: 4px;

  button {
    width: 1.75em !important;
    height: 1.75em !important;
    border-radius: 2px 2px 0 0;
    display: block;
    margin: 1px;
    padding: 0;
    color: var(--ol-subtle-foreground-color);
    font-weight: bold;
    text-decoration: none;
    font-size: inherit;
    text-align: center;
    line-height: 0.4em;
    background-color: var(--ol-background-color);
  }
}
.custom-scaleline-control {
  top: auto !important;
  bottom: 2em !important;
  left: 20px !important;
  right: auto !important;

  background: var(--ol-partial-background-color);
  border-radius: 4px;
  padding: 2px;
  position: absolute;

  > div {
    border: 1px solid var(--ol-subtle-foreground-color);
    border-top: none;
    color: var(--ol-foreground-color);
    font-size: 10px;
    text-align: center;
    margin: 1px;
    will-change: contents, width;
    transition: all 0.25s;
  }
}
</style>
