<template>
  <q-page>
    <ol-map
      ref="mapRef"
      class="absolute-full"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      @click="selectFeature"
      @pointermove="hoverFeature"
      @rendercomplete="playbackStore.renderCompleted = true"
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

      <ol-tile-layer :z-index="7" :visible="mapStore.showLabels">
        <ol-source-xyz
          :url="mapStore.labelsLayer.url"
          :preload="mapStore.labelsLayer.preload"
          :opaque="mapStore.labelsLayer.opaque"
        />
      </ol-tile-layer>

      <ol-attribution-control
        className="custom-attributions-control ol-attribution ol-unselectable ol-control ol-uncollapsible"
      />
    </ol-map>
  </q-page>
</template>

<script setup lang="ts">
import { Feature, MapBrowserEvent, Overlay } from 'ol';
import { Control } from 'ol/control';
import { FeatureLike } from 'ol/Feature';
import MVT from 'ol/format/MVT.js';
import { Geometry } from 'ol/geom';
import { Layer } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import type MapRef from 'ol/Map';
import { fromLonLat, transformExtent } from 'ol/proj';
import { TileWMS } from 'ol/source';
import VectorTileSource from 'ol/source/VectorTile.js';
import { Fill, Stroke, Style } from 'ol/style';
import { getCssVar, useQuasar } from 'quasar';
import { LayerStyleEnum, LayerStyleNames } from 'src/constants/colors';
import { regionsApi } from 'src/services/apiService';
import { useMapStore } from 'src/stores/mapStore';
import { usePlaybackStore } from 'src/stores/playbackStore';
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';
import { computed, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';

const mapStore = useMapStore();
const regionDetailedStore = useRegionDetailedStore();
const playbackStore = usePlaybackStore();

const hoveredFeatures = ref([] as FeatureLike[]);
const selectedFeatures = computed(() => mapStore.selectedFeatures);

const mapRef = ref<{ map: MapRef } | null>(null);
const viewRef = ref();

const $q = useQuasar();
/**
 * Base config
 */
const center = computed(() => fromLonLat(mapStore.center, mapStore.projection));
const logoElement = document.createElement('div');
logoElement.className = 'watermark ol-unselectable ol-control';
logoElement.innerHTML = `
    <img src="/src/assets/logo_horizontal_black.png" alt="Mosquito Alert Logo"   />
`;
const watermarkControl = new Control({
  element: logoElement,
});

/**
 * Feature Layer (and hover layer)
 */
const format = inject('ol-format');
mapStore.format = new format.MVT({ idProperty: 'id' }); // Store the format in the mapStore for later use

const loadTiles = (tile: any, url: string) => {
  tile.setLoader(async (extent: number[] | undefined, resolution: number, projection: string) => {
    const [z, x, y] = tile.getTileCoord();
    const data = await mapStore.fetchData(
      mapStore.lastDate,
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
const styleFn = (feature: Feature) => {
  const selectedFeaturesIds = selectedFeatures.value.map((f) => f.getId());
  const hoveredFeaturesIds = hoveredFeatures.value.map((f) => f.getId());
  let width = 2;
  if (selectedFeaturesIds.includes(feature.getId())) {
    width = 4;
  } else if (hoveredFeaturesIds.includes(feature.getId())) {
    width = 2;
  } else {
    return new Style({
      fill: new Fill({
        // We need to fill the feature with a transparent color because otherwise the feature won't be clickable
        color: 'rgba(255, 255, 255, 0)',
      }),
    });
  }
  return new Style({
    stroke: new Stroke({
      color: getCssVar('accent') || '#FF0000',
      width,
    }),
  });
};
const featureSource = new VectorTileSource({
  format: mapStore.format as MVT,
  projection: mapStore.projection,
  url: 'http://dummy.url/{z}/{x}/{y}/', // We need a default URL
  tileLoadFunction: loadTiles,
}) as any;
const featureLayer = new VectorTileLayer({
  className: 'feature-layer',
  zIndex: 4,
  source: featureSource,
  style: styleFn as any, // Use the style function defined below
});
const hoverLayer = new VectorTileLayer({
  className: 'hover-layer',
  zIndex: 5,
  source: featureSource,
  style: styleFn as any, // Use the same style function for hover
});
featureSource.on('tileloadstart', handleSourceTileLoadStart);
featureSource.on('tileloadend', handleSourceTileLoadEnd);

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
  zIndex: 6,
  source: autonomousCommunitiesSource,
  style: new Style({
    stroke: new Stroke({
      color: '#aaa',
      width: 0.4,
    }),
  }),
});
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

/**
 * WMS Layers (Metric Value and Anomaly)
 */
const getWmsSource = (styleName: string) =>
  new TileWMS({
    // crossOrigin: 'anonymous',
    projection: mapStore.projection,
    url: process.env.GEOSERVER_URL,
    params: {
      LAYERS: `mosquitoalert:${styleName}`,
      SRS: mapStore.projection,
      viewparams: 'date:' + mapStore.lastDate,
    },
  });
const valueSource = getWmsSource('metric');
const valueLayer = new TileLayer({
  className: 'wms-layer',
  zIndex: 3,
  source: valueSource,
});
const anomalySource = getWmsSource('metric-anomaly');
const anomalyLayer = new TileLayer({
  className: 'anomaly-layer',
  zIndex: 4,
  source: anomalySource,
  visible: mapStore.showAnomalies,
});
watch(
  () => playbackStore.playbackCurrentDate,
  (newDate) => {
    if (!valueSource) {
      return;
    }
    valueSource.updateParams({
      viewparams: 'date:' + newDate,
    });
    anomalySource.updateParams({
      viewparams: 'date:' + newDate,
    });
  },
);
watch(
  () => mapStore.layerStyle,
  (newStyle) => {
    if (!valueSource) {
      return;
    }
    valueSource.updateParams({
      STYLES: LayerStyleNames[newStyle],
    });
  },
);
watch(
  () => mapStore.showAnomalies,
  (showAnomalies) => {
    const map = mapRef.value?.map;
    if (!map) {
      return;
    }
    if (showAnomalies) {
      valueSource.updateParams({
        STYLES: LayerStyleNames[LayerStyleEnum.GRAY],
      });
      anomalyLayer.setVisible(true);
    } else {
      valueSource.updateParams({
        STYLES: LayerStyleNames[mapStore.layerStyle],
      });
      anomalyLayer.setVisible(false);
    }
  },
);

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
  // add watermark control
  map.addControl(watermarkControl);
  map.addLayer(valueLayer);
  map.addLayer(anomalyLayer);
  map.addLayer(featureLayer);
  map.addLayer(hoverLayer);
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

/**
 * Select and hover features
 */
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
  <div>${feature.get('region__name')}</div>
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

watch(selectedFeatures, () => {
  featureLayer.changed();
});
watch(hoveredFeatures, () => {
  hoverLayer.changed();
});
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

  &.visible {
    opacity: 1;
    transform: scale(1);
  }

  /* Add a triangle pointer */
  &::after {
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
}

.watermark {
  position: absolute;
  bottom: 110px;
  right: 45%;
  height: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  img {
    height: 100%;
    width: auto;
  }
}
.custom-attributions-control {
  top: auto !important;
  bottom: 88px !important;
  right: 0px !important;
  left: auto !important;
}
</style>
