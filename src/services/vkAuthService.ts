import axios from 'axios';

const VK_CLIENT_ID = '53471196';
const VK_CLIENT_SECRET = 'YFLaQZ48WpZv3msCX7ZE';
const VK_REDIRECT_URI = 'http://localhost:5173/auth/vk/callback';
const VK_OAUTH_URL = 'https://oauth.vk.com';
const VK_API_URL = 'https://api.vk.com';
const VK_API_VERSION = '5.131';

// Генерация случайной строки для state
const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Генерация code_verifier и code_challenge для PKCE
const generateCodeVerifier = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const vkAuthService = {
  async getAuthUrl() {
    const state = generateRandomString(32);
    localStorage.setItem('vk_state', state);

    const params = new URLSearchParams({
      client_id: VK_CLIENT_ID,
      redirect_uri: VK_REDIRECT_URI,
      response_type: 'code',
      scope: 'email',
      state,
      v: VK_API_VERSION,
      display: 'popup'
    });

    return `${VK_OAUTH_URL}/authorize?${params.toString()}`;
  },

  async handleCallback(code: string, state: string) {
    const savedState = localStorage.getItem('vk_state');

    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    try {
      const response = await axios.get(`${VK_OAUTH_URL}/access_token`, {
        params: {
          client_id: VK_CLIENT_ID,
          client_secret: VK_CLIENT_SECRET,
          redirect_uri: VK_REDIRECT_URI,
          code
        }
      });

      // Очищаем временные данные
      localStorage.removeItem('vk_state');

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('VK Auth Error:', error.response?.data);
        throw new Error(error.response?.data?.error_description || 'Ошибка при обмене кода на токен');
      }
      throw error;
    }
  },

  async getUserInfo(accessToken: string, userId: string) {
    try {
      const response = await axios.get(`${VK_API_URL}/method/users.get`, {
        params: {
          user_ids: userId,
          fields: 'first_name,last_name,photo_200,email',
          access_token: accessToken,
          v: VK_API_VERSION
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.error_msg);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('VK User Info Error:', error.response?.data);
        throw new Error(error.response?.data?.error_description || 'Ошибка при получении данных пользователя');
      }
      throw error;
    }
  }
}; 