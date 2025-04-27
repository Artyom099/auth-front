import React, { useState, useEffect } from 'react';
import { Smartphone, Apple as Apps, ChevronRight, LogOut, Shield, Globe, User } from 'lucide-react';
import { AuthForm } from '../auth/AuthForm';
import { mockUserData } from '../../data/mockData';
import { authService } from '../../services/authService';

interface UserData {
  id: string;
  login: string;
  email: string;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (userData: UserData) => {
    setUserData(userData);
    setIsLoggedIn(true);
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
        console.log('User data response:', response);
        if (response.payload) {
          setUserData({
            id: response.payload.id,
            login: response.payload.login,
            email: response.payload.email
          });
          setIsLoggedIn(true);
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

    checkAuth();
  }, []);

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
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="divide-y divide-gray-200">
              {mockUserData.devices.map((device) => (
                <div key={device.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <Smartphone className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{device.type}</span>
                        <span>•</span>
                        <span>Последняя активность: {device.lastActive}</span>
                        <span>•</span>
                        <span>{device.location}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
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