import type { RouteRecordRaw } from 'vue-router';
import routesNames from './routesNames';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('src/pages/BiteIndexMapPage.vue'),
      },
      {
        path: routesNames.biteIndexMap,
        name: routesNames.biteIndexMap,
        component: () => import('src/pages/BiteIndexMapPage.vue'),
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
