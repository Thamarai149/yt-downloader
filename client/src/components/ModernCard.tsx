import React from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  gradient = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`main-card ${hover ? 'hover-lift-modern' : ''} ${gradient ? 'glow-effect' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-indigo-500 to-indigo-600',
    secondary: 'from-pink-500 to-pink-600',
    accent: 'from-teal-500 to-teal-600',
    success: 'from-green-500 to-green-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="stat-card-modern"
    >
      <div className={`stat-icon bg-gradient-to-br ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="stat-value-modern">{value}</div>
      <div className="stat-label-modern">{label}</div>
    </motion.div>
  );
};
