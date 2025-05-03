import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Cookies from 'js-cookie';

export function YandexCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Получаем токены из куки
        console.log('Cookies', Cookies);
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        
        if (!accessToken) {
          throw new Error('Access token не получен');
        }

        if (!refreshToken) {
          throw new Error('Refresh token не получен');
        }

        // Сохраняем токены в localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // После сохранения токенов запрашиваем данные пользователя
        await authService.getMe();
        
        // При успешной авторизации перенаправляем на dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Ошибка при обработке callback:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="mt-2">Авторизация через Яндекс...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold text-red-600">Ошибка авторизации</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 