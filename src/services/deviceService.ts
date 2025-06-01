import axios from 'axios';

const API_URL = 'http://localhost:3010/api/v1';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем интерцептор для автоматической вставки токена в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const deviceService = {
  async getDevices() {
    try {
      const response = await api.get('/device');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении списка устройств');
      }
      throw error;
    }
  },

  async deleteDevice(deviceId: string) {
    try {
      const response = await api.delete(`/device/${deviceId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при удалении устройства');
      }
      throw error;
    }
  },

  async deleteAllDevicesExceptCurrent() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      throw new Error('Токены не найдены');
    }

    try {
      // Удаляем все устройства, кроме текущего
      await api.delete('/device', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true // Для отправки refreshToken в cookies
      });

      // Получаем обновленный список устройств
      const devicesResponse = await api.get('/device', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return devicesResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при удалении устройств');
      }
      throw error;
    }
  }
}; 