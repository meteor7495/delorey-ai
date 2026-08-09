'use client';

import { useToast } from '@/hooks/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4500} swipeDirection="left">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1 text-start">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="left-auto right-0 sm:flex-col" />
    </ToastProvider>
  );
}
