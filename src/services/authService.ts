import axios from 'axios';

export const API_URL = 'http://localhost:3010/api/v1';

// Функция для декодирования JWT токена
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Ошибка при декодировании токена:', error);
    return null;
  }
};

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
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при авторизации');
      }

      const { accessToken, refreshToken } = response.data.payload;
      
      if (!accessToken || !refreshToken) {
        throw new Error('Токены не получены');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Устанавливаем refreshToken в куки
      document.cookie = `refreshToken=${refreshToken}; path=/; secure; samesite=strict`;

      return response.data;
    } catch (error) {
      // В случае ошибки очищаем токены
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Очищаем куки
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при авторизации');
      }
      throw error;
    }
  },

  async getMe() {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при получении данных пользователя');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
        throw new Error(error.response?.data?.message || 'Ошибка при получении данных пользователя');
      }
      throw error;
    }
  },

  async registration(login: string, email: string, password: string) {
    try {
      const response = await api.post('/auth/registration', {
        login,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при регистрации');
      }
      throw error;
    }
  },

  async confirmRegistration(code: string) {
    try {
      const response = await api.post('/auth/registration-confirmation', {
        code,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при подтверждении регистрации');
      }
      throw error;
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem('accessToken');
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refreshToken='))
        ?.split('=')[1];
      
      if (!token || !refreshToken) {
        throw new Error('Токены не найдены');
      }
      
      await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          cookie: `refreshToken=${refreshToken}`
        },
        withCredentials: true
      });
      
      // Очищаем токены
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Logout error:', error.response?.data);
      }
      // В любом случае очищаем токены
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  },

  async passwordRecovery(email: string) {
    try {
      const response = await api.post('/auth/password-recovery', { email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при запросе восстановления пароля');
      }
      throw error;
    }
  },

  async confirmPasswordRecovery(code: string) {
    try {
      const response = await api.post('/auth/confirm-password-recovery', { code });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при подтверждении кода восстановления');
      }
      throw error;
    }
  },

  async updatePassword(newPassword: string, recoveryCode: string) {
    try {
      const response = await api.post('/auth/update-password', {
        newPassword,
        recoveryCode
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при обновлении пароля');
      }
      throw error;
    }
  },

  async confirmAndUpdatePassword(code: string, newPassword: string) {
    try {
      await this.confirmPasswordRecovery(code);
      await this.updatePassword(newPassword, code);
      return { success: true };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при обновлении пароля');
      }
      throw error;
    }
  },

  async getUserRoles(userId: string) {
    try {
      const response = await api.post('/admin/user/get_roles', { userId });
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при получении ролей пользователя');
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении ролей пользователя');
      }
      throw error;
    }
  },
}; 