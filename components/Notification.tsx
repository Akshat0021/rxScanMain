import React, { useEffect } from 'react';
import { SuccessIcon, InfoIcon, WarningIcon, CloseIcon } from './icons';

type NotificationType = 'success' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const icons: Record<NotificationType, React.ReactNode> = {
  success: <SuccessIcon className="h-6 w-6 text-green-500 dark:text-green-400" />,
  warning: <WarningIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
  info: <InfoIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
};

const colors: Record<NotificationType, string> = {
    success: 'bg-green-100/80 border-green-400/50 dark:bg-green-900/60 dark:border-green-600/50 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100/80 border-yellow-400/50 dark:bg-yellow-900/60 dark:border-yellow-600/50 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100/80 border-blue-400/50 dark:bg-blue-900/60 dark:border-blue-600/50 text-blue-800 dark:text-blue-200',
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 sm:top-20 right-4 z-50 w-full max-w-sm p-4 rounded-xl shadow-lg backdrop-blur-xl border ${colors[type]} animate-fade-in-down`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="inline-flex rounded-md text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
            <span className="sr-only">Close</span>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};