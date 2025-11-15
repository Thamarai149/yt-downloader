import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        padding: '0.75rem',
        textAlign: 'center',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <WifiOff size={20} />
      <span style={{ fontWeight: 500 }}>
        You are currently offline. Some features may be unavailable.
      </span>
    </div>
  );
};

export default OfflineBanner;
