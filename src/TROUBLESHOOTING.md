# DeskFlow Troubleshooting Guide

## Quick Links

- **Connection Issues?** → See [CONNECTION_ISSUES.md](./CONNECTION_ISSUES.md)
- **Error Messages?** → See [ERROR_MESSAGES.md](./ERROR_MESSAGES.md)
- **Getting Started?** → See [QUICK_START.md](./QUICK_START.md)

---

## Common Issues and Solutions

### Connection & Network Issues

#### Error: "TypeError: Failed to fetch"

**This is a network connectivity issue.** See the complete guide: [CONNECTION_ISSUES.md](./CONNECTION_ISSUES.md)

**Quick Fixes**:
1. Check your internet connection
2. Click the "Retry" button in the error alert
3. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
4. Clear browser cache
5. Check the connection status indicator (top-right)

**The app now automatically retries failed requests**, so most connection issues resolve on their own.

---

### Time Logging

#### Error: 404 when logging time

**Cause**: This error occurs when the selected project doesn't exist in the database or when there's a synchronization issue.

**Solutions**:

1. **Create a project first**
   - Navigate to the **Kanban Board** tab
   - Click the **"+ Add Project"** button
   - Enter a project name and create the project
   - Then return to the **Time Logging** tab

2. **Refresh the projects list**
   - Click the **refresh icon** (↻) next to the project selector
   - This will reload all available projects from the database

3. **Check the browser console**
   - Open Developer Tools (F12)
   - Look at the Console tab for detailed error messages
   - The logs will show:
     - Which project ID was being used
     - List of available projects in the database
     - Any synchronization issues

4. **Verify project existence**
   - Ensure the project you want to log time for is visible in the Kanban Board
   - If not, create it there first before attempting to log time

#### Error: "Selected project not found"

**Cause**: The project you selected has been deleted or you don't have access to it anymore.

**Solution**:
- Click the refresh button to reload the projects list
- Select a different project from the dropdown
- If no projects appear, create a new one in the Kanban Board

#### No tasks available in project

**Cause**: The selected project doesn't have any tasks created yet.

**Solution**:
1. Go to the **Kanban Board** tab
2. Select the same project
3. Create tasks in any column (To Do, In Progress, or Done)
4. Return to **Time Logging** and the tasks should now appear

---

### Chat

#### Error: "Text message is required" or "Message content is required"

**Cause**: Trying to send an empty message or a message with only whitespace.

**Solutions**:

1. **Type a valid message**
   - Ensure you've entered text in the message input field
   - The message cannot be empty or contain only spaces

2. **Check project selection**
   - Make sure you've selected a project from the dropdown
   - You cannot send messages without selecting a project first

3. **Refresh if needed**
   - If the issue persists, refresh the page
   - Your messages are saved on the server and will reload automatically

#### Error: "Project not found" in Chat

**Cause**: The selected project has been deleted or you lost access to it.

**Solution**:
- Click the **"New Project"** button to create a new project
- Or select a different project from the dropdown
- Use the refresh functionality to reload available projects

#### Messages not appearing

**Cause**: The chat polls for new messages every 2 seconds, but there might be a delay.

**Solutions**:
- Wait a few seconds for the polling to update
- Refresh the page if messages don't appear after 5-10 seconds
- Check your internet connection

---

### General Workflow

#### Recommended Order of Operations

To avoid errors, follow this workflow:

1. **Create a Project** (Kanban Board)
   - Click "Add Project"
   - Enter project name
   - Project is now available across all tabs

2. **Create Tasks** (Kanban Board)
   - Select your project
   - Add tasks to To Do, In Progress, or Done columns
   - Tasks are now available for time logging

3. **Invite Team Members** (Team Management - optional)
   - Add collaborators using their email addresses
   - They can now access the project and chat

4. **Use Chat** (Chat)
   - Select the project
   - Start collaborating with your team
   - Messages are saved and sync in real-time

5. **Log Time** (Time Logging)
   - Select the project
   - Choose which tasks you worked on
   - Enter hours and date
   - Submit the time entry

6. **View Reports** (Reports)
   - Select the project and time period
   - View personal or team statistics
   - Export reports as needed

---

### Project Synchronization

If you're experiencing sync issues where projects created in one tab don't appear in another:

1. **Use the refresh buttons**
   - Most components have a refresh icon or auto-refresh functionality
   - Click refresh to manually update the projects list

2. **Wait for auto-refresh**
   - Some components (like Chat) auto-refresh every 10 seconds
   - Give it a moment to sync automatically

3. **Hard refresh the page**
   - Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - This clears the cache and reloads everything fresh

---

### Authentication Issues

#### Error: "You must be logged in"

**Solution**:
- Your session may have expired
- Click **Logout** and log in again with your credentials
- Your data is saved on the server and will reload after login

#### Error: "Unauthorized" or "Not a member of this project"

**Solution**:
- You may have been removed from the project
- Contact the project owner to be re-invited
- Check that you're logged in with the correct account

---

### Data Not Saving

If your time entries, tasks, or messages aren't being saved:

1. **Check your internet connection**
   - Ensure you have a stable connection
   - Try refreshing the page

2. **Look for error messages**
   - Toast notifications will appear for errors
   - Check the browser console for detailed errors

3. **Verify authentication**
   - Make sure you're still logged in
   - Your session may have expired

4. **Try again**
   - Wait a moment and retry the operation
   - The server might be temporarily busy

---

## Debug Mode

To get detailed logging information:

1. Open **Developer Tools** (F12)
2. Go to the **Console** tab
3. Perform the action that's causing issues
4. Look for log messages that show:
   - Request details
   - Response status codes
   - Error messages
   - Available data

The app logs extensive debugging information to help identify issues.

---

## Still Having Issues?

If you continue to experience problems:

1. Try logging out and back in
2. Clear your browser cache and cookies
3. Try a different browser
4. Check if other team members can reproduce the issue
5. Note the exact error message and steps to reproduce
