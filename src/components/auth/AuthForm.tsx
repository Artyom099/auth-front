import React, { useState } from 'react';
import { UserPlus, LogIn, User, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import { vkAuthService } from '../../services/vkAuthService';
import { yandexAuthService } from '../../services/yandexAuthService';
import { RegistrationConfirmation } from './RegistrationConfirmation';

interface AuthFormProps {
  onLoginSuccess: (userData: any) => void;
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
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

export function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const [isRegistration, setIsRegistration] = useState(false);
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    verificationCode: ''
  });

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (isRegistration) {
        await authService.registration(formData.login, formData.email, formData.password);
        setShowConfirmation(true);
      } else {
        await handleLogin(e);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при авторизации');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(formData.email, formData.password);
      // После успешного логина получаем данные пользователя
      const userData = await authService.getMe();
      onLoginSuccess(userData.payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation) {
    return <RegistrationConfirmation />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendCode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEmailSent(true);
    console.log('Код отправлен на:', formData.email);
  };

  const handleVKLogin = async () => {
    try {
      const authUrl = await vkAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при авторизации через ВКонтакте');
    }
  };

  const handleYandexLogin = () => {
    try {
      yandexAuthService.login();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при авторизации через Яндекс');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center">
          {isRegistration ? (
            <UserPlus className="mx-auto h-12 w-12 text-gray-700 dark:text-white" />
          ) : (
            <User className="mx-auto h-12 w-12 text-gray-700 dark:text-white" />
          )}
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {isRegistration ? 'Регистрация' : 'Вход'}
          </h2>
        </div>

        {/* iOS-style Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !isRegistration
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white'
              }`}
              onClick={() => setIsRegistration(false)}
            >
              Вход
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isRegistration
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white'
              }`}
              onClick={() => setIsRegistration(true)}
            >
              Регистрация
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-white">или войдите через</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleYandexLogin}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FC3F1D] hover:bg-[#E6351A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FC3F1D] transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Яндекс
          </button>

          <button
            onClick={handleVKLogin}
            disabled
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-white cursor-not-allowed"
          >
            <LogIn className="h-5 w-5" />
            ВКонтакте
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-white">или заполните форму</span>
          </div>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-white px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-white px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          <div className="space-y-4">
            {isRegistration && (
              <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-white">
                  Логин
                </label>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-transparent"
                  placeholder="example-login"
                  value={formData.login}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-transparent"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              label="Пароль"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isRegistration ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}