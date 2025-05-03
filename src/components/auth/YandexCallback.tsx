import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { yandexAuthService } from '../../services/yandexAuthService';
import { authService } from '../../services/authService';

export function YandexCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Получаем код авторизации из URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log({ code });
        
        if (!code) {
          throw new Error('Код авторизации не получен');
        }

        // Обрабатываем код и получаем токены
        await yandexAuthService.handleCallback(code);
        
        // После получения токенов запрашиваем данные пользователя
        const userData = await authService.getMe();
        
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