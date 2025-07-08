<template>
  <div class="layer-style-selector" @mouseleave="hideStyleOptions">
    <button
      class="layer-style-selector-button"
      :style="{
        background: `linear-gradient(to right, ${gradientStops(mapStore.layerStyle)})`,
      }"
      @mouseover="showStyleOptions"
    >
      <span class="layer-style-subtitle">{{ title }}</span>
    </button>
    <div class="layer-style-selector-options" v-if="showLayerStyleSelector">
      <div
        v-for="style in styles"
        @click="selectStyle(style)"
        :class="{ active: mapStore.layerStyle === style }"
        class="layer-style-selector-option"
        :style="{
          background: `linear-gradient(to right, ${gradientStops(style)})`,
        }"
      >
        <span class="layer-style-subtitle">{{ LayerStyleLabels[style] }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { gradientStops, LayerStyleEnum, LayerStyleLabels } from 'src/constants/colors';
import { useMapStore } from 'src/stores/mapStore';
import { ref } from 'vue';

const mapStore = useMapStore();

const showLayerStyleSelector = ref(false);
const title = ref('Style');

const styles = Object.values(LayerStyleEnum).filter((style) => style !== LayerStyleEnum.GRAY);

const selectStyle = (style: LayerStyleEnum) => {
  mapStore.layerStyle = style;
  hideStyleOptions();
};
const showStyleOptions = () => {
  showLayerStyleSelector.value = true;
  title.value = LayerStyleLabels[mapStore.layerStyle] || 'Style';
};
const hideStyleOptions = () => {
  showLayerStyleSelector.value = false;
  title.value = 'Style';
};
</script>
<style lang="scss">
.layer-style-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
  .layer-style-selector-button {
    height: 77px;
    width: 77px;
    border: 1px solid $dark;
    border-radius: 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    cursor: pointer !important;
  }

  .layer-style-selector-options {
    height: 77px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    padding: 0.35rem;
    background-color: white;
    border: 1px solid $dark-opacity;
    border-radius: 0.5rem;

    .layer-style-selector-option {
      height: 62px;
      width: 62px;
      border: 1px solid $dark;
      border-radius: 0.5rem;
      margin: 2.5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      cursor: pointer !important;

      &:hover {
        height: 65px;
        width: 65px;
        transition: all 0.2s ease-in-out;
      }
      &.active {
        border: 2px solid $primary1;
        span {
          background-color: $primary2;
          color: #000;
          border: 1px solid $primary1;
        }
      }

      span {
        font-size: 0.7rem;
      }
    }
  }
}
.layer-style-subtitle {
  display: block;
  width: 100%;
  font-size: 0.8rem;
  margin: 0;
  color: $dark-mode-text;
  background-color: $dark-opacity;
  border: 1px solid $dark;
  border-radius: 0 0 0.4rem 0.4rem;
  text-align: center;
}
</style>
