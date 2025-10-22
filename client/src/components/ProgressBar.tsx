import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'from-indigo-500 via-pink-500 to-teal-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-orange-500 to-amber-500',
    error: 'from-red-500 to-rose-500'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="progress-bar-modern">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`progress-fill-modern bg-gradient-to-r ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};
