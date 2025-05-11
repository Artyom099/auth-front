import axios from 'axios';

const API_URL = 'http://localhost:3010/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface Action {
  name: string;
  type: 'read' | 'write' | 'admin';
}

export interface AccessObject {
  name: string;
  type: 'module' | 'entity';
  actions: Action[];
  children?: AccessObject[];
}

export const accessObjectService = {
  async getAccessObjectTree() {
    try {
      const response = await api.get('/admin/access_object/tree');
      
      if (response.data.hasError) {
        throw new Error(response.data.message || 'Ошибка при получении дерева объектов доступа');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении дерева объектов доступа');
      }
      throw error;
    }
  }
}; 