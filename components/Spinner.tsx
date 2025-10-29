import React from 'react';

interface SpinnerProps {
  message: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-slate-300 font-semibold">{message}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400">Please wait a moment...</p>
    </div>
  );
};