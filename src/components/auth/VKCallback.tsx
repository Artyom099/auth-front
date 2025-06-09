import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vkAuthService } from '../../services/vkAuthService';
import { authService } from '../../services/authService';

export function VKCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError(`Ошибка авторизации: ${error}`);
        return;
      }

      if (!code || !state) {
        setError('Отсутствуют необходимые параметры');
        return;
      }

      try {
        // Обмениваем код на токен
        const tokenData = await vkAuthService.handleCallback(code, state);
        
        // Получаем информацию о пользователе
        const userInfo = await vkAuthService.getUserInfo(tokenData.access_token, tokenData.user_id);

        // Регистрируем или авторизуем пользователя в нашем приложении
        try {
          // Пробуем авторизоваться
          await authService.login(userInfo.response[0].email, tokenData.access_token);
        } catch (loginError) {
          // Если не получилось, пробуем зарегистрировать
          await authService.registration(
            userInfo.response[0].first_name,
            userInfo.response[0].email,
            tokenData.access_token
          );
        }

        // Перенаправляем на дашборд
        navigate('/dashboard');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Произошла ошибка при авторизации');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Ошибка авторизации</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Авторизация</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-white">Пожалуйста, подождите...</p>
        </div>
      </div>
    </div>
  );
} 