import { useSyncExternalStore } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
}

const DISMISS_AFTER_MS = 5000;

let toasts: ToastMessage[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const dismissToast = (id: number) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

export const showErrorToast = (text: string) => {
  const id = nextId++;
  toasts = [...toasts, { id, text }];
  emit();
  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts);
