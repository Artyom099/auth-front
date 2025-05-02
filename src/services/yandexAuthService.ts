import axios from 'axios';
import { API_URL } from './config';

const YANDEX_CLIENT_ID = '3bc63d5df8584382ae6e05da843eea96'; // Замените на ваш ID клиента Яндекс
const YANDEX_OAUTH_URL = 'https://oauth.yandex.ru';
const YANDEX_API_URL = 'https://login.yandex.ru';
const REDIRECT_URI = 'http://localhost:3010/api/v1/yandex/callback';

export const yandexAuthService = {
  /**
   * Получение URL для авторизации через Яндекс
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: YANDEX_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'login:email login:info',
      state: Math.random().toString(36).substring(2, 15)
    });

    return `${YANDEX_OAUTH_URL}/authorize?${params.toString()}`;
  },

  /**
   * Обработка ответа от Яндекс после авторизации
   */
  async handleCallback(code: string) {
    try {
      // Запрос к бэкенду для обработки кода и получения информации о пользователе
      const response = await axios.post(`${API_URL}/auth/yandex-callback`, { code });
      
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

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при авторизации через Яндекс');
      }
      throw error;
    }
  },

  /**
   * Обработка логина через Яндекс (перенаправление на страницу Яндекс)
   */
  login() {
    window.location.href = this.getAuthUrl();
  }
}; 