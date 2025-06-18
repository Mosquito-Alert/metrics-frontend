import type { RouteRecordRaw } from 'vue-router';
import routesNames from './routesNames';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AnomalyMapPage.vue'),
      },
      {
        path: routesNames.anomalyMap,
        name: routesNames.anomalyMap,
        component: () => import('pages/AnomalyMapPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
