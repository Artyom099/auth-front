import { useState, useEffect } from 'react';
import { Smartphone, Apple as Apps, ChevronRight, LogOut, User, Trash2, Shield, Lock, MoreVertical, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AuthForm } from '../auth/AuthForm';
import { mockUserData } from '../../data/mockData';
import { authService } from '../../services/authService';
import { deviceService } from '../../services/deviceService';
import { roleService, Role } from '../../services/roleService';
import { accessObjectService, AccessObject, Action } from '../../services/accessObjectService';
import { useLocation } from 'react-router-dom';

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
  const [accessObjects, setAccessObjects] = useState<AccessObject[]>([]);
  const [accessObjectsError, setAccessObjectsError] = useState<string | null>(null);
  const [isAccessObjectsLoading, setIsAccessObjectsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<'initial' | 'code' | 'password'>('initial');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleLoginSuccess = (userData: UserData) => {
    setUserData(userData);
    setIsLoggedIn(true);
    setActiveTab('profile');
    // Загружаем устройства после успешного логина
    fetchDevices();
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

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      setIsLoading(true);
      await deviceService.deleteDevice(deviceId);
      // Обновляем список устройств после удаления
      await fetchDevices();
    } catch (error) {
      console.error('Ошибка при удалении устройства:', error);
      setError('Ошибка при удалении устройства');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setIsRolesLoading(true);
      const response = await roleService.getRoles();
      setRoles(response.payload || []);
    } catch (error) {
      console.error('Ошибка при получении ролей:', error);
      setRolesError('Ошибка при загрузке ролей');
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

  const fetchAccessObjects = async () => {
    try {
      setIsAccessObjectsLoading(true);
      const response = await accessObjectService.getAccessObjectTree();
      console.log('Access Objects Response:', response); // Отладочная информация
      if (response.payload) {
        setAccessObjects(response.payload);
      } else {
        setAccessObjects([]);
      }
    } catch (error) {
      console.error('Ошибка при получении объектов доступа:', error);
      setAccessObjectsError('Ошибка при загрузке объектов доступа');
    } finally {
      setIsAccessObjectsLoading(false);
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
          // Загружаем устройства, роли и объекты доступа после успешной авторизации
          await Promise.all([fetchDevices(), fetchRoles(), fetchAccessObjects()]);
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

    // Проверяем, есть ли данные пользователя в состоянии навигации
    if (location.state?.userData) {
      setUserData(location.state.userData);
      setIsLoggedIn(true);
      setActiveTab('profile');
      Promise.all([fetchDevices(), fetchRoles(), fetchAccessObjects()]);
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

  const renderAccessObject = (object: AccessObject, level: number = 0) => {
    const paddingLeft = `${level * 1.5}rem`;
    
    return (
      <div key={object.name} style={{ paddingLeft }}>
        <div className="flex items-center space-x-2 py-2">
          <div className="flex items-center space-x-2">
            {object.type === 'module' ? (
              <Lock className="h-5 w-5 text-blue-500" />
            ) : (
              <Shield className="h-5 w-5 text-green-500" />
            )}
            <span className="font-medium">{object.name}</span>
            <span className="text-sm text-gray-500">({object.type})</span>
          </div>
        </div>
        
        {object.actions.length > 0 && (
          <div className="ml-8 space-y-1">
            {object.actions.map((action) => (
              <div key={action.name} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{action.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  action.type === 'read' ? 'bg-blue-100 text-blue-800' :
                  action.type === 'write' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {action.type}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {object.children?.map((child) => renderAccessObject(child, level + 1))}
      </div>
    );
  };

  const renderAccessObjectsTable = () => {
    console.log('Rendering table with objects:', accessObjects);
    
    if (!accessObjects || accessObjects.length === 0) {
      return <div className="text-center text-gray-500">Нет данных для отображения</div>;
    }

    const rows: Array<{
      id: string;
      name: string;
      type: string;
      action: Action;
      level: number;
    }> = [];

    const processObject = (object: AccessObject, level: number = 0) => {
      if (object.actions && object.actions.length > 0) {
        object.actions.forEach(action => {
          rows.push({
            id: `${object.name}-${action.name}-${level}`,
            name: object.name,
            type: object.type,
            action,
            level
          });
        });
      } else {
        // Если у объекта нет действий, добавляем одну строку с пустым действием
        rows.push({
          id: `${object.name}-${level}`,
          name: object.name,
          type: object.type,
          action: { name: '-', type: 'read' },
          level
        });
      }

      if (object.children && object.children.length > 0) {
        object.children.forEach(child => processObject(child, level + 1));
      }
    };

    accessObjects.forEach(object => processObject(object));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действие
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Управление</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div style={{ marginLeft: `${row.level * 1.5}rem` }} className="flex items-center">
                      {row.type === 'module' ? (
                        <Lock className="h-5 w-5 text-blue-500 mr-2" />
                      ) : (
                        <Shield className="h-5 w-5 text-green-500 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{row.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    row.type === 'module' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {row.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.action.name !== '-' ? (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      row.action.type === 'read' ? 'bg-blue-100 text-blue-800' :
                      row.action.type === 'write' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {row.action.name}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {row.action.name !== '-' && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === row.id && (
                        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                              role="menuitem"
                            >
                              Выдать доступ
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

  if (!isLoggedIn) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {userData?.login?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{userData?.login || 'Пользователь'}</h1>
              <p className="text-sm text-gray-500">{userData?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
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
              onClick={() => setActiveTab('devices')}
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
              onClick={() => setActiveTab('services')}
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
              onClick={() => setActiveTab('roles')}
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
              onClick={() => setActiveTab('access-objects')}
              className={`${
                activeTab === 'access-objects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Lock className="h-5 w-5 mr-2" />
              Объекты доступа
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'profile' && userData && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Информация о пользователе</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Логин</label>
                      <div className="mt-1 text-sm text-gray-900">{userData.login || 'Не указан'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-sm text-gray-900">{userData.email || 'Не указан'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID пользователя</label>
                      <div className="mt-1 text-sm text-gray-900">{userData.id || 'Не указан'}</div>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <h3 className="text-lg font-medium text-gray-900">Устройства</h3>
                  {isLoading ? (
                    <div className="mt-4 text-center text-gray-500">Загрузка устройств...</div>
                  ) : error ? (
                    <div className="mt-4 text-center text-red-500">{error}</div>
                  ) : devices.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">Устройства не найдены</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Smartphone className="h-6 w-6 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
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
            <div className="divide-y divide-gray-200">
              {mockUserData.services.map((service) => (
                <div key={service.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <service.icon className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
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
                  <h3 className="text-lg font-medium text-gray-900">Роли</h3>
                  {isRolesLoading ? (
                    <div className="mt-4 text-center text-gray-500">Загрузка ролей...</div>
                  ) : rolesError ? (
                    <div className="mt-4 text-center text-red-500">{rolesError}</div>
                  ) : roles.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">Роли не найдены</div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {roles.map((role, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Shield className="h-6 w-6 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {role.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {role.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'access-objects' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Объекты доступа</h3>
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
        </div>
      </main>
    </div>
  );
}