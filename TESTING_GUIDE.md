# Testing Guide - Telegram Bot Fixes

## Quick Test Commands

### 1. Test Connection
After starting the bot, check the console for:
```
✅ Bot commands registered in Telegram menu
🤖 Telegram bot initialized successfully
```

### 2. Test /trending Command
In Telegram, send:
```
/trending
```

**Expected Result:**
- Should show "🔥 Fetching trending videos..."
- Then display a list of 10 trending videos with buttons
- All video titles should be readable (no garbled text)
- Clicking any button should work without errors

**What Was Fixed:**
- Video titles are now sanitized to remove invalid UTF-8 characters
- No more "400 Bad Request: inline keyboard button text must be encoded in UTF-8" errors

### 3. Test /search Command
In Telegram, send:
```
/search music 2024
```

**Expected Result:**
- Should show "🔍 Searching for: music 2024..."
- Display up to 5 search results with buttons
- All titles should be properly displayed
- Buttons should work correctly

**What Was Fixed:**
- Same UTF-8 sanitization as /trending
- Handles special characters, emojis, and non-Latin text

### 4. Test Other Commands
All these commands should now display with clean ASCII formatting:

```
/help
/about
/stats
/settings
```

**What Was Fixed:**
- Removed Unicode box drawing characters (╔, ║, ╚, ═, ━)
- Replaced with simple ASCII (=, -, |)
- Better compatibility across all Telegram clients

### 5. Test Quality Selection
1. Send any YouTube URL
2. Click "📥 Download Video"
3. Choose format (Video/Audio)
4. View quality selection menu

**Expected Result:**
- Clean, readable quality menu
- No encoding errors
- All buttons work correctly

**What Was Fixed:**
- Simplified quality selection UI
- Removed 2K and 4K options (files too large)
- Clean ASCII formatting

## Common Issues & Solutions

### Issue: Bot not responding
**Solution:** 
1. Check if bot is running: Look for console output
2. Check Telegram token in `.env` file
3. Restart the bot

### Issue: "EFATAL" connection errors
**Solution:**
- This is normal during startup
- Bot will automatically reconnect
- Errors are logged only once per minute to avoid spam

### Issue: Downloads fail for large files
**Solution:**
- Use 720p or lower quality
- Files over 50MB will be offered for splitting
- 2K and 4K are now blocked (too large for Telegram)

## Manual Testing Checklist

- [ ] Bot starts without errors
- [ ] `/start` command works
- [ ] `/help` displays correctly (no box characters)
- [ ] `/about` displays correctly
- [ ] `/trending` shows videos without UTF-8 errors
- [ ] `/search` works with various queries
- [ ] Video URL download flow works
- [ ] Quality selection menu displays correctly
- [ ] `/stats` shows user statistics
- [ ] `/settings` menu works
- [ ] All buttons are clickable
- [ ] No "400 Bad Request" errors in console

## Automated Testing (Future)

Consider adding these tests:
```javascript
// Test text sanitization
describe('sanitizeText', () => {
  it('should remove control characters', () => {
    const result = sanitizeText('Hello\x00World');
    expect(result).toBe('HelloWorld');
  });
  
  it('should handle emojis correctly', () => {
    const result = sanitizeText('Test 🎵 Video');
    expect(result).toContain('Test');
  });
});
```

## Performance Testing

### Load Test
1. Send multiple `/trending` requests
2. Check response time
3. Verify no memory leaks

### Stress Test
1. Send 10+ video URLs simultaneously
2. Check if bot handles queue correctly
3. Monitor server resources

## Monitoring

### Console Logs to Watch
```
✅ Bot commands registered
🤖 Telegram bot initialized
⚠️  Telegram connection issue: EFATAL (should be rare)
```

### Error Logs to Investigate
```
❌ Error: (any error message)
Trending command error: (specific to /trending)
Search failed: (specific to /search)
```

## Rollback Plan

If issues occur:
1. Check `UTF8_FIXES.md` for what was changed
2. Review git history: `git log --oneline`
3. Revert if needed: `git revert <commit-hash>`
4. Restart bot

## Success Criteria

✅ All commands work without UTF-8 errors
✅ /trending displays 10 videos correctly
✅ /search returns results without errors
✅ Video titles display properly (no garbled text)
✅ All buttons are clickable
✅ Quality selection works
✅ Downloads complete successfully
✅ No "400 Bad Request" errors in logs

## Next Steps

After testing:
1. Monitor bot for 24 hours
2. Check user feedback
3. Review error logs
4. Consider additional improvements
