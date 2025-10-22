import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from './Button';

interface MobileHeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showMenu: boolean;
  onToggleMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  showMenu,
  onToggleMenu
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mobile-header safe-area-top"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMenu}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 lg:hidden"
          >
            {showMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <h1 className="text-xl font-bold gradient-text">
            <span className="animated-icon">🎥</span> YT Downloader
          </h1>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleDarkMode}
          icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        >
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>
    </motion.div>
  );
};