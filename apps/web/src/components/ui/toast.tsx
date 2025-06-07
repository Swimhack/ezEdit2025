import React, { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastVariant = 'default' | 'destructive' | 'success';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
  dismiss: (id?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

type ToastItemProps = ToastProps & {
  id: string;
  onClose: () => void;
};

function ToastItem({
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform translate-x-0',
        variant === 'destructive' && 'bg-red-50 border-red-100 ring-red-300',
        variant === 'success' && 'bg-green-50 border-green-100 ring-green-300'
      )}
    >
      <div className="flex-1 w-0 p-4">
        {title && (
          <div
            className={cn(
              'text-sm font-medium text-slate-900',
              variant === 'destructive' && 'text-red-800',
              variant === 'success' && 'text-green-800'
            )}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            className={cn(
              'mt-1 text-sm text-slate-500',
              variant === 'destructive' && 'text-red-700',
              variant === 'success' && 'text-green-700'
            )}
          >
            {description}
          </div>
        )}
      </div>
      <div className="flex">
        <button
          onClick={onClose}
          className={cn(
            'w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
            variant === 'destructive' &&
              'text-red-400 hover:text-red-500 focus:ring-red-500',
            variant === 'success' &&
              'text-green-400 hover:text-green-500 focus:ring-green-500'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...props, id }]);
  };

  const dismiss = (id?: string) => {
    setToasts((prevToasts) =>
      id
        ? prevToasts.filter((toast) => toast.id !== id)
        : prevToasts.slice(0, -1)
    );
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Export a simplified version for import as a function
export const toast = (props: ToastProps) => {
  try {
    const { toast } = useToast();
    toast(props);
  } catch (error) {
    console.error('Toast used outside of ToastProvider:', error);
  }
};
