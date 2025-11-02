# 💬 Team Chat Feature Guide

## Overview

DeskFlow now includes a **Team Chat** feature that allows project members to communicate in real-time. Messages are automatically deleted after a configurable period (default: 7 days) to keep conversations relevant and storage efficient.

---

## Features

### 🔥 Core Features

✅ **Real-time Messaging** - Send and receive messages instantly  
✅ **Project-Based Chat** - Each project has its own chat room  
✅ **Auto-Delete Messages** - Messages older than X days are automatically deleted  
✅ **Configurable Retention** - Project owners can set retention from 1-365 days  
✅ **Owner Controls** - Project owners can clear all messages and change settings  
✅ **Beautiful UI** - Gradient message bubbles, avatars, timestamps  
✅ **Dark Mode Support** - Full support for light and dark themes  
✅ **Auto-Scroll** - Automatically scrolls to latest messages  
✅ **Keyboard Shortcuts** - Press Enter to send messages

---

## How to Use

### 1. **Access Team Chat**

1. Click **"Team Chat"** in the sidebar (message icon)
2. Select a project from your projects list
3. Start chatting!

---

### 2. **Send Messages**

1. Type your message in the input field at the bottom
2. Press **Enter** to send (or click the Send button)
3. Your message appears with a blue/purple gradient background
4. Other users' messages appear with a gray background

**Message Features:**
- ✅ Messages show sender name and timestamp
- ✅ "Just now", "5m ago", "2h ago", "3d ago" smart timestamps
- ✅ Your messages appear on the right, others on the left
- ✅ Avatar with initials for each sender

---

### 3. **Auto-Delete Feature**

**Default Behavior:**
- Messages older than **7 days** are automatically deleted
- Deletion happens when anyone loads the chat
- This keeps conversations relevant and saves storage

**How It Works:**
```
Day 0: Message sent
Day 7: Message still visible
Day 8: Message automatically deleted
```

---

### 4. **Owner Settings** (Project Owners Only)

#### Change Auto-Delete Period

1. Click **"Settings"** button in chat header
2. Change "Auto-delete messages after (days)" value
3. Choose between **1-365 days**
4. Click **"Save Changes"**

**Examples:**
- `1 day` = Messages deleted daily (fast-paced projects)
- `7 days` = Default, good for most projects
- `30 days` = Monthly cleanup
- `90 days` = Quarterly cleanup
- `365 days` = Annual cleanup

#### Clear All Messages

1. Click **"Clear All"** button in chat header
2. Confirm the action
3. All messages are instantly deleted

⚠️ **Warning:** This action cannot be undone!

---

## UI Features

### Message Display

**Your Messages:**
```
┌─────────────────────────────┐
│         [Avatar]            │
│         Your Name  2m ago   │
│ ┌─────────────────────────┐ │
│ │ Hello team! 👋          │ │  ← Blue/Purple Gradient
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Other Users' Messages:**
```
┌─────────────────────────────┐
│ [Avatar]                    │
│ John Doe  5m ago            │
│ ┌─────────────────────────┐ │
│ │ Hi! How are you?        │ │  ← Gray Background
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Header Badges

- 🕐 **Auto-delete badge** - Shows current retention period
- 👥 **Project name** - Shows which project you're chatting in

---

## Technical Details

### Backend Endpoints

**Get Messages:**
```
GET /projects/{projectId}/messages
```

**Send Message:**
```
POST /projects/{projectId}/messages
Body: { "content": "message text" }
```

**Clear All Messages (Owner Only):**
```
DELETE /projects/{projectId}/messages
```

**Get Settings:**
```
GET /projects/{projectId}/chat-settings
```

**Update Settings (Owner Only):**
```
PUT /projects/{projectId}/chat-settings
Body: { "autoDeleteDays": 7 }
```

### Auto-Delete Logic

The auto-delete feature works as follows:

1. **When messages are fetched:**
   - Server calculates cutoff date: `Today - autoDeleteDays`
   - Filters messages: `messageDate >= cutoffDate`
   - Returns only valid messages
   - Updates storage if messages were deleted

2. **Example:**
   ```javascript
   Settings: autoDeleteDays = 7
   Today: November 2, 2025
   Cutoff: October 26, 2025
   
   ✅ Message from Oct 27 → KEPT
   ✅ Message from Nov 1 → KEPT
   ❌ Message from Oct 25 → DELETED
   ❌ Message from Oct 20 → DELETED
   ```

### Polling

- Chat polls for new messages every **3 seconds**
- This provides near real-time updates
- Automatic refresh when you receive messages

---

## Permissions

### All Team Members Can:
- ✅ View messages
- ✅ Send messages
- ✅ See auto-delete settings
- ✅ See message timestamps

### Only Project Owners Can:
- ✅ Change auto-delete period (1-365 days)
- ✅ Clear all messages
- ✅ Access settings dialog

---

## Best Practices

### 1. **Choose Appropriate Retention**

**Fast Projects (Active Daily):**
- Use **1-7 days** retention
- Keeps chat focused on current work

**Standard Projects:**
- Use **7-30 days** retention (default is 7)
- Good balance of history and relevance

**Documentation Projects:**
- Use **90-365 days** retention
- Preserves important discussions

### 2. **Clear Messages Periodically**

If you're starting a new phase:
1. Clear all old messages
2. Start fresh with new context

### 3. **Use Chat for Quick Communication**

**Good Uses:**
- Quick questions
- Status updates
- Coordination
- "Done with task X!"

**Not Good Uses:**
- Long-term documentation (use external docs)
- Important decisions (document elsewhere)
- File sharing (not supported yet)

---

## Color Palette Expansion

In addition to the chat feature, the color palette has been expanded!

### Original 6 Colors:
- Sky (Blue)
- Lavender (Purple)
- Mint (Green)
- Peach (Orange-Pink)
- Rose (Pink)
- Lemon (Yellow)

### New 10 Colors:
- **Coral** (Salmon)
- **Teal** (Blue-Green)
- **Violet** (Deep Purple)
- **Amber** (Golden)
- **Indigo** (Navy Blue)
- **Emerald** (Forest Green)
- **Pink** (Bright Pink)
- **Cyan** (Light Blue)
- **Orange** (Bright Orange)
- **Purple** (Rich Purple)

**Total: 16 Colors!** 🎨

All colors support both light and dark modes with beautiful, minimalist pastels.

---

## Troubleshooting

### Issue: Messages Not Appearing

**Check:**
1. Are you a member of the selected project?
2. Is your internet connection stable?
3. Look at browser console for errors
4. Try refreshing the page

### Issue: Can't Send Messages

**Check:**
1. Is the message text not empty?
2. Are you authenticated?
3. Do you have project access?

### Issue: Settings Button Not Visible

**This is normal!** Only the project owner can see and access settings.

### Issue: Old Messages Still Showing

**This is expected** until someone loads the chat after the cutoff date. Auto-delete happens when:
- Anyone loads the chat
- Messages are fetched from server

---

## Future Enhancements (Ideas)

Potential future features:
- 📎 File attachments
- 🔍 Message search
- 📌 Pin important messages
- 🔔 Push notifications
- ✏️ Edit/delete own messages
- 💬 Reply to specific messages (threads)
- 😊 Emoji reactions
- 📊 Read receipts
- 🎯 Mentions (@username)

---

## Summary

✅ **Team Chat is now live!**  
✅ **Auto-deletes messages after 7 days (configurable)**  
✅ **Beautiful, minimalist design**  
✅ **Dark mode support**  
✅ **Owner controls for settings**  
✅ **16 color palette for tasks**

**Start chatting with your team today! 💬🚀**
