import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authService } from '../../services/authService';

interface PasswordRecoveryModalProps {
  onClose: () => void;
}

export function PasswordRecoveryModal({ onClose }: PasswordRecoveryModalProps) {
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.confirmPasswordRecovery(code);
      setStep('password');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при подтверждении кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.updatePassword(newPassword, code);
      setSuccess('Пароль успешно обновлен');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при обновлении пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'code' ? 'Подтверждение кода' : 'Новый пароль'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-white rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-white rounded-md">
            {success}
          </div>
        )}

        {step === 'code' ? (
          <form onSubmit={handleConfirmCode}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Код подтверждения
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите код из письма"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Подтверждение...' : 'Подтвердить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Обновление...' : 'Обновить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 