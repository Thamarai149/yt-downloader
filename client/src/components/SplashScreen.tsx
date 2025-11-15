import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        zIndex: 10000
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎥</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
          YT Downloader Pro
        </h1>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--color-border)',
          borderTop: '4px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
          Loading...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
