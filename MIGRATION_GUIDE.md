# 🔄 Migration Guide: Old Design → Grand Design

## Quick Class Name Mapping

### Cards
```diff
- <div className="main-card">
+ <div className="grand-card">
```

### Buttons
```diff
- <button className="btn btn-primary">
+ <button className="grand-btn grand-btn-primary">

- <button className="btn btn-secondary">
+ <button className="grand-btn grand-btn-glass">
```

### Input Fields
```diff
- <input className="input-field" />
+ <input className="grand-input" />
```

### Progress Bars
```diff
- <div className="progress-bar-modern">
-   <div className="progress-fill-modern" style={{width: '75%'}} />
- </div>
+ <div className="grand-progress-bar">
+   <div className="grand-progress-fill" style={{width: '75%'}} />
+ </div>
```

### Tabs
```diff
- <div className="tab-nav-modern">
-   <button className="tab-button-modern active">
+ <div className="grand-tabs">
+   <button className="grand-tab active">
```

### Video Cards
```diff
- <div className="video-card-modern">
+ <div className="grand-video-card">
```

### Stats Cards
```diff
- <div className="stat-card-modern">
+ <div className="grand-stat-card">
```

### Badges
```diff
- <span className="badge-modern success">
+ <span className="grand-badge grand-badge-success">
```

## Step-by-Step Migration

### Step 1: Update Container
```tsx
// In App.tsx
<div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
  <div className="container">
    {/* Your content */}
  </div>
</div>
```

### Step 2: Update Header
```tsx
<div className="grand-header">
  <div className="grand-logo">
    <span className="grand-logo-icon">🎥</span>
    YT Downloader Pro
  </div>
  <button 
    className="grand-btn grand-btn-glass"
    onClick={() => setDarkMode(!darkMode)}
  >
    {darkMode ? '☀️' : '🌙'} Theme
  </button>
</div>
```

### Step 3: Update Tabs
```tsx
<div className="grand-tabs">
  <button 
    className={`grand-tab ${activeTab === 'single' ? 'active' : ''}`}
    onClick={() => setActiveTab('single')}
  >
    <Download className="grand-tab-icon" size={18} />
    <span className="grand-tab-text">Single</span>
  </button>
  {/* More tabs... */}
</div>
```

### Step 4: Update Form Inputs
```tsx
<div className="grand-input-group grand-input-icon">
  <label className="grand-input-label">YouTube URL</label>
  <Link className="grand-input-icon-left" size={20} />
  <input
    type="url"
    className="grand-input"
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder="https://www.youtube.com/watch?v=..."
  />
</div>
```

### Step 5: Update Buttons
```tsx
<button 
  className="grand-btn grand-btn-primary"
  onClick={handleDownload}
  disabled={loading}
>
  <Download size={18} />
  Download
</button>
```

### Step 6: Update Progress Bars
```tsx
<div className="grand-progress-container">
  <div className="grand-progress-header">
    <span className="grand-progress-percentage">
      {download.progress}%
    </span>
    <span className="grand-progress-status">
      Downloading...
    </span>
  </div>
  <div className="grand-progress-bar">
    <div 
      className="grand-progress-fill" 
      style={{width: `${download.progress}%`}}
    />
  </div>
</div>
```

### Step 7: Update Stats Cards
```tsx
<div className="grand-stats-grid">
  <div className="grand-stat-card">
    <div className="grand-stat-icon">📊</div>
    <div className="grand-stat-value">{totalDownloads}</div>
    <div className="grand-stat-label">Total Downloads</div>
  </div>
  {/* More stats... */}
</div>
```

### Step 8: Update Download Items
```tsx
<div className="grand-download-item">
  <div className="grand-download-header">
    <img 
      src={download.thumbnail} 
      className="grand-download-thumbnail"
      alt={download.title}
    />
    <div className="grand-download-info">
      <h4 className="grand-download-title">{download.title}</h4>
      <div className="grand-download-meta">
        <span className="grand-download-meta-item">
          📁 {download.type}
        </span>
        <span className="grand-download-meta-item">
          🎬 {download.quality}
        </span>
      </div>
    </div>
  </div>
  {/* Progress bar here */}
</div>
```

## Complete Example Component

```tsx
import React, { useState } from 'react';
import { Download, Search, Play } from 'lucide-react';

export default function GrandApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [url, setUrl] = useState('');

  return (
    <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
      <div className="container">
        
        {/* Header */}
        <div className="grand-header">
          <div className="grand-logo">
            <span className="grand-logo-icon">🎥</span>
            YT Downloader Pro
          </div>
          <button 
            className="grand-btn grand-btn-glass"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Tabs */}
        <div className="grand-tabs">
          <button 
            className={`grand-tab ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <Download className="grand-tab-icon" size={18} />
            <span className="grand-tab-text">Download</span>
          </button>
          <button 
            className={`grand-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="grand-tab-icon" size={18} />
            <span className="grand-tab-text">Search</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grand-card">
          <div className="grand-section-header">
            <div className="grand-section-icon">
              <Download size={24} />
            </div>
            <h2 className="grand-section-title">Download Video</h2>
          </div>

          <div className="grand-input-group grand-input-icon">
            <label className="grand-input-label">YouTube URL</label>
            <span className="grand-input-icon-left">🔗</span>
            <input
              type="url"
              className="grand-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <button className="grand-btn grand-btn-primary grand-w-full">
            <Download size={18} />
            Start Download
          </button>
        </div>

        {/* Stats */}
        <div className="grand-stats-grid">
          <div className="grand-stat-card">
            <div className="grand-stat-icon">📊</div>
            <div className="grand-stat-value">1,234</div>
            <div className="grand-stat-label">Total Downloads</div>
          </div>
          <div className="grand-stat-card">
            <div className="grand-stat-icon">✅</div>
            <div className="grand-stat-value">98%</div>
            <div className="grand-stat-label">Success Rate</div>
          </div>
        </div>

      </div>
    </div>
  );
}
```

## Testing Checklist

- [ ] All buttons have proper hover effects
- [ ] Cards have glass effect and shadows
- [ ] Progress bars animate smoothly
- [ ] Tabs switch correctly
- [ ] Dark mode toggles properly
- [ ] Mobile responsive layout works
- [ ] All icons display correctly
- [ ] Focus states are visible
- [ ] Animations are smooth

## Troubleshooting

### Issue: Styles not applying
**Solution**: Make sure `grand-design.css` is imported in `index.css`

### Issue: Dark mode not working
**Solution**: Check `data-theme` attribute on root element

### Issue: Animations too fast/slow
**Solution**: Adjust transition duration in CSS variables

### Issue: Colors don't match
**Solution**: Override CSS variables in your custom CSS

## Pro Tips

1. **Use Flexbox Utilities**: `grand-flex`, `grand-flex-center`, `grand-flex-between`
2. **Apply Spacing**: `grand-gap-4`, `grand-mb-6`, `grand-p-8`
3. **Add Hover Effects**: `grand-hover-lift`, `grand-hover-scale`
4. **Combine Classes**: Mix grand classes with your custom ones
5. **Test Dark Mode**: Always test both themes

---

**Happy migrating! Your app will look amazing! ✨**
