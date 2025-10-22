# 🧪 Testing Guide for New Features

## Quick Test Checklist

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ npm installed
- ✅ Backend running on port 4000
- ✅ Frontend running on port 5173

---

## 🚀 Setup

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

Expected output:
```
🚀 Enhanced YT Downloader Server listening on port 4000
📋 Available endpoints:
  ...
  POST /api/download-subtitles - Download subtitles
  POST /api/download-thumbnail - Download thumbnail
  GET  /api/channel - Get channel videos
  POST /api/bulk-import - Bulk import URLs
  GET  /api/presets - Get presets
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```

Expected output:
```
VITE v6.0.1  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 Feature Tests

### Test 1: Subtitle Download ✅

**Steps:**
1. Open app → Click "Extras" tab
2. Click "Subtitles" button
3. Paste URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Select languages: EN, ES, FR
5. Click "Download Subtitles"

**Expected Result:**
- ✅ Toast: "Downloaded 3 subtitle files"
- ✅ Files saved in: `C:\Users\THAMARAISELVAN\Downloads\YT-Downloads\`
- ✅ Files named: `[title]_en_[timestamp].srt`, etc.

**Test Cases:**
- [ ] Single language download
- [ ] Multiple language download
- [ ] Invalid URL handling
- [ ] Video without subtitles

---

### Test 2: Thumbnail Download ✅

**Steps:**
1. Open app → Click "Extras" tab
2. Click "Thumbnail" button
3. Paste URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Click "Download Thumbnail"

**Expected Result:**
- ✅ Toast: "Thumbnail downloaded: [filename]"
- ✅ File saved as JPG
- ✅ High quality (1280x720 or best available)

**Test Cases:**
- [ ] Standard video thumbnail
- [ ] Short video thumbnail
- [ ] Invalid URL handling
- [ ] Network error handling

---

### Test 3: Channel Downloader ✅

**Steps:**
1. Open app → Click "Extras" tab
2. Click "Channel" button
3. Paste URL: `https://www.youtube.com/@YouTube`
4. Click "Load Channel Videos"

**Expected Result:**
- ✅ Toast: "Found X videos from [channel name]"
- ✅ Display up to 50 videos
- ✅ Show thumbnails and titles
- ✅ Scrollable list

**Test Cases:**
- [ ] Large channel (1000+ videos)
- [ ] Small channel (<10 videos)
- [ ] Invalid channel URL
- [ ] Private/restricted channel

---

### Test 4: Bulk URL Import ✅

**Steps:**
1. Open app → Click "Extras" tab
2. Click "Bulk Import" button
3. Paste URLs (one per line):
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.youtube.com/watch?v=9bZkp7q19f0
https://www.youtube.com/watch?v=kJQP7kiw5Fk
```
4. Click "Import & Queue Downloads"

**Expected Result:**
- ✅ Toast: "3 downloads queued successfully"
- ✅ All videos appear in Queue tab
- ✅ Downloads start automatically
- ✅ Progress tracking works

**Test Cases:**
- [ ] 5 URLs
- [ ] 20 URLs
- [ ] Mix of valid/invalid URLs
- [ ] Empty lines handling
- [ ] Duplicate URLs

---

### Test 5: Download Presets ✅

**Steps:**
1. Open app → Click "Extras" tab
2. Click "Presets" button
3. Enter name: "My 4K Preset"
4. Select type: Video
5. Select quality: 4K
6. Click "Create Preset"

**Expected Result:**
- ✅ Toast: "Preset created successfully"
- ✅ Preset appears in list
- ✅ Can delete preset
- ✅ Preset persists (stored in memory)

**Test Cases:**
- [ ] Create video preset
- [ ] Create audio preset
- [ ] Delete preset
- [ ] Create multiple presets
- [ ] Empty name handling

---

## 🔧 API Testing

### Test with cURL

#### 1. Download Subtitles
```bash
curl -X POST http://localhost:4000/api/download-subtitles \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","languages":["en","es"]}'
```

#### 2. Download Thumbnail
```bash
curl -X POST http://localhost:4000/api/download-thumbnail \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

