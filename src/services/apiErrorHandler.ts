import axios, { AxiosError } from 'axios';

export function handleApiError(error: unknown, defaultMessage: string): never {
  if (axios.isAxiosError(error)) {
    const message = error.response?.status === 403
      ? 'Доступ ограничен'
      : error.response?.data?.message || defaultMessage;
    const err = new Error(message) as Error & { response?: AxiosError['response'] };
    err.response = error.response;
    throw err;
  }
  throw error;
}
