# DeskFlow Connection Issues Guide

This guide helps you troubleshoot and resolve connection errors in DeskFlow.

---

## Common Connection Errors

### "TypeError: Failed to fetch"

**What it means**: The application cannot connect to the server.

**Common causes**:
1. No internet connection
2. Server is down or unreachable
3. Browser blocking the request (CORS, security settings)
4. Edge function not deployed on Supabase

**Solutions**:

#### 1. Check Your Internet Connection
```
✓ Open a new tab and visit a website
✓ Check if other web apps work
✓ Try disabling VPN if you're using one
✓ Restart your router if needed
```

#### 2. Check Server Status
The app will automatically:
- Retry failed requests 2-3 times
- Show a connection status indicator if there's an issue
- Display the retry button

#### 3. Clear Browser Cache
```
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload the page (F5 or Cmd+R)
```

#### 4. Check Browser Console
```
1. Press F12 to open Developer Tools
2. Click on the "Console" tab
3. Look for red error messages
4. Check if errors mention:
   - CORS
   - Network error
   - 404, 500, or other HTTP codes
```

#### 5. Try Different Browser
Sometimes browser extensions or settings block requests:
- Chrome/Edge
- Firefox
- Safari

---

## Error Messages & Solutions

### "Unable to connect to server. Please check your internet connection."

**Fix**:
1. Check internet connection
2. Click the "Retry" button in the error message
3. Refresh the page (F5)

### "Request timed out. The server might be slow or unavailable."

**Fix**:
1. Wait a moment and try again
2. The server might be experiencing high load
3. Check your internet speed
4. Try again in a few minutes

### "Your session has expired. Please log in again."

**Fix**:
1. Click "Logout" in Settings
2. Log in again with your credentials
3. This happens after 24 hours of inactivity

### "Connection blocked by browser security."

**Fix**:
1. Check if you have strict security extensions (Privacy Badger, uBlock Origin)
2. Temporarily disable them for DeskFlow
3. Add DeskFlow to your whitelist
4. Check browser security settings

---

## Automatic Error Handling

DeskFlow now includes automatic retry logic:

### Retry Behavior
- **Network errors**: Retries 2 times automatically
- **Server errors (5xx)**: Retries 2 times
- **Client errors (4xx)**: No retry (these are validation errors)
- **Retry delay**: 1 second between attempts, increasing each time

### Connection Status Indicator
- **Green checkmark**: Successfully connected
- **Orange warning**: Connection issue detected
- **Auto-dismiss**: Success messages disappear after 3 seconds
- **Retry button**: Click to manually check connection

### Silent Retries
Some operations retry silently without showing errors:
- Notification polling (every 10 seconds)
- Project list refreshing (every 5 seconds)
- Chat message polling (every 2 seconds)

---

## Debugging Steps

### Step 1: Open Browser Console
```
1. Press F12
2. Go to Console tab
3. Look for messages with [Fetch] prefix
4. Check attempt counts and errors
```

### Step 2: Check Network Tab
```
1. In Developer Tools, click "Network" tab
2. Reload the page
3. Look for red/failed requests
4. Click on failed requests to see details
5. Check "Response" and "Headers" tabs
```

### Step 3: Verify Logs
Look for these log patterns:
```
[Fetch] Attempt 1/3: https://...
[Fetch] Attempt 2/3: https://...
[Fetch] All attempts failed
```

### Step 4: Test Specific Endpoints
Open Console and run:
```javascript
fetch('https://hqujqnqcluupvxshxgsd.supabase.co/functions/v1/make-server-8f21c4d2/projects')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e))
```

---

## Connection Requirements

### Minimum Requirements
- Stable internet connection (1 Mbps minimum)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Cookies enabled for authentication

### Firewall/Network Settings
If you're on a corporate network, ensure:
- HTTPS traffic is allowed
- Supabase domains are not blocked:
  - `*.supabase.co`
  - `hqujqnqcluupvxshxgsd.supabase.co`

### Browser Extensions
These might interfere:
- Ad blockers (uBlock Origin, AdBlock Plus)
- Privacy extensions (Privacy Badger, Ghostery)
- Script blockers (NoScript)
- VPN extensions

**Solution**: Whitelist DeskFlow or temporarily disable

---

## Advanced Troubleshooting

### Hard Refresh
```
Windows: Ctrl + F5
Mac: Cmd + Shift + R
```

This clears cache and reloads everything fresh.

### Incognito/Private Mode
```
1. Open incognito/private window
2. Go to DeskFlow
3. Log in
4. Test if it works
```

If it works in incognito but not normally:
- Clear browser cache
- Disable extensions one by one
- Check browser settings

### Check Local Storage
```
1. Open Console (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. Check for "deskflow_session"
5. If corrupted, delete it and log in again
```

### Export Data Before Troubleshooting
If you have important reports:
```
1. Go to Reports tab
2. Click "Export" button
3. Save the JSON/CSV file
4. This backs up your time entries and stats
```

---

## When All Else Fails

### 1. Check Supabase Status
The server might be down for maintenance.

### 2. Wait and Retry
Sometimes server deployments cause brief outages:
- Wait 5-10 minutes
- Try again
- Connection usually restores automatically

### 3. Contact Support
If the issue persists:
1. Take screenshots of error messages
2. Copy console logs (F12 → Console → right-click → Save as)
3. Note what you were doing when it failed
4. Include your browser and OS version

---

## Prevention Tips

### Regular Maintenance
- Clear browser cache weekly
- Keep browser updated
- Restart browser daily if you use it heavily
- Don't accumulate too many tabs

### Best Practices
- Save/export important data regularly
- Don't leave DeskFlow open for days without refresh
- Log out when done for the day
- Use stable internet connection for important work

### Connection Monitoring
DeskFlow automatically:
- Checks connection every 30 seconds
- Shows status alerts if connection fails
- Retries failed requests automatically
- Logs detailed debugging information

---

## Error Code Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check your input data |
| 401 | Unauthorized | Log in again |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Wait and retry |
| 502 | Bad Gateway | Server temporarily down |
| 503 | Service Unavailable | Server overloaded |

---

## Quick Fixes Summary

**Can't connect at all?**
1. Check internet
2. Hard refresh (Ctrl+F5)
3. Clear cache
4. Try different browser

**Connection works but features fail?**
1. Check console logs
2. Verify you're logged in
3. Try logging out and back in
4. Create a project first (many features need this)

**Random disconnections?**
1. Check internet stability
2. Disable VPN temporarily
3. Close other bandwidth-heavy apps
4. Use wired connection instead of WiFi

**Session expired frequently?**
1. This is normal after 24 hours
2. Just log in again
3. Enable "Remember me" if available
4. Don't clear cookies

---

## Success Indicators

You know it's working when:
- ✅ No orange warning appears
- ✅ Projects load in dropdowns
- ✅ Tasks appear in Kanban board
- ✅ Chat messages send successfully
- ✅ Time entries save
- ✅ Notifications appear
- ✅ Reports generate data

---

## Remember

- **Most connection issues resolve with a refresh**
- **The app retries automatically - wait a moment**
- **Check the connection indicator for status**
- **Console logs (F12) show detailed debugging info**
- **When in doubt, log out and log back in**

DeskFlow is designed to handle temporary connection issues gracefully. Most errors are transient and will resolve on their own!
