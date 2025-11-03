# DeskFlow Error Messages Reference

This guide explains all error messages you might encounter in DeskFlow and how to fix them.

## Time Logging Errors

### "You must be logged in to log time"
- **Cause**: Your session has expired
- **Fix**: Log out and log back in

### "Please select a project"
- **Cause**: No project is selected in the dropdown
- **Fix**: Select a project from the dropdown menu

### "Selected project not found. Please refresh the page."
- **Cause**: The project you selected no longer exists or you don't have access
- **Fix**: 
  1. Click the refresh button (↻) next to the project selector
  2. Select a different project
  3. Or create a new project in the Kanban Board

### "Please select at least one task"
- **Cause**: You haven't selected any tasks to log time for
- **Fix**: Click on one or more tasks in the task list to select them

### "Please enter valid hours (greater than 0)"
- **Cause**: The hours field is empty or contains an invalid value
- **Fix**: Enter a positive number (e.g., 2.5, 4, 0.5)

### "Please select a date"
- **Cause**: No date is selected
- **Fix**: Use the date picker to select a date

### "Project not found. Please refresh the page and try again." (404)
- **Cause**: The project ID doesn't exist in the database
- **Fix**:
  1. Check the browser console (F12) for debugging information
  2. The console will show available project IDs
  3. Click the refresh button to reload projects
  4. If issue persists, create a new project in the Kanban Board
  5. Make sure you're creating the project in the Kanban Board first before trying to log time

### "You do not have permission to log time for this project." (403)
- **Cause**: You're not a member of the selected project
- **Fix**: Ask the project owner to add you as a member

### "Create a project in the Kanban Board to start logging time"
- **Cause**: No projects exist yet
- **Fix**:
  1. Navigate to the Kanban Board tab
  2. Click "Add Project"
  3. Enter a project name and create it
  4. Return to Time Logging tab
  5. The project should now appear in the dropdown

### "No tasks available in this project. Create tasks in the Kanban Board first."
- **Cause**: The selected project has no tasks
- **Fix**:
  1. Go to the Kanban Board
  2. Select the same project
  3. Add tasks to any column
  4. Return to Time Logging

---

## Chat Errors

### "Please enter a message"
- **Cause**: Trying to send an empty message
- **Fix**: Type a message before pressing Enter or clicking Send

### "Please select a project first"
- **Cause**: No project is selected for the chat
- **Fix**: Select a project from the dropdown menu at the top

### "Authentication error. Please log in again."
- **Cause**: Your session token is invalid or expired
- **Fix**: Log out and log back in

### "Message content is required" or "Invalid message. Please check and try again." (400)
- **Cause**: The message is empty or contains only whitespace
- **Fix**: 
  - Make sure you've typed actual text
  - Don't just press Enter on an empty field
  - Spaces alone don't count as a message

### "Project not found. Please refresh the page and try again." (404)
- **Cause**: The selected project has been deleted
- **Fix**:
  1. Select a different project from the dropdown
  2. Or create a new project using the "New Project" button
  3. Chat polls for updates every 10 seconds, so wait a moment

### "You do not have permission to send messages in this project." (403)
- **Cause**: You're not a member of the project
- **Fix**: Ask the project owner to add you as a member in Team Management

### "No projects available"
- **Cause**: You haven't created or been invited to any projects
- **Fix**:
  1. Click the "New Project" button in the Chat interface
  2. Or go to the Kanban Board and create a project there
  3. Or ask a colleague to invite you to their project

---

## Kanban Board Errors

### "Only the project owner can add or delete tasks" (403)
- **Cause**: You're trying to add/delete tasks but you're not the owner
- **Fix**: 
  - Team members can only move tasks between columns
  - Contact the project owner to add/delete tasks

### "Project not found" (404)
- **Cause**: The project doesn't exist or was deleted
- **Fix**: Create a new project or select a different one

---

## Team Management Errors

### "Only project owner can invite members" (403)
- **Cause**: You're trying to invite someone but you're not the project owner
- **Fix**: Ask the project owner to invite the new member

