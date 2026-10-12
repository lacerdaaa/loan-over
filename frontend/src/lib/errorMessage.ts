import { isAxiosError } from 'axios';

const FALLBACK_MESSAGE = 'Algo deu errado. Tente novamente.';

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('; ');
    if (message) return message;
  }
  return FALLBACK_MESSAGE;
};
