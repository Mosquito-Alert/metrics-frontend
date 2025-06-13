<template>
  <q-layout view="lHh LpR fFf">
    <!-- <MainHeader /> -->

    <RegionDetailedDrawer v-if="drawerRegionDetailed.isRegionSelected" />

    <!-- <MainDrawer /> -->

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRegionDetailedStore } from 'src/stores/regionDetailedStore';

const drawerRegionDetailed = useRegionDetailedStore();
</script>