#### 3. Get Channel Videos
```bash
curl "http://localhost:4000/api/channel?url=https://www.youtube.com/@YouTube&limit=10"
```

#### 4. Bulk Import
```bash
curl -X POST http://localhost:4000/api/bulk-import \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],"type":"video","quality":"1080"}'
```

#### 5. Get Presets
```bash
curl http://localhost:4000/api/presets
```

#### 6. Create Preset
```bash
curl -X POST http://localhost:4000/api/presets \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Preset","type":"video","quality":"1080"}'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to download subtitles"
**Solution:**
- Check if video has subtitles
- Try auto-generated subtitles
- Verify URL is correct

### Issue 2: "Channel videos not loading"
**Solution:**
- Ensure URL is channel URL (not video URL)
- Try channel's main page URL
- Check internet connection

### Issue 3: "Bulk import fails"
**Solution:**
- Verify URLs are valid
- Check one URL per line
- Remove extra spaces

### Issue 4: Backend not starting
**Solution:**
```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process if needed
taskkill /PID [PID] /F

# Restart backend
npm start
```

### Issue 5: Frontend not connecting
**Solution:**
- Check backend is running
- Verify VITE_BACKEND_URL in .env
- Check browser console for errors

---

## 📊 Performance Testing

### Load Test: Bulk Import
```javascript
// Test with 50 URLs
const urls = Array(50).fill(0).map((_, i) => 
  `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
);

fetch('http://localhost:4000/api/bulk-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ urls, type: 'video', quality: '720' })
});
```

**Expected:**
- ✅ All URLs queued within 30 seconds
- ✅ No server crashes
- ✅ Memory usage stable

---

## 🎯 User Acceptance Testing

### Scenario 1: Student downloading lecture subtitles
1. Find lecture video URL
2. Go to Extras → Subtitles
3. Select EN language
4. Download subtitles
5. Open SRT file in text editor

**Success Criteria:**
- ✅ Subtitles downloaded in <10 seconds
- ✅ SRT file is readable
- ✅ Timestamps are correct

### Scenario 2: Content creator archiving channel
1. Get channel URL
2. Go to Extras → Channel
3. Load channel videos
4. Review video list
5. Select videos to download

**Success Criteria:**
- ✅ All videos displayed
- ✅ Thumbnails load correctly
- ✅ Can navigate list easily

### Scenario 3: Music lover bulk downloading playlist
1. Copy playlist URLs to text file
2. Go to Extras → Bulk Import
3. Paste all URLs
4. Import and queue
5. Monitor downloads in Queue tab

**Success Criteria:**
- ✅ All URLs imported
- ✅ Downloads start automatically
- ✅ Progress tracking works
- ✅ All files downloaded successfully

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________
Version: 1.0.0

Feature: ___________
Status: [ ] Pass [ ] Fail
Notes: ___________

Issues Found:
1. ___________
2. ___________

Suggestions:
1. ___________
2. ___________
```

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All 5 features tested
- [ ] API endpoints working
- [ ] Error handling tested
- [ ] UI responsive on mobile
- [ ] Dark mode works
- [ ] Toast notifications appear
- [ ] Files saved correctly
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation complete

---

## 🎉 Success Criteria

All features are working if:
- ✅ No critical bugs
- ✅ All API endpoints respond
- ✅ UI is responsive
- ✅ Files download correctly
- ✅ Error messages are clear
- ✅ Performance is good

---

## 📞 Support

If you encounter issues:
1. Check console logs (F12)
2. Check backend terminal output
3. Review error messages
4. Check network tab in DevTools
5. Verify file permissions

---

## 🚀 Ready to Test!

Start testing and enjoy the new features! 🎬🎵📺
