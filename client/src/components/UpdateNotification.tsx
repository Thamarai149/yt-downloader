import React, { useEffect, useState } from 'react';
import { useIsElectron } from '../hooks/useElectron';
import { Download, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate?: string;
}

interface UpdateNotificationProps {
  onClose?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const isElectron = useIsElectron();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    
    const electron = (window as any).electron;
    if (!electron) return;

    // Listen for update available
    const handleUpdateAvailable = (data: UpdateInfo) => {
      console.log('Update available:', data);
      setUpdateInfo(data);
      setUpdateAvailable(true);
      setError(null);
    };

    // Listen for update downloaded
    const handleUpdateDownloaded = (data: UpdateInfo) => {
      console.log('Update downloaded:', data);
      setDownloading(false);
      setUpdateDownloaded(true);
      setError(null);
    };

    // Listen for update status
    const handleUpdateStatus = (statusData: any) => {
      console.log('Update status:', statusData);
      
      if (statusData.status === 'downloading' && statusData.data) {
        setDownloading(true);
        setDownloadProgress(Math.round(statusData.data.percent || 0));
        
        // Calculate download speed
        if (statusData.data.bytesPerSecond) {
          const speedMB = (statusData.data.bytesPerSecond / (1024 * 1024)).toFixed(2);
          setDownloadSpeed(`${speedMB} MB/s`);
        }
      } else if (statusData.status === 'error') {
        setError(statusData.data?.error || 'Update failed');
        setDownloading(false);
      } else if (statusData.status === 'checking') {
        setError(null);
      }
    };

    electron.updates.onUpdateAvailable(handleUpdateAvailable);
    electron.updates.onUpdateDownloaded(handleUpdateDownloaded);
    electron.updates.onStatus(handleUpdateStatus);

    // Cleanup listeners on unmount
    return () => {
      electron.updates.removeUpdateAvailableListener(handleUpdateAvailable);
      electron.updates.removeUpdateDownloadedListener(handleUpdateDownloaded);
      electron.updates.removeStatusListener(handleUpdateStatus);
    };
  }, [isElectron]);

  const handleDownload = async () => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      setDownloading(true);
      setError(null);
      const result = await electron.updates.downloadUpdate();
      
      if (!result.success) {
        setError(result.error || 'Failed to download update');
        setDownloading(false);
      }
    } catch (err) {
      console.error('Failed to download update:', err);
      setError('Failed to download update');
      setDownloading(false);
    }
  };

  const handleInstall = async () => {
    const electron = (window as any).electron;
    if (!electron) return;

    try {
      await electron.updates.installUpdate();
    } catch (err) {
      console.error('Failed to install update:', err);
      setError('Failed to install update');
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setUpdateDownloaded(false);
    setError(null);
    setShowReleaseNotes(false);
    if (onClose) onClose();
  };

  const formatReleaseNotes = (notes: string): string[] => {
    if (!notes) return [];
    // Split by newlines and filter empty lines
    return notes.split('\n').filter(line => line.trim().length > 0);
  };

  if (!isElectron) return null;

  // Show update downloaded notification with restart prompt
  if (updateDownloaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-in">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-2xl p-5 border border-green-400">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6" />
                <h3 className="font-bold text-xl">Update Ready!</h3>
              </div>
              <p className="text-sm mb-1 text-green-50">
                Version {updateInfo?.version} has been downloaded successfully.
              </p>
              <p className="text-xs mb-4 text-green-100">
                The application will restart to complete the installation.
              </p>
              
              {/* Restart Prompt */}
              <div className="bg-white/10 rounded-lg p-3 mb-4 backdrop-blur-sm">
                <p className="text-sm font-medium mb-2">Ready to install?</p>
                <p className="text-xs text-green-50">
                  Your current session will be saved. The update will take less than a minute.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restart Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 text-white hover:text-green-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show downloading progress with enhanced UI
  if (downloading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-in">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-2xl p-5 border border-blue-400">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 animate-bounce" />
                <h3 className="font-bold text-lg">Downloading Update</h3>
              </div>
              <p className="text-sm mb-3 text-blue-50">Version {updateInfo?.version}</p>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-blue-700/50 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-white to-blue-100 h-3 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${downloadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold">{downloadProgress}% complete</span>
                  {downloadSpeed && (
                    <span className="text-blue-100">{downloadSpeed}</span>
                  )}
                </div>
              </div>

              {/* Download Info */}
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-blue-50">
                  Please wait while the update is being downloaded. You can continue using the application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show update available notification with enhanced release notes
  if (updateAvailable && updateInfo) {
    const releaseNotesList = formatReleaseNotes(updateInfo.releaseNotes);
    
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Update Available
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Version {updateInfo.version}
                  </p>
                </div>
              </div>

              {updateInfo.releaseDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </p>
              )}

              {/* Release Notes Section */}
              {updateInfo.releaseNotes && releaseNotesList.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-1"
                  >
                    {showReleaseNotes ? '▼' : '▶'} What's new
                  </button>
                  
                  {showReleaseNotes && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {releaseNotesList.map((note, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Later
                </button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                The update will download in the background. You'll be notified when it's ready to install.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
