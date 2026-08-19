import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

const EXIT_DURATION_MS = 200;

/** Signal-based toast queue; consume via the `Toast` component mounted once per app. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this.show(message, 'error', duration);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    setTimeout(() => {
      this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }, EXIT_DURATION_MS);
  }

  private show(message: string, variant: ToastVariant, duration: number): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, message, variant, leaving: false }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
