import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getUsageData = async (payload) => {
  const response = await API.post('/usage', payload);
  return response.data;
};

export const getUsageConfig = async () => {
  const response = await API.get('/usage/config');
  return response.data;
};
