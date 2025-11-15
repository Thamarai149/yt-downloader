/**
 * Settings Component
 * Provides UI for managing application settings
 */

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Folder, Save, RotateCcw, Download, Bell, Palette, Zap } from 'lucide-react';
import { useSettings, useFileOperations, useIsElectron } from '../hooks/useElectron';
import { UpdateSettings } from './UpdateSettings';

interface SettingsProps {
  onClose?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const isElectron = useIsElectron();
  const { settings, loading, error, saveSettings, resetSettings } = useSettings();
  const { selectFolder } = useFileOperations();

  // Local state for form
  const [formData, setFormData] = useState(settings || {});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'general' | 'downloads' | 'notifications' | 'advanced'>('general');

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Handle input changes
  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Handle folder selection
  const handleSelectFolder = async () => {
    const folder = await selectFolder();
    if (folder) {
      handleChange('downloadPath', folder);
    }
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('');
    
    try {
      const success = await saveSettings(formData);
      if (success) {
        setSaveStatus('Settings saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to save settings');
      }
    } catch (err) {
      setSaveStatus('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSaving(true);
      try {
        const success = await resetSettings();
        if (success) {
          setSaveStatus('Settings reset to defaults');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } catch (err) {
        setSaveStatus('Error resetting settings');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="grand-card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="icon-spin text-4xl">⏳</div>
          <span className="ml-3">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grand-card p-6">
      <div className="section-header mb-6">
        <SettingsIcon className="w-5 h-5" />
        <h2>Settings</h2>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {saveStatus && (
        <div className={`p-3 rounded-lg mb-4 ${
          saveStatus.includes('success') || saveStatus.includes('reset')
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {saveStatus}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'general'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveSection('general')}
        >
          <Palette className="w-4 h-4 inline mr-2" />
          General
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'downloads'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveSection('downloads')}
        >
          <Download className="w-4 h-4 inline mr-2" />
          Downloads
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'notifications'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveSection('notifications')}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'advanced'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveSection('advanced')}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Advanced
        </button>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeSection === 'general' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Theme
              </label>
              <select
                value={formData.theme || 'system'}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="select-field w-full"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose your preferred color theme
              </p>
            </div>

            {isElectron && (
              <>
                {/* Close to Tray */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">
                      Minimize to System Tray
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Keep app running in system tray when closed
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.closeToTray || false}
                    onChange={(e) => handleChange('closeToTray', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>

                {/* Start on Boot */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">
                      Start on Boot
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Launch application when system starts
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.startOnBoot || false}
                    onChange={(e) => handleChange('startOnBoot', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>

                {/* Auto Check Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">
                      Auto Check for Updates
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically check for new versions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoCheckUpdates || false}
                    onChange={(e) => handleChange('autoCheckUpdates', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>

                {/* Auto Download Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">
                      Auto Download Updates
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download updates automatically in background
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoDownloadUpdates || false}
                    onChange={(e) => handleChange('autoDownloadUpdates', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Download Settings */}
        {activeSection === 'downloads' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Download Settings</h3>
            
            {/* Download Path */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Download Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.downloadPath || ''}
                  onChange={(e) => handleChange('downloadPath', e.target.value)}
                  className="grand-input flex-1"
                  placeholder="Select download folder..."
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button
                    onClick={handleSelectFolder}
                    className="grand-btn grand-btn-secondary"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Where downloaded files will be saved
              </p>
            </div>

            {/* Default Quality */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Video Quality
              </label>
              <select
                value={formData.defaultQuality || 'highest'}
                onChange={(e) => handleChange('defaultQuality', e.target.value)}
                className="select-field w-full"
              >
                <option value="highest">Highest Available</option>
                <option value="best">Best</option>
                <option value="4k">4K (2160p)</option>
                <option value="2k">2K (1440p)</option>
                <option value="1080">1080p (Full HD)</option>
                <option value="720">720p (HD)</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
                <option value="240">240p</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Default quality for video downloads
              </p>
            </div>

            {/* Default Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Download Type
              </label>
              <select
                value={formData.defaultType || 'video'}
                onChange={(e) => handleChange('defaultType', e.target.value)}
                className="select-field w-full"
              >
                <option value="video">Video</option>
                <option value="audio">Audio Only</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Default type for downloads
              </p>
            </div>

            {/* Max Concurrent Downloads */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Concurrent Downloads
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxConcurrentDownloads || 3}
                onChange={(e) => handleChange('maxConcurrentDownloads', parseInt(e.target.value))}
                className="grand-input w-full"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maximum number of simultaneous downloads (1-10)
              </p>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeSection === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
            
            {/* Show Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Enable Desktop Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show system notifications for events
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.showDesktopNotifications || false}
                onChange={(e) => handleChange('showDesktopNotifications', e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            {/* Notify on Complete */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Notify on Download Complete
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notification when download finishes
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyOnComplete || false}
                onChange={(e) => handleChange('notifyOnComplete', e.target.checked)}
                className="w-5 h-5"
                disabled={!formData.showDesktopNotifications}
              />
            </div>

            {/* Notify on Error */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium">
                  Notify on Download Error
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notification when download fails
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyOnError || false}
                onChange={(e) => handleChange('notifyOnError', e.target.checked)}
                className="w-5 h-5"
                disabled={!formData.showDesktopNotifications}
              />
            </div>

            {/* Update Settings */}
            <div className="mt-6">
              <UpdateSettings
                autoCheckUpdates={formData.autoCheckUpdates || false}
                autoDownloadUpdates={formData.autoDownloadUpdates || false}
                onSettingsChange={(updates) => {
                  Object.entries(updates).forEach(([key, value]) => {
                    handleChange(key, value);
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeSection === 'advanced' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
            
            {/* Custom yt-dlp Path */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom yt-dlp Path (Optional)
              </label>
              <input
                type="text"
                value={formData.customYtdlpPath || ''}
                onChange={(e) => handleChange('customYtdlpPath', e.target.value || null)}
                className="grand-input w-full"
                placeholder="Leave empty to use bundled version"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Path to custom yt-dlp executable
              </p>
            </div>

            {/* Custom ffmpeg Path */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom ffmpeg Path (Optional)
              </label>
              <input
                type="text"
                value={formData.customFfmpegPath || ''}
                onChange={(e) => handleChange('customFfmpegPath', e.target.value || null)}
                className="grand-input w-full"
                placeholder="Leave empty to use bundled version"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Path to custom ffmpeg executable
              </p>
            </div>

            {/* Proxy URL */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Proxy URL (Optional)
              </label>
              <input
                type="text"
                value={formData.proxyUrl || ''}
                onChange={(e) => handleChange('proxyUrl', e.target.value || null)}
                className="grand-input w-full"
                placeholder="http://proxy.example.com:8080"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                HTTP/HTTPS proxy for downloads
              </p>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-red-300 dark:border-red-700 pt-4 mt-6">
              <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-3">
                Danger Zone
              </h4>
              <button
                onClick={handleReset}
                disabled={saving}
                className="grand-btn grand-btn-secondary text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Settings
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This will reset all settings to their default values
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="grand-btn grand-btn-primary flex-1"
        >
          {saving ? (
            <>
              <div className="icon-spin mr-2">⏳</div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="grand-btn grand-btn-secondary"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
