import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModernInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  icon,
  error,
  required = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="input-group">
      <motion.div
        initial={false}
        animate={{ scale: isFocused ? 1.02 : 1 }}
        className="relative"
      >
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          className={`input-field-modern ${icon ? 'pl-12' : ''} ${error ? 'border-red-500' : ''}`}
        />
        <motion.label
          initial={false}
          animate={{
            top: value || isFocused ? '0' : '50%',
            fontSize: value || isFocused ? '12px' : '15px',
            color: isFocused ? 'var(--primary)' : 'var(--yt-text-secondary)'
          }}
          className="floating-label"
        >
          {label} {required && '*'}
        </motion.label>
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