### "User with this email not found" (404)
- **Cause**: The email address doesn't have a DeskFlow account
- **Fix**: Ask the person to register for an account first

### "User is already a member of this project" (400)
- **Cause**: The person you're trying to invite is already in the project
- **Fix**: They're already a member, no action needed

### "Only project owner can remove members" (403)
- **Cause**: You're trying to remove someone but you're not the owner
- **Fix**: Only the project owner can remove members

---

## Authentication Errors

### "Email, password, and name are required" (400)
- **Cause**: Registration form is incomplete
- **Fix**: Fill in all required fields

### "Invalid email format" (400)
- **Cause**: Email address is not valid
- **Fix**: Use a valid email format (e.g., user@example.com)

### "Password must be at least 6 characters long" (400)
- **Cause**: Password is too short
- **Fix**: Use a password with at least 6 characters

### "Email already registered" (409)
- **Cause**: An account with this email already exists
- **Fix**: Log in instead, or use a different email

### "Invalid email or password" (401)
- **Cause**: Login credentials are incorrect
- **Fix**: 
  - Check your email and password
  - Make sure Caps Lock is off
  - Try the forgot password feature (if available)

### "No access token provided" (401)
- **Cause**: You're not logged in or your session expired
- **Fix**: Log in again

### "Unauthorized" (401)
- **Cause**: Your session token is invalid or expired
- **Fix**: Log out and log back in

---

## Settings Errors

### "Failed to save settings"
- **Cause**: Server error or network issue
- **Fix**: 
  - Check your internet connection
  - Try again in a few moments
  - Settings are automatically saved, so try refreshing the page

---

## Project Deletion Errors

### "Only project owner can delete" (403)
- **Cause**: You're trying to delete a project but you're not the owner
- **Fix**: Only the project owner can initiate deletion

### "Cannot remove project owner" (400)
- **Cause**: Trying to remove the owner from the project
- **Fix**: The owner cannot be removed from their own project

### "Project has incomplete tasks. Confirm deletion?"
- **Cause**: The project still has tasks in To Do or In Progress
- **Fix**: 
  - Complete all tasks first
  - Or confirm that you want to delete anyway
  - If there are multiple members, all must vote to approve deletion

---

## General Network Errors

### "Failed to load projects" or "Internal server error" (500)
- **Cause**: Server issue or network problem
- **Fix**:
  1. Check your internet connection
  2. Wait a moment and try refreshing
  3. The server might be temporarily busy
  4. If it persists, try logging out and back in

### "Server returned invalid response"
- **Cause**: Unexpected response from the server
- **Fix**: 
  - Refresh the page
  - Try logging out and back in
  - Check the browser console (F12) for more details

---

## Debugging Tips

1. **Open Browser Console** (F12)
   - Shows detailed error messages
   - Displays request/response information
   - Helpful for understanding what went wrong

2. **Check Network Connection**
   - Ensure you have stable internet
   - Try refreshing the page

3. **Try Incognito/Private Mode**
   - Rules out browser extension conflicts
   - Starts with a clean cache

4. **Clear Browser Cache**
   - Can fix stale data issues
   - Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

5. **Check Toast Notifications**
   - Error messages appear as toast notifications
   - They provide immediate feedback on what went wrong

---

## Prevention Tips

### To Avoid Time Logging Errors:
1. Always create projects in Kanban Board first
2. Add tasks to the project before logging time
3. Use the refresh button if you don't see recent projects
4. Make sure you're a member of the project

### To Avoid Chat Errors:
1. Select a project before trying to send messages
2. Don't send empty messages
3. Ensure you have permission to access the project
4. Wait for the page to fully load before interacting

### To Avoid Permission Errors:
1. Know who the project owner is
2. Only owners can add/delete tasks and invite/remove members
3. If you need owner permissions, create your own project
4. Communicate with the owner if you need changes made

---

## Still Stuck?

If you're still experiencing issues:

1. Check the **TROUBLESHOOTING.md** file for detailed solutions
2. Look at the browser console for specific error codes
3. Try the action in a different browser
4. Log out completely and log back in
5. Note the exact error message and steps that caused it
