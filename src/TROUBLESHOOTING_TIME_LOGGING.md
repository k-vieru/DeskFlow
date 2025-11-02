# Troubleshooting: Time Logging → Statistics Data Link

## 🔍 How to Debug the Issue

The Time Logging and Statistics components are now enhanced with console logging to help identify any synchronization issues.

---

## 📋 Step-by-Step Debugging Guide

### **Step 1: Open Browser Console**
1. Open your application in the browser
2. Press `F12` or Right-click → "Inspect" → "Console" tab
3. Keep the console open while testing

### **Step 2: Log Time Entry**
1. Navigate to **Time Logging** tab
2. Select a project
3. Select one or more tasks
4. Enter hours (e.g., 2.5)
5. Click "Log Time"

**Watch for these console logs:**
```
[TimeLogging] Time entry saved: {id: "...", projectId: "...", ...}
[TimeLogging] Project ID: abc-123-def-456
[TimeLogging] Time entries fetched: 1 entries
```

### **Step 3: Check Statistics**
1. Navigate to **Statistics** tab
2. Select the **same project** you logged time for

**Watch for these console logs:**
```
[Reports] Time entries fetched: 1 entries
```

---

## ✅ What SHOULD Happen

### Correct Flow:
1. **Time Logging** → POST to `/projects/{projectId}/time-entries`
2. Server saves to KV store: `time-entries:{projectId}`
3. **Time Logging** → GET refreshes, shows new entry
4. **Statistics** → GET fetches same data from KV store
5. Charts display the logged time

### Success Indicators:
- ✅ Toast notification: "Time logged successfully!"
- ✅ Entry appears in Time Logging list immediately
- ✅ Console shows matching entry counts
- ✅ Same projectId in both components
- ✅ Charts populate with data in Statistics

---

## ❌ Common Issues & Solutions

### Issue 1: Different Project IDs
**Symptom:** Time logging works, but Statistics shows no data

**Check:**
```
Console should show:
[TimeLogging] Project ID: abc-123...
[Reports] Time entries fetched: 0 entries
```

**Solution:**
- Make sure you're selecting the **exact same project** in both tabs
- The project dropdown should show the same project name
- Check console logs to verify projectId matches

### Issue 2: Server Returns Empty Array
**Symptom:** POST succeeds but GET returns no data

**Check:**
```
Console shows:
[TimeLogging] Time entry saved: {...}
[TimeLogging] Time entries fetched: 0 entries  ← WRONG!
```

**Solution:**
- This indicates a server KV storage issue
- Check Supabase Edge Function logs
- Verify KV store table exists: `kv_store_8f21c4d2`
- Try redeploying the server function

### Issue 3: 404 Not Found
**Symptom:** Server can't find the project

**Check:**
```
Console shows:
Error: Project not found
or
[Reports] No time entries found (404)
```

**Solution:**
- Refresh the page
- Re-select the project
- Check if project still exists in Kanban Board
- Verify you're a member of the project

### Issue 4: 403 Forbidden
**Symptom:** Permission denied

**Check:**
```
Console shows:
Error: Not a member of this project
or
Error: You do not have permission...
```

**Solution:**
- You must be a project member to log time
- Owner should invite you if you're not a member
- Check project membership in Team Management

### Issue 5: Stale Data
**Symptom:** Statistics shows old data, not new entries

**Check:**
- Navigate away from Statistics and back
- Select a different project, then re-select the original
- Check if `selectedProjectId` changed

**Solution:**
- Statistics auto-refreshes when `selectedProjectId` changes
- Try manual page refresh (F5)
- Clear browser cache if issue persists

---

## 🧪 Manual Testing Checklist

### Test 1: Single Entry
- [ ] Log 1 time entry in Time Logging
- [ ] Check console logs show entry saved
- [ ] Verify entry appears in Time Logging list
- [ ] Switch to Statistics tab
- [ ] Verify same project is selected
- [ ] Check console shows entry count > 0
- [ ] Confirm charts display data

### Test 2: Multiple Entries
- [ ] Log 3 different time entries
- [ ] Each with different dates
- [ ] Verify all 3 appear in Time Logging list
- [ ] Switch to Statistics
- [ ] Check all 3 entries are counted
- [ ] Verify Daily view shows distribution
- [ ] Check Weekly view aggregates correctly

