import React, { useState, useEffect } from 'react';
import { Smartphone, Apple as Apps, ChevronRight, LogOut, Shield, Globe, Trash2, User, Key, Eye, EyeOff } from 'lucide-react';
import { AuthForm } from '../auth/AuthForm';
import { mockUserData } from '../../data/mockData';
import { authService } from '../../services/authService';
import { deviceService } from '../../services/deviceService';
import { useNavigate } from 'react-router-dom';
import { Device } from '../../types';

interface UserData {
  email: string;
  login: string;
  userId: string;
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ id, value, onChange, label, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
          placeholder={placeholder}
          required
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [passwordRecoveryMessage, setPasswordRecoveryMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatePasswordMessage, setUpdatePasswordMessage] = useState('');
  const [isCodeConfirmed, setIsCodeConfirmed] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchUserData = async () => {
        try {
          const data = await authService.getMe();
          setUserData(data.payload);
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
        }
      };
      fetchUserData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchDevices = async () => {
      if (activeTab === 'devices') {
        try {
          const devicesData = await deviceService.getDevices();
          setDevices(devicesData.payload || []);
          setError('');
        } catch (error) {
          console.error('Error fetching devices:', error);
          setError('Ошибка при получении списка устройств');
        }
      }
    };

    fetchDevices();
  }, [activeTab]);

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

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsLoggedIn(false);
      setUserData(null);
      navigate('/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setIsLoggedIn(false);
      setUserData(null);
      setError('Ошибка при выходе из системы');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setIsDeleting(deviceId);
    try {
      await deviceService.deleteDevice(deviceId);
      setDevices(devices.filter(device => device.id !== deviceId));
    } catch (error) {
      console.error('Error deleting device:', error);
      setError('Ошибка при удалении устройства');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAllDevices = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить все устройства, кроме текущего?')) {
      return;
    }

    setIsDeletingAll(true);
    try {
      const response = await deviceService.deleteAllDevicesExceptCurrent();
      setDevices(response.payload || []);
      setError('');
    } catch (error) {
      console.error('Error deleting devices:', error);
      setError('Ошибка при удалении устройств');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!userData?.email) return;
    
    try {
      await authService.passwordRecovery(userData.email);
      setPasswordRecoveryMessage('Инструкции по смене пароля отправлены на вашу почту');
      setShowPasswordForm(true);
      setIsCodeConfirmed(false);
    } catch (error) {
      setPasswordRecoveryMessage(error instanceof Error ? error.message : 'Ошибка при запросе смены пароля');
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordMessage('');
    
    try {
      await authService.confirmPasswordRecovery(recoveryCode);
      setIsCodeConfirmed(true);
      setUpdatePasswordMessage('Код подтвержден. Теперь введите новый пароль');
    } catch (error) {
      setUpdatePasswordMessage(error instanceof Error ? error.message : 'Ошибка при подтверждении кода');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordMessage('');
    
    try {
      await authService.updatePassword(newPassword, recoveryCode);
      setUpdatePasswordMessage('Пароль успешно изменен');
      setShowPasswordForm(false);
      setRecoveryCode('');
      setNewPassword('');
      setIsCodeConfirmed(false);
    } catch (error) {
      setUpdatePasswordMessage(error instanceof Error ? error.message : 'Ошибка при обновлении пароля');
    }
  };

  if (!isLoggedIn) {
    return <AuthForm onLoginSuccess={() => setIsLoggedIn(true)} />;
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
                      <div className="mt-1 text-sm text-gray-900">{userData.login}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-sm text-gray-900">{userData.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID пользователя</label>
                      <div className="mt-1 text-sm text-gray-900">{userData.userId}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Безопасность</h3>
                  <div className="mt-4">
                    {!showPasswordForm ? (
                      <button
                        onClick={handlePasswordRecovery}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Key className="h-5 w-5 mr-2" />
                        Сменить пароль
                      </button>
                    ) : (
                      <form onSubmit={isCodeConfirmed ? handleUpdatePassword : handleConfirmCode} className="space-y-4">
                        {!isCodeConfirmed ? (
                          <div>
                            <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700">
                              Код восстановления
                            </label>
                            <input
                              type="text"
                              id="recoveryCode"
                              value={recoveryCode}
                              onChange={(e) => setRecoveryCode(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Введите код из письма"
                              required
                            />
                          </div>
                        ) : (
                          <PasswordInput
                            id="newPassword"
                            value={newPassword}
                            onChange={setNewPassword}
                            label="Новый пароль"
                            placeholder="Введите новый пароль"
                          />
                        )}
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Key className="h-5 w-5 mr-2" />
                            {isCodeConfirmed ? 'Обновить пароль' : 'Подтвердить код'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setRecoveryCode('');
                              setNewPassword('');
                              setUpdatePasswordMessage('');
                              setIsCodeConfirmed(false);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    )}
                    {(passwordRecoveryMessage || updatePasswordMessage) && (
                      <p className={`mt-2 text-sm ${
                        (passwordRecoveryMessage.includes('отправлены') || updatePasswordMessage.includes('успешно') || updatePasswordMessage.includes('подтвержден')) 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {passwordRecoveryMessage || updatePasswordMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="divide-y divide-gray-200">
              {error && (
                <div className="p-6 text-red-600">
                  {error}
                </div>
              )}
              {devices.length > 0 && (
                <div className="p-6">
                  <button
                    onClick={handleDeleteAllDevices}
                    disabled={isDeletingAll}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    {isDeletingAll ? 'Удаление...' : 'Удалить все устройства, кроме текущего'}
                  </button>
                </div>
              )}
              {devices.length === 0 && !error && (
                <div className="p-6 text-gray-500 text-center">
                  Устройства не найдены
                </div>
              )}
              {devices.map((device) => (
                <div key={device.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <Smartphone className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{device.deviceName}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>IP: {device.ip}</span>
                        <span>•</span>
                        <span>Последняя активность: {formatDate(device.issuedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={isDeleting === device.id}
                      className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md transition-colors"
                      title="Удалить устройство"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
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
        </div>
      </main>
    </div>
  );
}