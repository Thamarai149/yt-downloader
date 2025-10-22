import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Folder, FileText, Video, Zap, Shield } from 'lucide-react';
import { Button } from './Button';

interface AdvancedSettingsProps {
  onSettingsChange: (settings: AdvancedSettings) => void;
}

export interface AdvancedSettings {
  outputPath: string;
  filenameTemplate: string;
  audioCodec: string;
  videoCodec: string;
  audioBitrate: string;
  videoBitrate: string;
  subtitles: boolean;
  thumbnail: boolean;
  metadata: boolean;
  playlistReverse: boolean;
  playlistStart: number;
  playlistEnd: number;
  rateLimit: string;
  retries: number;
  proxy: string;
  cookies: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<AdvancedSettings>({
    outputPath: './downloads',
    filenameTemplate: '%(title)s.%(ext)s',
    audioCodec: 'mp3',
    videoCodec: 'mp4',
    audioBitrate: '192',
    videoBitrate: 'auto',
    subtitles: false,
    thumbnail: true,
    metadata: true,
    playlistReverse: false,
    playlistStart: 1,
    playlistEnd: 0,
    rateLimit: '',
    retries: 3,
    proxy: '',
    cookies: false
  });

  const [activeTab, setActiveTab] = useState<'output' | 'quality' | 'playlist' | 'network'>('output');

  const updateSetting = <K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings: AdvancedSettings = {
      outputPath: './downloads',
      filenameTemplate: '%(title)s.%(ext)s',
      audioCodec: 'mp3',
      videoCodec: 'mp4',
      audioBitrate: '192',
      videoBitrate: 'auto',
      subtitles: false,
      thumbnail: true,
      metadata: true,
      playlistReverse: false,
      playlistStart: 1,
      playlistEnd: 0,
      rateLimit: '',
      retries: 3,
      proxy: '',
      cookies: false
    };
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const tabs = [
    { id: 'output' as const, label: 'Output', icon: <Folder className="w-4 h-4" /> },
    { id: 'quality' as const, label: 'Quality', icon: <Video className="w-4 h-4" /> },
    { id: 'playlist' as const, label: 'Playlist', icon: <FileText className="w-4 h-4" /> },
    { id: 'network' as const, label: 'Network', icon: <Zap className="w-4 h-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Advanced Settings
        </h3>
        <Button size="sm" variant="secondary" onClick={resetToDefaults}>
          Reset Defaults
        </Button>
      </div>

      {/* Settings Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {activeTab === 'output' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📁 Output Directory
              </label>
              <input
                type="text"
                value={settings.outputPath}
                onChange={(e) => updateSetting('outputPath', e.target.value)}
                className="input-field"
                placeholder="./downloads"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Filename Template
              </label>
              <input
                type="text"
                value={settings.filenameTemplate}
                onChange={(e) => updateSetting('filenameTemplate', e.target.value)}
                className="input-field"
                placeholder="%(title)s.%(ext)s"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: %(title)s, %(uploader)s, %(upload_date)s, %(duration)s, %(id)s
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.subtitles}
                  onChange={(e) => updateSetting('subtitles', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">📄 Download Subtitles</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.thumbnail}
                  onChange={(e) => updateSetting('thumbnail', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">🖼️ Save Thumbnail</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.metadata}
                  onChange={(e) => updateSetting('metadata', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">📊 Embed Metadata</span>
              </label>
            </div>
          </motion.div>
        )}

        {activeTab === 'quality' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎵 Audio Codec
                </label>
                <select
                  value={settings.audioCodec}
                  onChange={(e) => updateSetting('audioCodec', e.target.value)}
                  className="select-field"
                >
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                  <option value="flac">FLAC</option>
                  <option value="wav">WAV</option>
                  <option value="ogg">OGG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📺 Video Codec
                </label>
                <select
                  value={settings.videoCodec}
                  onChange={(e) => updateSetting('videoCodec', e.target.value)}
                  className="select-field"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="mkv">MKV</option>
                  <option value="avi">AVI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎵 Audio Bitrate (kbps)
                </label>
                <select
                  value={settings.audioBitrate}
                  onChange={(e) => updateSetting('audioBitrate', e.target.value)}
                  className="select-field"
                >
                  <option value="128">128 kbps</option>
                  <option value="192">192 kbps</option>
                  <option value="256">256 kbps</option>
                  <option value="320">320 kbps</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📺 Video Bitrate
                </label>
                <select
                  value={settings.videoBitrate}
                  onChange={(e) => updateSetting('videoBitrate', e.target.value)}
                  className="select-field"
                >
                  <option value="auto">Auto</option>
                  <option value="1000">1 Mbps</option>
                  <option value="2000">2 Mbps</option>
                  <option value="5000">5 Mbps</option>
                  <option value="10000">10 Mbps</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'playlist' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ▶️ Start from video #
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.playlistStart}
                  onChange={(e) => updateSetting('playlistStart', parseInt(e.target.value) || 1)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏹️ End at video # (0 = all)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.playlistEnd}
                  onChange={(e) => updateSetting('playlistEnd', parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.playlistReverse}
                onChange={(e) => updateSetting('playlistReverse', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">🔄 Download in reverse order</span>
            </label>
          </motion.div>
        )}

        {activeTab === 'network' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚀 Rate Limit (KB/s)
                </label>
                <input
                  type="text"
                  value={settings.rateLimit}
                  onChange={(e) => updateSetting('rateLimit', e.target.value)}
                  className="input-field"
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔄 Retry Attempts
                </label>
                <select
                  value={settings.retries}
                  onChange={(e) => updateSetting('retries', parseInt(e.target.value))}
                  className="select-field"
                >
                  <option value="1">1</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌐 Proxy Server (optional)
              </label>
              <input
                type="text"
                value={settings.proxy}
                onChange={(e) => updateSetting('proxy', e.target.value)}
                className="input-field"
                placeholder="http://proxy.example.com:8080"
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.cookies}
                onChange={(e) => updateSetting('cookies', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Use browser cookies for authentication
              </span>
            </label>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};