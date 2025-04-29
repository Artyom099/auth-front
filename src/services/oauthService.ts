import axios from 'axios';
import { API_URL } from './config';
import { deviceService } from './deviceService';

interface YandexLoginData {
  yandexId: string;
  email: string;
  login: string;
  accessToken: string;
}

interface OAuthResponse {
  payload: {
    accessToken: string;
    refreshToken: string;
  };
  hasError: boolean;
  message?: string;
}

export const oauthService = {
  async loginWithYandex(data: YandexLoginData): Promise<OAuthResponse> {
    try {
      const response = await axios.post<OAuthResponse>(`${API_URL}/auth/yandex-login`, data);

      if (response.data.payload?.accessToken) {
        localStorage.setItem('accessToken', response.data.payload.accessToken);
      } else {
        throw new Error('Access token не получен');
      }

      if (response.data.payload?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.payload.refreshToken);
      } else {
        throw new Error('Refresh token не получен');
      }

      // Запрашиваем список устройств после успешной авторизации
      await deviceService.getDevices();

      return response.data;
    } catch (error) {
      // В случае ошибки очищаем токены
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при авторизации через Яндекс');
      }
      throw error;
    }
  }
}; 