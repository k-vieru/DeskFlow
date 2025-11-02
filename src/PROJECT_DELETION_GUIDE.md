# Project Deletion & Task Synchronization Guide

## Task Synchronization

### Overview
Tasks are now synchronized in real-time between all project members through the backend database.

### How It Works
- All task changes are saved to the backend (instead of localStorage)
- Tasks are automatically synced every 3 seconds for all team members
- When any member adds, moves, or deletes a task, all other members see the changes within seconds

### Features
- Real-time collaboration on tasks
- Automatic conflict resolution
- No data loss between sessions
- Works across all devices

## Project Deletion System

### Automatic Deletion (All Tasks Complete)
When the project owner wants to delete a project:
1. If all tasks are completed (or no tasks exist)
2. The project is deleted immediately
3. All members are notified

### Owner-Only Deletion (One Member)
If the project owner is the only member:
1. System checks for incomplete tasks
2. Shows a confirmation dialog with warning
3. Owner can confirm to force delete
4. Project and all data are permanently removed

### Voting System (Multiple Members with Incomplete Tasks)
When a project has multiple members and incomplete tasks:

#### Step 1: Deletion Request
1. Owner clicks "Delete Project" button
2. System checks task status
3. If tasks are incomplete, a deletion vote is initiated
4. Owner's vote is automatically counted as "Yes"

#### Step 2: Team Notification
1. All other members receive notifications
2. Notification appears in the Notification Center
3. Yellow banner shows in Team Management section

#### Step 3: Voting
1. Each member can:
   - Approve the deletion (vote Yes)
   - Reject the deletion (vote No)
2. Vote count is displayed: "X/Y votes received"
3. Real-time updates every 5 seconds

#### Step 4: Vote Results
- **If rejected**: Vote is cancelled, owner is notified
- **If all approve**: Project is automatically deleted
- **If deleted**: All members receive notification

## UI Elements

### Team Management Section
- "Delete Project" button (owner only)
- Yellow voting banner when vote is active
- Vote count display
- Approve/Reject buttons for members

### Notification Center
- Yellow background for deletion vote notifications
- Red background for project deleted notifications
- Real-time vote status updates

## Technical Implementation

### Backend Routes
- `POST /projects/:projectId/delete-request` - Initiate deletion
- `DELETE /projects/:projectId/force` - Force delete (owner only)
- `POST /projects/:projectId/vote-delete` - Vote on deletion
- `GET /projects/:projectId/deletion-vote` - Check vote status

### Data Storage
- Tasks: `tasks:{projectId}` in KV store
- Deletion votes: `deletion-vote:{projectId}` in KV store
- Projects: `project:{projectId}` in KV store

### Polling
- Task sync: Every 3 seconds
- Vote status: Every 5 seconds
- Notifications: Every 10 seconds

## Best Practices

1. **Complete tasks before deletion** - Makes deletion instant
2. **Communicate with team** - Discuss deletion before initiating vote
3. **Review incomplete tasks** - Check what will be lost
4. **Respond to votes promptly** - Don't keep team waiting

## Security

- Only project owner can initiate deletion
- Only project members can vote
- Votes are tracked per user
- Cannot vote twice
- Rejection by any member cancels the entire vote
