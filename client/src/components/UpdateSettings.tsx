import React, { useState, useEffect } from 'react';
import { useIsElectron } from '../hooks/useElectron';

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  progress: number;
  error: string | null;
  updateInfo: any;
  autoCheckEnabled: boolean;
  autoDownloadEnabled: boolean;
}

interface UpdateSettingsProps {
  autoCheckUpdates: boolean;
  autoDownloadUpdates: boolean;
  onSettingsChange: (settings: { autoCheckUpdates?: boolean; autoDownloadUpdates?: boolean }) => void;
}

export const UpdateSettings: React.FC<UpdateSettingsProps> = ({
  autoCheckUpdates,
  autoDownloadUpdates,
  onSettingsChange,
}) => {
  const isElectron = useIsElectron();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkMessage, setCheckMessage] = useState<string>('');

  useEffect(() => {
    if (!isElectron) return;

    // Load initial status
    loadStatus();
  }, [isElectron]);

  const loadStatus = async () => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      const currentStatus = await electron.updates.getStatus();
      setStatus(currentStatus);
    } catch (err) {
      console.error('Failed to load update status:', err);
    }
  };

  const handleCheckForUpdates = async () => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      setChecking(true);
      setCheckMessage('');
      const result = await electron.updates.checkForUpdates();
      setLastChecked(new Date());
      
      if (result.success) {
        if (result.updateInfo) {
          // Update available
          setCheckMessage(`Update available: Version ${result.updateInfo.version}`);
          console.log('Update available:', result.updateInfo);
        } else {
          // No update available
          setCheckMessage('You are using the latest version');
          console.log('No updates available');
        }
      } else {
        setCheckMessage(`Check failed: ${result.error || 'Unknown error'}`);
        console.error('Update check failed:', result.error);
      }
      
      // Reload status
      await loadStatus();
    } catch (err) {
      setCheckMessage('Failed to check for updates');
      console.error('Failed to check for updates:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleAutoCheckChange = async (enabled: boolean) => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      await electron.updates.setAutoCheck(enabled);
      onSettingsChange({ autoCheckUpdates: enabled });
      await loadStatus();
    } catch (err) {
      console.error('Failed to update auto-check setting:', err);
    }
  };

  const handleAutoDownloadChange = async (enabled: boolean) => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      await electron.updates.setAutoDownload(enabled);
      onSettingsChange({ autoDownloadUpdates: enabled });
      await loadStatus();
    } catch (err) {
      console.error('Failed to update auto-download setting:', err);
    }
  };

  if (!isElectron) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Auto-updates are only available in the desktop application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Application Updates
        </h3>

        {/* Current Status */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Update Status
            </span>
            {status?.checking && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                Checking...
              </span>
            )}
            {status?.downloading && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                Downloading {status.progress}%
              </span>
            )}
            {status?.available && !status?.downloading && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full font-medium">
                Update Available
              </span>
            )}
            {!status?.checking && !status?.downloading && !status?.available && (
              <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                Up to date
              </span>
            )}
          </div>
          
          {/* Check Message */}
          {checkMessage && (
            <div className={`mb-2 p-2 rounded ${
              checkMessage.includes('available') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : checkMessage.includes('failed') || checkMessage.includes('Failed')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            }`}>
              <p className="text-xs font-medium">{checkMessage}</p>
            </div>
          )}
          
          {/* Error Display */}
          {status?.error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{status.error}</p>
            </div>
          )}
          
          {/* Update Info */}
          {status?.updateInfo && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Version {status.updateInfo.version}</span> is available
              </p>
            </div>
          )}
          
          {/* Last Checked */}
          {lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}
        </div>

        {/* Check for Updates Button */}
        <button
          onClick={handleCheckForUpdates}
          disabled={checking || status?.checking || false}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium mb-4"
        >
          {checking || status?.checking ? 'Checking...' : 'Check for Updates'}
        </button>

        {/* Auto-check Updates Toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Automatically check for updates
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Check for updates when the application starts and periodically
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={autoCheckUpdates}
              onChange={(e) => handleAutoCheckChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Auto-download Updates Toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Automatically download updates
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Download updates in the background when available
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={autoDownloadUpdates}
              onChange={(e) => handleAutoDownloadChange(e.target.checked)}
              disabled={!autoCheckUpdates}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>

        {/* Info Text */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">How updates work:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Updates are checked automatically when enabled</li>
                <li>Downloads happen in the background</li>
                <li>You'll be notified when an update is ready</li>
                <li>Updates install when you restart the application</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
