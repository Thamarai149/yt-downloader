import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Search, 
  List, 
  History, 
  Play, 
  Calendar, 
  BarChart3, 
  PlaySquare, 
  CreditCard, 
  Settings 
} from 'lucide-react';
import { TabType } from '../types';

interface MobileNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeDownloads: number;
  showMenu: boolean;
  onCloseMenu: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  activeDownloads,
  showMenu,
  onCloseMenu
}) => {
  const tabs = [
    { id: 'single' as TabType, label: 'Single Download', icon: <Download className="w-5 h-5" /> },
    { id: 'batch' as TabType, label: 'Batch Download', icon: <List className="w-5 h-5" /> },
    { id: 'playlist' as TabType, label: 'Playlist', icon: <PlaySquare className="w-5 h-5" /> },
    { id: 'search' as TabType, label: 'Search', icon: <Search className="w-5 h-5" /> },
    { id: 'scheduler' as TabType, label: 'Scheduler', icon: <Calendar className="w-5 h-5" /> },
    { id: 'queue' as TabType, label: `Queue (${activeDownloads})`, icon: <Play className="w-5 h-5" /> },
    { id: 'history' as TabType, label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'balances' as TabType, label: 'Balances', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'analytics' as TabType, label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings' as TabType, label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const handleTabClick = (tabId: TabType) => {
    onTabChange(tabId);
    onCloseMenu();
  };

  return (
    <>
      {/* Mobile Tab Bar (Bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mobile-tabs bg-white/95 backdrop-blur-20 border-t border-white/20 p-2">
          <div className="flex justify-around">
            {tabs.slice(0, 5).map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabClick(tab.id)}
                className={`mobile-tab flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-5 h-5">
                  {tab.icon}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {tab.label.split(' ')[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Slide Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onCloseMenu}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-20 border-r border-white/20 z-50 lg:hidden safe-area-top"
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4 gradient-text">Navigation</h2>
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                      {tab.id === 'queue' && activeDownloads > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {activeDownloads}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Tabs (Hidden on mobile) */}
      <div className="hidden lg:flex space-x-1 mb-6 bg-gray-200 rounded-lg p-1">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>
    </>
  );
};