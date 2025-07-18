import { Configuration, RegionsApi, MetricsApi } from 'metrics';
const configuration = new Configuration({
  ...(process.env.API_BASE_URL ? { basePath: process.env.API_BASE_URL } : {}),
});

export const metricsApi = new MetricsApi(configuration);
export const regionsApi = new RegionsApi(configuration);
