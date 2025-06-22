import axios from "axios";
import { API_URL } from "./config";
import { handleApiError } from './apiErrorHandler';

export enum EAccessObjectType {
  APP = 'APP',
  TAB = 'TAB',
  BUTTON = 'BUTTON',
}

export enum EActionType {
  READ = 'r',
  WRITE = 'w',
  SPECIAL = 's'
}

export type TFlatTreeItem = {
  objectName: string;
  objectParentName: string;
  objectType: EAccessObjectType;
  actionName: string;
  actionType: EActionType;
  actionDescription: string;
  ownGrant: boolean;
  parentGrant: boolean;
};

export type TActionGrant = {
  actionName: string;
  actionType: EActionType;
  actionDescription: string;
  ownGrant: boolean;
  parentGrant: boolean;
};

export type TNestedTreeItem = {
  objectName: string;
  objectType: EAccessObjectType;
  actions?: TActionGrant[];
  children?: TNestedTreeItem[];
};

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const accessObjectService = {
  async getAccessObjectTree(roleName: string) {
    try {
      const response = await api.post('/admin/access_object/calculate_rights', { roleName });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Ошибка при загрузке объектов доступа');
    }
  },

  async reassignRights(roleName: string, actionNames: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await api.post('/admin/right/reassign', {
        roleName,
        actionNames
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Ошибка при обновлении прав доступа');
    }
  }
};