### Test 3: Multiple Projects
- [ ] Create 2 projects
- [ ] Log time to Project A
- [ ] Log time to Project B
- [ ] In Statistics, select Project A → see only A's data
- [ ] Switch to Project B → see only B's data
- [ ] Verify no cross-contamination

### Test 4: Team Statistics
- [ ] As project owner, log time
- [ ] Invite a team member
- [ ] Team member logs time
- [ ] In Statistics, switch to "Team" view
- [ ] Verify both entries appear
- [ ] Check Team Time Distribution chart
- [ ] Verify pie chart shows both members

---

## 🔧 Server-Side Debugging

If client-side looks correct but data still doesn't sync:

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → `make-server-8f21c4d2`
3. Click "Logs"
4. Look for errors during POST/GET requests

### Expected Server Logs:
```
[Time Entry] Looking for project with ID: abc-123...
[Time Entry] Project found: YES
POST /projects/abc-123.../time-entries → 200 OK
GET /projects/abc-123.../time-entries → 200 OK
```

### Verify KV Store
The server stores time entries in the KV store table:

**Table:** `kv_store_8f21c4d2`
**Key:** `time-entries:{projectId}`
**Value:** Array of TimeEntry objects

You can query this directly in Supabase SQL Editor:
```sql
SELECT * FROM kv_store_8f21c4d2 
WHERE key LIKE 'time-entries:%';
```

---

## 🚀 Quick Fixes

### Fix 1: Hard Refresh
Sometimes cached data causes issues:
- Press `Ctrl+Shift+R` (Windows/Linux)
- Press `Cmd+Shift+R` (Mac)

### Fix 2: Clear Console & Retry
- Clear console (trash icon)
- Log a new time entry
- Watch fresh logs

### Fix 3: Redeploy Server
If server seems broken:
- Redeploy the edge function from Supabase Dashboard
- Wait 1-2 minutes for deployment
- Try logging time again

### Fix 4: Re-authenticate
Sometimes token issues cause problems:
- Logout
- Login again
- Try logging time

---

## 📊 Expected Console Output

### Successful Time Logging Session:
```
[TimeLogging] Time entry saved: {
  id: "550e8400-e29b-41d4-a716-446655440000",
  projectId: "abc-123-def-456",
  userId: "user-789",
  userName: "John Doe",
  taskNames: ["Design mockups", "Code review"],
  hours: 3.5,
  date: "2025-11-02",
  createdAt: "2025-11-02T14:30:00Z"
}
[TimeLogging] Project ID: abc-123-def-456
[TimeLogging] Time entries fetched: 1 entries
```

### Successful Statistics View:
```
[Reports] Time entries fetched: 1 entries
```

### Both Should Show SAME projectId and entry count!

---

## 💡 Additional Tips

1. **Always check project selection** - The #1 cause of "missing data" is viewing the wrong project

2. **Dates matter** - Statistics filters by date range. If you log time for last month, Daily view won't show it

3. **Personal vs Team** - In Statistics, Personal view shows only YOUR entries, Team view shows everyone's

4. **Empty state is normal** - If no time has been logged yet, Statistics shows a helpful empty state message

5. **Console is your friend** - Console logs will clearly show if data is being fetched or not

---

## 🆘 Still Not Working?

If you've tried everything and data still doesn't link:

1. **Take screenshots** of:
   - Time Logging view with entries
   - Statistics view showing no data
   - Browser console logs
   - Project dropdown selections

2. **Note the exact steps**:
   - What project you selected
   - What time you logged
   - What you see in Statistics
   - Any error messages

3. **Check these values**:
   - Project ID (from console)
   - Number of entries (from console)
   - Selected date range in Statistics

4. **Verify server is working**:
   - Go to Settings → ConnectionStatus should show "Connected"
   - Try creating a task in Kanban Board (tests server)
   - If server is down, nothing will work

---

## ✨ Success Criteria

You'll know it's working when:

✅ Log time → Entry appears in Time Logging list immediately
✅ Switch to Statistics → Charts populate with data
✅ Console shows matching entry counts in both components
✅ No 404 or 403 errors in console
✅ Export Report includes logged time data

**The system is designed to work automatically. If you see your time entries in Time Logging, they WILL appear in Statistics when viewing the same project!**
