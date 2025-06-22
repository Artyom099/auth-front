import { useState, useEffect } from 'react';
import { Smartphone, Apple as Apps, ChevronRight, LogOut, User, Trash2, Shield, Lock, MoreVertical, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AuthForm } from '../auth/AuthForm';
import { mockUserData } from '../../data/mockData';
import { authService } from '../../services/authService';
import { deviceService } from '../../services/deviceService';
import { roleService, Role, RoleTreeNode } from '../../services/roleService';
import { 
  accessObjectService, 
  TNestedTreeItem, 
  EAccessObjectType, 
  EActionType,
  TActionGrant 
} from '../../services/accessObjectService';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';

interface UserData {
  id: string;
  login: string;
  email: string;
}

interface Device {
  id: string;
  ip: string;
  deviceName: string;
  issuedAt: string;
  userId: string;
}

export function Dashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [accessObjects, setAccessObjects] = useState<TNestedTreeItem[]>([]);
  const [accessObjectsError, setAccessObjectsError] = useState<string | null>(null);
  const [isAccessObjectsLoading, setIsAccessObjectsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<'initial' | 'code' | 'password'>('initial');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdatingRights, setIsUpdatingRights] = useState(false);
  const [roleTree, setRoleTree] = useState<RoleTreeNode[]>([]);
  const [selectedRoleForTree, setSelectedRoleForTree] = useState<string>('');
  const [isRoleTreeLoading, setIsRoleTreeLoading] = useState(false);
  const [roleTreeError, setRoleTreeError] = useState<string | null>(null);
  const [deviceToast, setDeviceToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [userRoles, setUserRoles] = useState<{ userId: string; roleName: string }[]>([]);
  const [userRolesLoading, setUserRolesLoading] = useState(false);
  const [userRolesError, setUserRolesError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleParent, setNewRoleParent] = useState('');
  const [createRoleLoading, setCreateRoleLoading] = useState(false);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);
  const [createRoleSuccess, setCreateRoleSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; login: string; email: string }[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [assignRoleUserId, setAssignRoleUserId] = useState<string | null>(null);
  const [assignRoleName, setAssignRoleName] = useState('');
  const [assignRoleLoading, setAssignRoleLoading] = useState(false);
  const [assignRoleError, setAssignRoleError] = useState<string | null>(null);
  const [assignRoleSuccess, setAssignRoleSuccess] = useState<string | null>(null);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, { userId: string; roleName: string }[]>>({});
  const [userRolesLoadingId, setUserRolesLoadingId] = useState<string | null>(null);
  const [userRolesErrorId, setUserRolesErrorId] = useState<string | null>(null);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    if (tab === 'devices' && devices.length === 0) {
      fetchDevices();
    }

    if (tab === 'roles' && roles.length === 0) {
      fetchRoles();
    }

    if (tab === 'access-objects') {
      let currentRoles = roles;
      if (currentRoles.length === 0) {
        const fetched = await fetchRoles();
        if (fetched) currentRoles = fetched;
      }
      if (currentRoles.length > 0) {
        const firstRole = currentRoles[0].name;
        setSelectedRole(firstRole);
        fetchAccessObjects(firstRole);
      }
    }

    if (tab === 'users') {
      fetchUsers();
    }
  };

  const handleLoginSuccess = (userData: UserData) => {
    setUserData(userData);
    setIsLoggedIn(true);
    setActiveTab('profile');
    fetchUserRoles(userData.id);
  };

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await deviceService.getDevices();
      setDevices(response.payload || []);
    } catch (error) {
      console.error('Ошибка при получении устройств:', error);
      setError('Ошибка при загрузке устройств');
    } finally {
      setIsLoading(false);
    }
  };

  const showDeviceToast = (message: string) => {
    setDeviceToast({ message, visible: true });
    setTimeout(() => setDeviceToast({ message: '', visible: false }), 2000);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      setIsLoading(true);
      await deviceService.deleteDevice(deviceId);
      await fetchDevices();
    } catch (error: any) {
      let forbiddenMsg = null;
      if (error?.response?.status === 403) {
        forbiddenMsg = error.response.data?.message || 'Доступ ограничен';
      }
      if (forbiddenMsg) {
        showDeviceToast(forbiddenMsg);
        return;
      }
      showDeviceToast('Ошибка при удалении устройства');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async (): Promise<Role[] | undefined> => {
    try {
      setIsRolesLoading(true);
      const response = await roleService.getRoles();
      const fetched = response.payload || [];
      setRoles(fetched);
      return fetched;
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showDeviceToast(error.response.data?.message || 'Доступ ограничен');
        return undefined;
      }
      setRolesError('Ошибка при загрузке ролей');
      return undefined;
    } finally {
      setIsRolesLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      setIsRolesLoading(true);
      await roleService.deleteRole(roleId);
      await fetchRoles();
    } catch (error) {
      console.error('Ошибка при удалении роли:', error);
      setRolesError('Ошибка при удалении роли');
    } finally {
      setIsRolesLoading(false);
    }
  };

  const fetchAccessObjects = async (roleName: string) => {
    try {
      setIsAccessObjectsLoading(true);
      const response = await accessObjectService.getAccessObjectTree(roleName);
      if (response.payload) {
        setAccessObjects(response.payload);
      } else {
        setAccessObjects([]);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showDeviceToast(error.response.data?.message || 'Доступ ограничен');
        return;
      }
      setAccessObjectsError('Ошибка при загрузке объектов доступа');
      setAccessObjects([]);
    } finally {
      setIsAccessObjectsLoading(false);
    }
  };

  const fetchRoleTree = async (roleName: string) => {
    try {
      setIsRoleTreeLoading(true);
      setRoleTreeError(null);
      const response = await roleService.getRoleTree(roleName);
      setRoleTree(response.payload || []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showDeviceToast(error.response.data?.message || 'Доступ ограничен');
        return;
      }
      setRoleTreeError('Ошибка при загрузке дерева ролей');
      setRoleTree([]);
    } finally {
      setIsRoleTreeLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchUserRoles = async (userId: string) => {
    setUserRolesLoading(true);
    setUserRolesError(null);
    try {
      const response = await authService.getUserRoles(userId);
      setUserRoles(response.payload || []);
    } catch (error: any) {
      setUserRolesError(error.message || 'Ошибка при получении ролей пользователя');
      setUserRoles([]);
    } finally {
      setUserRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await authService.getUsers();
      setUsers(response.payload || []);
    } catch (error: any) {
      setUsersError(error.message || 'Ошибка при загрузке пользователей');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserRolesForUser = async (userId: string) => {
    setUserRolesLoadingId(userId);
    setUserRolesErrorId(null);
    try {
      const response = await authService.getUserRoles(userId);
      setUserRolesMap(prev => ({ ...prev, [userId]: response.payload || [] }));
    } catch (error: any) {
      setUserRolesErrorId(userId);
      setUserRolesMap(prev => ({ ...prev, [userId]: [] }));
    } finally {
      setUserRolesLoadingId(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const response = await authService.getMe();
        if (response.payload) {
          setUserData({
            id: response.payload.id,
            login: response.payload.login,
            email: response.payload.email
          });
          setIsLoggedIn(true);
          setActiveTab('profile');
          await fetchUserRoles(response.payload.id);
        } else {
          throw new Error('Данные пользователя не получены');
        }
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    };

    if (location.state?.userData) {
      setUserData(location.state.userData);
      setIsLoggedIn(true);
      setActiveTab('profile');
      fetchUserRoles(location.state.userData.id);
    } else {
      checkAuth();
    }
  }, [location.state]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsLoggedIn(false);
      setUserData(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
      setUserData(null);
    }
  };

  const handlePasswordRecovery = async () => {
    try {
      await authService.passwordRecovery(userData?.email || '');
      setRecoveryStep('code');
    } catch (error) {
      console.error('Ошибка при запросе смены пароля:', error);
    }
  };

  const handleConfirmCode = async () => {
    try {
      await authService.confirmPasswordRecovery(recoveryCode);
      setRecoveryStep('password');
    } catch (error) {
      console.error('Ошибка при подтверждении кода:', error);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      await authService.updatePassword(newPassword, recoveryCode);
      setRecoveryStep('initial');
      setRecoveryCode('');
      setNewPassword('');
      setShowPassword(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Ошибка при обновлении пароля:', error);
    }
  };

  const handleGrantAccess = async (actionName: string) => {
    if (!selectedRole) return;
    
    try {
      setIsUpdatingRights(true);
      
      // Собираем все действия, которые уже были выданы роли
      const grantedActions = new Set<string>();
      
      // Рекурсивно собираем все действия из дерева объектов
      const collectActions = (objects: TNestedTreeItem[]) => {
        objects.forEach(object => {
          if (object.actions) {
            object.actions.forEach(action => {
              // Добавляем только те действия, которые уже были выданы роли
              if (action.ownGrant) {
                grantedActions.add(action.actionName);
              }
            });
          }
          if (object.children) {
            collectActions(object.children);
          }
        });
      };

      // Собираем все действия из текущего состояния
      collectActions(accessObjects);
      
      // Добавляем новое действие
      grantedActions.add(actionName);

      const actionNames = Array.from(grantedActions);
      
      console.log('Granting access. Sending to API:', {
        roleName: selectedRole,
        actionNames
      });

      await accessObjectService.reassignRights(selectedRole, actionNames);
      await fetchAccessObjects(selectedRole);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showDeviceToast(error.response.data?.message || 'Доступ ограничен');
        return;
      }
      console.error('Ошибка при выдаче доступа:', error);
    } finally {
      setIsUpdatingRights(false);
      setOpenMenuId(null);
    }
  };

  const handleRevokeAccess = async (actionName: string) => {
    if (!selectedRole) return;
    
    try {
      setIsUpdatingRights(true);
      
      // Собираем все действия, которые уже были выданы роли
      const grantedActions = new Set<string>();
      
      // Рекурсивно собираем все действия из дерева объектов
      const collectActions = (objects: TNestedTreeItem[]) => {
        objects.forEach(object => {
          if (object.actions) {
            object.actions.forEach(action => {
              // Добавляем только те действия, которые уже были выданы роли, кроме отзываемого
              if (action.ownGrant && action.actionName !== actionName) {
                grantedActions.add(action.actionName);
              }
            });
          }
          if (object.children) {
            collectActions(object.children);
          }
        });
      };

      // Собираем все действия из текущего состояния
      collectActions(accessObjects);

      const actionNames = Array.from(grantedActions);
      
      console.log('Revoking access. Sending to API:', {
        roleName: selectedRole,
        actionNames
      });

      await accessObjectService.reassignRights(selectedRole, actionNames);
      await fetchAccessObjects(selectedRole);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showDeviceToast(error.response.data?.message || 'Доступ ограничен');
        return;
      }
      console.error('Ошибка при отзыве доступа:', error);
    } finally {
      setIsUpdatingRights(false);
      setOpenMenuId(null);
    }
  };

  const handleCreateRole = async () => {
    setCreateRoleLoading(true);
    setCreateRoleError(null);
    setCreateRoleSuccess(null);
    try {
      await authService.createRole(newRoleName, newRoleDescription, newRoleParent || undefined);
      setCreateRoleSuccess('Роль успешно создана');
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleParent('');
      await fetchRoles();
      if (selectedRoleForTree) {
        await fetchRoleTree(selectedRoleForTree);
      }
    } catch (error: any) {
      setCreateRoleError(error.message || 'Ошибка при создании роли');
    } finally {
      setCreateRoleLoading(false);
      setTimeout(() => setCreateRoleSuccess(null), 3000);
    }
  };

  const handleAssignRole = async () => {
    if (!assignRoleUserId || !assignRoleName) return;
    setAssignRoleLoading(true);
    setAssignRoleError(null);
    setAssignRoleSuccess(null);
    try {
      await authService.assignRoleToUser(assignRoleUserId, assignRoleName);
      setAssignRoleSuccess('Роль успешно выдана пользователю');
      setAssignRoleUserId(null);
      setAssignRoleName('');
    } catch (error: any) {
      setAssignRoleError(error.message || 'Ошибка при выдаче роли');
    } finally {
      setAssignRoleLoading(false);
      setTimeout(() => setAssignRoleSuccess(null), 3000);
    }
  };

  const renderAccessObjectsTable = () => {
    console.log('Rendering table with objects:', accessObjects);
    
    if (!accessObjects || accessObjects.length === 0) {
      return <div className="text-center text-gray-500">Нет данных для отображения</div>;
    }

    const rows: Array<{
      id: string;
      objectName: string;
      objectType: EAccessObjectType;
      action: TActionGrant;
      level: number;
      isObject: boolean;
    }> = [];

    const processObject = (object: TNestedTreeItem, level: number = 0) => {
      // Сначала добавляем сам объект
      rows.push({
        id: `${object.objectName}-${level}`,
        objectName: object.objectName,
        objectType: object.objectType,
        action: { 
          actionName: '-', 
          actionType: EActionType.READ, 
          actionDescription: '', 
          ownGrant: false, 
          parentGrant: false 
        },
        level,
        isObject: true
      });

      // Затем добавляем его действия с увеличенным отступом
      if (object.actions && object.actions.length > 0) {
        object.actions.forEach(action => {
          rows.push({
            id: `${object.objectName}-${action.actionName}-${level}`,
            objectName: object.objectName,
            objectType: object.objectType,
            action,
            level: level + 1,
            isObject: false
          });
        });
      }

      // Рекурсивно обрабатываем дочерние объекты
      if (object.children && object.children.length > 0) {
        object.children.forEach(child => processObject(child, level + 1));
      }
    };

    accessObjects.forEach(object => processObject(object));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Объект доступа
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Тип объекта
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Действие
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Тип действия
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Описание
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Прямой доступ
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Родительский доступ
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                <span className="sr-only">Управление</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!row.isObject ? 'bg-gray-50 dark:bg-gray-700' : ''}`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div style={{ marginLeft: `${row.level * 1}rem` }} className="flex items-center">
                      {row.isObject ? (
                        row.objectType === EAccessObjectType.APP ? (
                          <Lock className="h-4 w-4 text-blue-500 mr-1" />
                        ) : row.objectType === EAccessObjectType.TAB ? (
                          <Shield className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <MoreVertical className="h-4 w-4 text-purple-500 mr-1" />
                        )
                      ) : (
                        <div className="w-4 mr-1" />
                      )}
                      <span className={`text-xs ${row.isObject ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white'}`}>
                        {row.objectName}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.isObject && (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      row.objectType === EAccessObjectType.APP ? 'bg-blue-100 text-blue-800' : 
                      row.objectType === EAccessObjectType.TAB ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.objectType}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!row.isObject && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.action.actionType === EActionType.READ ? 'bg-blue-100 text-blue-800' :
                      row.action.actionType === EActionType.WRITE ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.action.actionName}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!row.isObject && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.action.actionType === EActionType.READ ? 'bg-blue-100 text-blue-800' :
                      row.action.actionType === EActionType.WRITE ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.action.actionType}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {!row.isObject && row.action.actionDescription}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!row.isObject && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.action.ownGrant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.action.ownGrant ? 'Есть' : 'Нет'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!row.isObject && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.action.parentGrant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.action.parentGrant ? 'Есть' : 'Нет'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  {!row.isObject && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        disabled={isUpdatingRights}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === row.id && (
                        <div className="absolute right-0 z-50 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-white ring-opacity-5 dark:ring-opacity-10">
                          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
                            <button
                              onClick={() => handleGrantAccess(row.action.actionName)}
                              disabled={isUpdatingRights}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              role="menuitem"
                            >
                              Выдать доступ
                            </button>
                            <button
                              onClick={() => handleRevokeAccess(row.action.actionName)}
                              disabled={isUpdatingRights}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              role="menuitem"
                            >
                              Отозвать доступ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRoleTree = () => {
    if (isRoleTreeLoading) {
      return <div className="mt-4 text-center text-gray-500">Загрузка дерева ролей...</div>;
    }

    if (roleTreeError) {
      return <div className="mt-4 text-center text-red-500">{roleTreeError}</div>;
    }

    if (roleTree.length === 0) {
      return <div className="mt-4 text-center text-gray-500">Дерево ролей не найдено</div>;
    }

    // Создаем карту для быстрого доступа к узлам по имени
    const nodeMap = new Map(roleTree.map(node => [node.name, node]));
    // Находим корневые узлы (те, у которых нет родителя или родитель не в списке)
    const rootNodes = roleTree.filter(node => !node.parentName || !nodeMap.has(node.parentName));

    const renderNode = (node: RoleTreeNode, level: number = 0) => {
      const children = roleTree.filter(n => n.parentName === node.name);
      return (
        <div key={node.name} className="relative">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded mb-2" style={{ marginLeft: level > 0 ? '1.5rem' : 0 }}>
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-gray-400" />
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{node.name}</div>
                {node.parentName && (
                  <div className="text-xs text-gray-500">
                    Родительская роль: {node.parentName}
                  </div>
                )}
              </div>
            </div>
          </div>
          {children.length > 0 && (
            <div>
              {children.map((child) => (
                <div key={child.name} className="relative flex items-start">
                  {/* Только горизонтальная линия для потомков */}
                  <div style={{ width: '1.5rem', height: 0, borderTop: '1px solid #D1D5DB', marginTop: '1.25rem', marginRight: '-0.75rem', marginLeft: level >= 0 ? '1.5rem' : 0, visibility: level >= 0 ? 'visible' : 'hidden' }} />
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="mt-4 space-y-2">
        {rootNodes.map(node => renderNode(node))}
      </div>
    );
  };

  if (!isLoggedIn) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-600 dark:text-white font-medium">
                {userData?.login?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{userData?.login || 'Пользователь'}</h1>
              <p className="text-sm text-gray-500 dark:text-white">{userData?.email || ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Toast для ошибок удаления устройства */}
      {deviceToast.visible && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-lg z-50">
          {deviceToast.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <User className="h-5 w-5 mr-2" />
              Профиль
            </button>
            <button
              onClick={() => handleTabChange('devices')}
              className={`${
                activeTab === 'devices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Устройства
            </button>
            <button
              onClick={() => handleTabChange('services')}
              className={`${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Apps className="h-5 w-5 mr-2" />
              Сервисы
            </button>
            <button
              onClick={() => handleTabChange('roles')}
              className={`${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Shield className="h-5 w-5 mr-2" />
              Роли
            </button>
            <button
              onClick={() => handleTabChange('access-objects')}
              className={`${
                activeTab === 'access-objects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Lock className="h-5 w-5 mr-2" />
              Объекты доступа
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <User className="h-5 w-5 mr-2" />
              Пользователи
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {activeTab === 'profile' && userData && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Информация о пользователе</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">Логин</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{userData.login || 'Не указан'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">Email</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{userData.email || 'Не указан'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">ID пользователя</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{userData.id || 'Не указан'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">Роли пользователя</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">
                        {userRolesLoading ? (
                          <span className="text-gray-500">Загрузка ролей...</span>
                        ) : userRolesError ? (
                          <span className="text-red-500">{userRolesError}</span>
                        ) : userRoles.length === 0 ? (
                          <span className="text-gray-500">Роли не найдены</span>
                        ) : (
                          <ul className="list-disc pl-5">
                            {userRoles.map((role, idx) => (
                              <li key={idx}>{role.roleName}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {recoveryStep === 'initial' && (
                    <button
                      onClick={handlePasswordRecovery}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Обновить пароль
                    </button>
                  )}
                  {recoveryStep === 'code' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          Код подтверждения
                        </label>
                        <input
                          type="text"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Введите код из письма"
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleConfirmCode}
                          disabled={isLoading}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isLoading ? 'Подтверждение...' : 'Подтвердить код'}
                        </button>
                        <button
                          onClick={() => {
                            setRecoveryStep('initial');
                            setRecoveryCode('');
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  {recoveryStep === 'password' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          Новый пароль
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Введите новый пароль"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isLoading}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isLoading ? 'Обновление...' : 'Обновить пароль'}
                        </button>
                        <button
                          onClick={() => {
                            setRecoveryStep('initial');
                            setNewPassword('');
                            setShowPassword(false);
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSuccessMessage && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg z-50">
              <CheckCircle className="h-5 w-5" />
              <span>Пароль успешно обновлен</span>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Устройства</h3>
                    <button
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          await deviceService.deleteAllDevicesExceptCurrent();
                          await fetchDevices();
                        } catch (error) {
                          console.error('Ошибка при завершении других сеансов:', error);
                          setError('Ошибка при завершении других сеансов');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Завершить другие сеансы
                    </button>
                  </div>
                  {isLoading ? (
                    <div className="mt-4 text-center text-gray-500">Загрузка устройств...</div>
                  ) : error ? (
                    <div className="mt-4 text-center text-red-500">{error}</div>
                  ) : devices.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">Устройства не найдены</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Smartphone className="h-6 w-6 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {device.deviceName}
                              </div>
                              <div className="text-sm text-gray-500">
                                IP: {device.ip}
                              </div>
                              <div className="text-sm text-gray-500">
                                Последняя активность: {formatDate(device.issuedAt)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockUserData.services.map((service) => (
                <div key={service.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center">
                    <service.icon className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{service.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.status === 'Active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Роли</h3>
                  <div className="flex gap-6">
                    {/* Список ролей слева */}
                    <div className="w-1/2">
                      {isRolesLoading ? (
                        <div className="text-center text-gray-500">Загрузка ролей...</div>
                      ) : rolesError ? (
                        <div className="text-center text-red-500">{rolesError}</div>
                      ) : roles.length === 0 ? (
                        <div className="text-center text-gray-500">Роли не найдены</div>
                      ) : (
                        <div className="space-y-2">
                          {roles.map((role, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setSelectedRoleForTree(role.name);
                                fetchRoleTree(role.name);
                              }}
                              className={`flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                selectedRoleForTree === role.name ? 'ring-2 ring-blue-500' : ''
                              }`}
                            >
                              <Shield className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {role.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {role.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Дерево ролей справа */}
                    <div className="w-1/2">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        {selectedRoleForTree ? `Дерево ролей для "${selectedRoleForTree}"` : 'Выберите роль для просмотра дерева'}
                      </h4>
                      {renderRoleTree()}
                    </div>
                  </div>
                </div>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Название роли</label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder="Введите название роли"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Описание роли<span className='text-red-500'>*</span></label>
                      <input
                        type="text"
                        value={newRoleDescription}
                        onChange={e => setNewRoleDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder="Введите описание роли"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Родительская роль</label>
                      <select
                        value={newRoleParent}
                        onChange={e => setNewRoleParent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">Без родителя</option>
                        {roles.map(role => (
                          <option key={role.name} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCreateRole}
                      disabled={createRoleLoading || !newRoleName || !newRoleDescription}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {createRoleLoading ? 'Создание...' : 'Создать роль'}
                    </button>
                  </div>
                  {createRoleError && <div className="mt-2 text-red-500 text-sm">{createRoleError}</div>}
                  {createRoleSuccess && <div className="mt-2 text-green-600 text-sm">{createRoleSuccess}</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'access-objects' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Объекты доступа</h3>
                  <div className="mt-4 mb-4">
                    <select
                      value={selectedRole}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                        fetchAccessObjects(e.target.value);
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Выберите роль</option>
                      {roles.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isAccessObjectsLoading ? (
                    <div className="mt-4 text-center text-gray-500">Загрузка объектов доступа...</div>
                  ) : accessObjectsError ? (
                    <div className="mt-4 text-center text-red-500">{accessObjectsError}</div>
                  ) : accessObjects.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">Объекты доступа не найдены</div>
                  ) : (
                    <div className="mt-4">
                      {renderAccessObjectsTable()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Пользователи</h3>
              {usersLoading ? (
                <div className="text-center text-gray-500">Загрузка пользователей...</div>
              ) : usersError ? (
                <div className="text-center text-red-500">{usersError}</div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-500">Пользователи не найдены</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map(user => (
                        <tr key={user.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.login}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <button
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                              onClick={() => {
                                setAssignRoleUserId(user.id);
                                setAssignRoleName('');
                                fetchUserRolesForUser(user.id);
                              }}
                            >
                              Выдать роль
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Модальное окно для выдачи роли */}
              {assignRoleUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
                    <h4 className="text-lg font-medium dark:text-white mb-4">Выдать роль пользователю</h4>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Текущие роли пользователя:</label>
                      {userRolesLoadingId === assignRoleUserId ? (
                        <div className="text-gray-500 text-sm mb-2">Загрузка...</div>
                      ) : userRolesErrorId === assignRoleUserId ? (
                        <div className="text-red-500 text-sm mb-2">Ошибка при загрузке ролей</div>
                      ) : (
                        <ul className="list-disc pl-5 text-sm mb-2">
                          {(userRolesMap[assignRoleUserId] || []).length === 0 ? (
                            <li className="text-gray-500">Нет ролей</li>
                          ) : (
                            userRolesMap[assignRoleUserId].map((role, idx) => (
                              <li key={idx}>{role.roleName}</li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Роль</label>
                      <select
                        value={assignRoleName}
                        onChange={e => setAssignRoleName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">Выберите роль</option>
                        {roles.map(role => (
                          <option key={role.name} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    {assignRoleError && <div className="text-red-500 text-sm mb-2">{assignRoleError}</div>}
                    {assignRoleSuccess && <div className="text-green-600 text-sm mb-2">{assignRoleSuccess}</div>}
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        onClick={() => {
                          setAssignRoleUserId(null);
                          setAssignRoleName('');
                          setAssignRoleError(null);
                          setAssignRoleSuccess(null);
                        }}
                        disabled={assignRoleLoading}
                      >
                        Отмена
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                        onClick={handleAssignRole}
                        disabled={!assignRoleName || assignRoleLoading}
                      >
                        {assignRoleLoading ? 'Выдача...' : 'Выдать'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}