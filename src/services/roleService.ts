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
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface Role {
  name: string;
  description: string;
}

export interface RoleTreeNode {
  name: string;
  parentName: string;
}

export const roleService = {
  async getRoles() {
    try {
      const response = await api.get('/admin/roles');
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при получении списка ролей');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении списка ролей');
      }
      throw error;
    }
  },

  async createRole(name: string, description: string, permissions: string[]) {
    try {
      const response = await api.post('/admin/roles', {
        name,
        description,
        permissions
      });
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при создании роли');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при создании роли');
      }
      throw error;
    }
  },

  async updateRole(id: string, name: string, description: string, permissions: string[]) {
    try {
      const response = await api.put(`/admin/roles/${id}`, {
        name,
        description,
        permissions
      });
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при обновлении роли');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при обновлении роли');
      }
      throw error;
    }
  },

  async deleteRole(id: string) {
    try {
      const response = await api.delete(`/admin/roles/${id}`);
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при удалении роли');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при удалении роли');
      }
      throw error;
    }
  },

  async getRoleTree(roleName: string) {
    try {
      const response = await api.post(`/admin/roles/get_tree`, {
        name: roleName
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении дерева ролей');
      }
      throw error;
    }
  }
}; 