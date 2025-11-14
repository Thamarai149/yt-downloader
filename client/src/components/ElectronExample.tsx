/**
 * Example component demonstrating Electron adapter usage
 * This component shows how to use Electron features in React components
 */

import React from 'react';
import {
  useIsElectron,
  usePlatform,
  useBackendUrl,
  useSettings,
  useWindowControls,
  useFileOperations,
  useNotifications,
  useDialogs,
  useAppVersion,
} from '../hooks/useElectron';

/**
 * Example component showing Electron integration
 */
const ElectronExample: React.FC = () => {
  const isElectron = useIsElectron();
  const { platform, isWindows, isMacOS, isLinux } = usePlatform();
  const { backendUrl, loading: backendLoading } = useBackendUrl();
  const { settings, loading: settingsLoading, saveSettings } = useSettings();
  const { minimize, maximize, toggleFullscreen } = useWindowControls();
  const { selectFolder, openDownloadsFolder } = useFileOperations();
  const { showNotification, showDownloadComplete } = useNotifications();
  const { showInfo, showConfirm } = useDialogs();
  const version = useAppVersion();

  const handleSelectFolder = async () => {
    const folder = await selectFolder();
    if (folder) {
      await showInfo(`Selected folder: ${folder}`, 'Folder Selected');
    }
  };

  const handleTestNotification = async () => {
    await showNotification('Test Notification', 'This is a test notification from Electron!');
  };

  const handleTestDownloadComplete = async () => {
    await showDownloadComplete('test-video.mp4', '/path/to/downloads');
  };

  const handleConfirmTest = async () => {
    const confirmed = await showConfirm(
      'Do you want to proceed?',
      'Confirmation',
      'This is a test confirmation dialog'
    );
    await showInfo(confirmed ? 'You clicked Confirm' : 'You clicked Cancel', 'Result');
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings({
      theme: 'dark',
      showDesktopNotifications: true,
    });
    if (success) {
      await showInfo('Settings saved successfully!', 'Success');
    }
  };

  if (!isElectron) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Running in Web Mode</h2>
        <p>This application is running in a web browser. Electron features are not available.</p>
        <p>Backend URL: {backendUrl}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Electron Integration Example</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Platform Information</h2>
        <p><strong>Platform:</strong> {platform}</p>
        <p><strong>Is Windows:</strong> {isWindows ? 'Yes' : 'No'}</p>
        <p><strong>Is macOS:</strong> {isMacOS ? 'Yes' : 'No'}</p>
        <p><strong>Is Linux:</strong> {isLinux ? 'Yes' : 'No'}</p>
        <p><strong>App Version:</strong> {version}</p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Backend Information</h2>
        {backendLoading ? (
          <p>Loading backend URL...</p>
        ) : (
          <p><strong>Backend URL:</strong> {backendUrl}</p>
        )}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Settings</h2>
        {settingsLoading ? (
          <p>Loading settings...</p>
        ) : (
          <div>
            <p><strong>Theme:</strong> {settings?.theme || 'Not set'}</p>
            <p><strong>Download Path:</strong> {settings?.downloadPath || 'Not set'}</p>
            <p><strong>Notifications:</strong> {settings?.showDesktopNotifications ? 'Enabled' : 'Disabled'}</p>
            <button onClick={handleSaveSettings} style={{ marginTop: '10px' }}>
              Test Save Settings
            </button>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Window Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={minimize}>Minimize</button>
          <button onClick={maximize}>Maximize/Restore</button>
          <button onClick={toggleFullscreen}>Toggle Fullscreen</button>
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>File Operations</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleSelectFolder}>Select Folder</button>
          <button onClick={openDownloadsFolder}>Open Downloads Folder</button>
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Notifications</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleTestNotification}>Show Notification</button>
          <button onClick={handleTestDownloadComplete}>Show Download Complete</button>
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Dialogs</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleConfirmTest}>Show Confirm Dialog</button>
          <button onClick={() => showInfo('This is an info message', 'Information')}>
            Show Info Dialog
          </button>
        </div>
      </section>
    </div>
  );
};

export default ElectronExample;
