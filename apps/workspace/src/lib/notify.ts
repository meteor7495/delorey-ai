import { toast } from '@/hooks/use-toast';

export function getErrorMessage(err: unknown, fallback = 'خطایی رخ داد') {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

type NotifyOptions = {
  description?: string;
};

export function toastSuccess(title: string, options?: NotifyOptions) {
  return toast({
    title,
    description: options?.description,
    variant: 'success',
  });
}

export function toastError(title: string, options?: NotifyOptions) {
  return toast({
    title,
    description: options?.description,
    variant: 'destructive',
  });
}

export function toastWarning(title: string, options?: NotifyOptions) {
  return toast({
    title,
    description: options?.description,
    variant: 'warning',
  });
}

export function toastInfo(title: string, options?: NotifyOptions) {
  return toast({
    title,
    description: options?.description,
    variant: 'default',
  });
}

/** Show an error toast from a caught unknown value. */
export function toastFromError(err: unknown, fallback = 'خطایی رخ داد') {
  return toastError(getErrorMessage(err, fallback));
}
