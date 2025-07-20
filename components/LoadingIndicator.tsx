import React from 'react';
import { Spinner } from './UIElements';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = "Loading, please wait...", size = 'md' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-6">
      <Spinner size={size} />
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 font-medium">{message}</p>
    </div>
  );
};

export default LoadingIndicator;