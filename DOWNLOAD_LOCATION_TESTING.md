# Download Location Feature - Testing Guide

## Quick Test Steps

### 1. Start the Backend Server
```bash
cd backend
npm start
```

### 2. Start the Frontend
```bash
cd client
npm run dev
```

### 3. Test the Feature

#### Test 1: View Current Path
1. Open the app in browser
2. Go to **Settings** tab
3. Scroll to **Download Location** section
4. Verify current path is displayed

#### Test 2: Update Path Using Input
1. Type a new path in the input field (e.g., `C:\Users\THAMARAISELVAN\Desktop\TestDownloads`)
2. Click **Update** button
3. Verify success toast appears
4. Check that path is updated in the display

#### Test 3: Use Quick Presets
1. Click **Videos Folder** preset button
2. Click **Update** button
3. Verify path changes to Videos folder
4. Try other presets (Music, Desktop, Default)

#### Test 4: Invalid Path
1. Enter an invalid path (e.g., `Z:\NonExistent\Path`)
2. Click **Update**
3. Verify error message appears

#### Test 5: Persistence
1. Change download path
2. Stop the backend server
3. Restart the backend server
4. Refresh the frontend
5. Verify the custom path is still set

#### Test 6: Download to New Location
1. Set a custom download path
2. Go to **Single** tab
3. Download a video
4. Check that file is saved to the new location

## Expected Results

✅ Path updates successfully
✅ Toast notifications appear
✅ Settings persist after restart
✅ Files download to new location
✅ Invalid paths show error messages
✅ Preset buttons work correctly

## Backend Verification

Check that `download-config.json` is created in the backend folder:
```json
{
  "downloadPath": "C:\\Users\\THAMARAISELVAN\\Videos\\YouTube"
}
```

## API Testing (Optional)

### Test GET endpoint:
```bash
curl http://localhost:4000/api/download-path
```

### Test POST endpoint:
```bash
curl -X POST http://localhost:4000/api/download-path ^
  -H "Content-Type: application/json" ^
  -d "{\"downloadPath\":\"C:\\Users\\THAMARAISELVAN\\Desktop\\TestDownloads\"}"
```

## Troubleshooting

### Issue: Path not updating
- Check browser console for errors
- Verify backend is running on correct port
- Check network tab for API calls

### Issue: Folder not created
- Verify you have write permissions
- Check path format is correct (Windows: `C:\...`)
- Try a simpler path first (e.g., Desktop)

### Issue: Settings not persisting
- Check if `download-config.json` exists in backend folder
- Verify file has correct JSON format
- Check file permissions

## Success Indicators

1. ✅ Settings UI shows current path
2. ✅ Update button changes path
3. ✅ Preset buttons work
4. ✅ Toast notifications appear
5. ✅ Config file is created
6. ✅ Downloads go to new location
7. ✅ Settings persist after restart
