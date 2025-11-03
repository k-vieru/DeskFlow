import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Admin client for user management (with SERVICE_ROLE_KEY)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Regular client for authentication (with ANON_KEY)
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Register new user
app.post('/make-server-8f21c4d2/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Validate password length
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters long' }, 400);
    }

    // Create user with Supabase Auth (using admin client)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server configured
      user_metadata: { name }
    });

    if (error) {
      console.error('Registration error:', error);
      
      // Check if email already exists
      if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
        return c.json({ error: 'Email already registered' }, 409);
      }
      
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name
      }
    });

  } catch (error) {
    console.error('Server error during registration:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login user
app.post('/make-server-8f21c4d2/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Sign in with email and password (using regular client with ANON_KEY)
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      
      // Provide specific error messages
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }
      
      if (error.message.includes('Email not confirmed')) {
        return c.json({ error: 'Email not confirmed' }, 401);
      }
      
      return c.json({ error: 'Login failed. Please check your credentials.' }, 401);
    }

    if (!data.user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0]
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    });

  } catch (error) {
    console.error('Server error during login:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify session
app.post('/make-server-8f21c4d2/auth/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.error('Verification error:', error);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0]
      }
    });

  } catch (error) {
    console.error('Server error during verification:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
app.post('/make-server-8f21c4d2/auth/update-profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, email } = await c.req.json();

    // Update user metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: email || user.email,
        user_metadata: { name: name || user.user_metadata?.name }
      }
    );

    if (error) {
      console.error('Update profile error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Update user's name in all projects and tasks where they are involved
    if (name && name !== user.user_metadata?.name) {
      try {
        const projects = await kv.getByPrefix(`project:`);
        const updatePromises = projects
          .filter((p: any) => p.members?.includes(user.id))
          .map(async (project: any) => {
            // Update memberDetails
            if (project.memberDetails) {
              project.memberDetails = project.memberDetails.map((member: any) =>
                member.id === user.id
                  ? { ...member, name: name }
                  : member
              );
            }
            
            // Update owner name if this user is the owner
            if (project.ownerId === user.id) {
              project.ownerName = name;
            }
            
            await kv.set(`project:${project.id}`, project);
            
            // Update tasks assigned to this user in this project
            const tasks = await kv.get(`tasks:${project.id}`);
            if (tasks) {
              let tasksUpdated = false;
              
              // Update assignedToName in all columns
              ['todo', 'in-progress', 'done'].forEach((columnId) => {
                if (tasks[columnId]) {
                  tasks[columnId] = tasks[columnId].map((task: any) => {
                    if (task.assignedTo === user.id) {
                      tasksUpdated = true;
                      return { ...task, assignedToName: name };
                    }
                    return task;
                  });
                }
              });
              
              if (tasksUpdated) {
                await kv.set(`tasks:${project.id}`, tasks);
              }
            }
          });
        
        await Promise.all(updatePromises);
      } catch (projectUpdateError) {
        console.error('Error updating projects with new name:', projectUpdateError);
        // Don't fail the whole request if project updates fail
      }
    }

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });

  } catch (error) {
    console.error('Server error during profile update:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Change password
app.post('/make-server-8f21c4d2/auth/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters long' }, 400);
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (signInError) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return c.json({ error: 'Failed to update password' }, 500);
    }

    return c.json({ 
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Server error during password change:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout (invalidate token)
app.post('/make-server-8f21c4d2/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (accessToken) {
      await supabaseAdmin.auth.admin.signOut(accessToken);
    }

    return c.json({ success: true });

  } catch (error) {
    console.error('Server error during logout:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/make-server-8f21c4d2/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ PROJECT & TEAM MANAGEMENT ============

// Get all projects for a user
app.get('/make-server-8f21c4d2/projects', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projects = await kv.getByPrefix(`project:`);
    
    // Filter projects where user is owner or member
    const userProjects = projects.filter((p: any) => 
      p.ownerId === user.id || p.members?.includes(user.id)
    );

    return c.json({ success: true, projects: userProjects });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create a new project
app.post('/make-server-8f21c4d2/projects', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Project name is required' }, 400);
    }

    const projectId = crypto.randomUUID();
    const project = {
      id: projectId,
      name,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName: user.user_metadata?.name || user.email?.split('@')[0],
      members: [user.id],
      memberDetails: [{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0]
      }],
      createdAt: new Date().toISOString()
    };

    await kv.set(`project:${projectId}`, project);

    return c.json({ success: true, project });

  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Invite member to project
app.post('/make-server-8f21c4d2/projects/:projectId/invite', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Get project
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is owner
    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only project owner can invite members' }, 403);
    }

    // Find user by email
    const { data: invitedUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    const foundUser = invitedUser?.users.find(u => u.email === email);

    if (!foundUser) {
      return c.json({ error: 'User with this email not found' }, 404);
    }

    // Check if already a member
    if (project.members?.includes(foundUser.id)) {
      return c.json({ error: 'User is already a member of this project' }, 400);
    }

    // Check if already has a pending invitation
    const existingInvitation = await kv.get(`invitation:${foundUser.id}:${projectId}`);
    if (existingInvitation && existingInvitation.status === 'pending') {
      return c.json({ error: 'User already has a pending invitation for this project' }, 400);
    }

    // Create invitation (DO NOT add user to project yet)
    const invitationId = crypto.randomUUID();
    const invitation = {
      id: invitationId,
      projectId: projectId,
      projectName: project.name,
      inviterId: user.id,
      inviterName: user.user_metadata?.name || user.email?.split('@')[0],
      invitedUserId: foundUser.id,
      status: 'pending',
      invitedAt: new Date().toISOString()
    };

    await kv.set(`invitation:${foundUser.id}:${invitationId}`, invitation);

    return c.json({ success: true, message: 'Invitation sent successfully' });

  } catch (error) {
    console.error('Error inviting member:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get project members
app.get('/make-server-8f21c4d2/projects/:projectId/members', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    return c.json({ success: true, members: project.memberDetails || [] });

  } catch (error) {
    console.error('Error fetching project members:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove member from project
app.delete('/make-server-8f21c4d2/projects/:projectId/members/:memberId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const memberId = c.req.param('memberId');

    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is owner
    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only project owner can remove members' }, 403);
    }

    // Cannot remove owner
    if (memberId === project.ownerId) {
      return c.json({ error: 'Cannot remove project owner' }, 400);
    }

    // Remove member from project
    project.members = project.members.filter((id: string) => id !== memberId);
    project.memberDetails = project.memberDetails.filter((m: any) => m.id !== memberId);

    await kv.set(`project:${projectId}`, project);

    // Clean up member's data from this project
    // 1. Remove all time entries for this member in this project
    const timeEntries = await kv.get(`time-entries:${projectId}`) || [];
    const filteredTimeEntries = timeEntries.filter((entry: any) => entry.userId !== memberId);
    await kv.set(`time-entries:${projectId}`, filteredTimeEntries);

    // 2. Remove any pending invitations for this member to this project
    const invitationKeys = await kv.getByPrefix(`invitation:${memberId}:`);
    for (const inv of invitationKeys) {
      if (inv.projectId === projectId) {
        await kv.del(`invitation:${memberId}:${inv.id}`);
      }
    }

    // 3. Clear task assignments for this member in project tasks
    const tasks = await kv.get(`tasks:${projectId}`) || [];
    const updatedTasks = tasks.map((task: any) => {
      if (task.assignedTo === memberId) {
        return { ...task, assignedTo: null };
      }
      return task;
    });
    await kv.set(`tasks:${projectId}`, updatedTasks);

    return c.json({ success: true, project });

  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ NOTIFICATIONS ============

// Get user notifications
app.get('/make-server-8f21c4d2/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allNotifications = await kv.getByPrefix(`notification:`);
    
    const userNotifications = allNotifications
      .filter((n: any) => n.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ success: true, notifications: userNotifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
app.post('/make-server-8f21c4d2/notifications/:notificationId/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('notificationId');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    if (notification.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ TASK MANAGEMENT ============

// Get tasks for a project
app.get('/make-server-8f21c4d2/projects/:projectId/tasks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    const tasks = await kv.get(`tasks:${projectId}`);

    return c.json({ success: true, tasks: tasks || { todo: [], 'in-progress': [], done: [] } });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update tasks for a project
app.post('/make-server-8f21c4d2/projects/:projectId/tasks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { tasks, action } = await c.req.json();

    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    // If action is 'add' or 'delete', only owner can perform it
    if ((action === 'add' || action === 'delete') && project.ownerId !== user.id) {
      return c.json({ error: 'Only the project owner can add or delete tasks' }, 403);
    }

    await kv.set(`tasks:${projectId}`, tasks);

    return c.json({ success: true, tasks });

  } catch (error) {
    console.error('Error updating tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create notification when task is completed
app.post('/make-server-8f21c4d2/tasks/:taskId/complete', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('taskId');
    const { taskTitle, projectId } = await c.req.json();

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    // Get project to notify all members
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Create notifications for all members except the one who completed it
    const notificationPromises = project.members
      .filter((memberId: string) => memberId !== user.id)
      .map(async (memberId: string) => {
        const notificationId = crypto.randomUUID();
        const notification = {
          id: notificationId,
          userId: memberId,
          type: 'task_completed',
          message: `${user.user_metadata?.name || user.email} completed task: "${taskTitle}"`,
          taskId: taskId,
          projectId: projectId,
          read: false,
          createdAt: new Date().toISOString()
        };
        await kv.set(`notification:${notificationId}`, notification);
      });

    await Promise.all(notificationPromises);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error creating task completion notifications:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ PROJECT DELETION & VOTING ============

// Request to delete project
app.post('/make-server-8f21c4d2/projects/:projectId/delete-request', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is owner
    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only project owner can delete' }, 403);
    }

    // Check if all tasks are completed
    const tasks = await kv.get(`tasks:${projectId}`);
    const allTasks = tasks ? [...tasks.todo || [], ...tasks['in-progress'] || [], ...tasks.done || []] : [];
    const incompleteTasks = allTasks.filter((t: any) => tasks.done?.find((dt: any) => dt.id === t.id) === undefined);

    // If all tasks are done or no tasks exist, delete immediately
    if (incompleteTasks.length === 0) {
      await kv.del(`project:${projectId}`);
      await kv.del(`tasks:${projectId}`);
      await kv.del(`deletion-vote:${projectId}`);
      
      return c.json({ success: true, deleted: true, message: 'Project deleted successfully' });
    }

    // If there are incomplete tasks and only one member (the owner), require confirmation
    if (project.members.length === 1) {
      return c.json({ 
        success: false, 
        requiresConfirmation: true,
        incompleteTasks: incompleteTasks.length,
        message: 'Project has incomplete tasks. Confirm deletion?' 
      });
    }

    // If multiple members, create deletion vote
    const deleteVote = {
      projectId,
      requestedBy: user.id,
      requestedAt: new Date().toISOString(),
      votes: [user.id], // Owner automatically votes yes
      required: project.members.length,
      incompleteTasks: incompleteTasks.length
    };

    await kv.set(`deletion-vote:${projectId}`, deleteVote);

    // Notify other members
    const notificationPromises = project.members
      .filter((memberId: string) => memberId !== user.id)
      .map(async (memberId: string) => {
        const notificationId = crypto.randomUUID();
        const notification = {
          id: notificationId,
          userId: memberId,
          type: 'deletion_vote',
          message: `${user.user_metadata?.name || user.email} wants to delete project "${project.name}". Vote required!`,
          projectId: projectId,
          read: false,
          createdAt: new Date().toISOString()
        };
        await kv.set(`notification:${notificationId}`, notification);
      });

    await Promise.all(notificationPromises);

    return c.json({ 
      success: true, 
      votingRequired: true,
      votes: deleteVote.votes.length,
      required: deleteVote.required,
      message: 'Deletion vote initiated. Waiting for team approval.' 
    });

  } catch (error) {
    console.error('Error requesting project deletion:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Force delete project (owner only, when all tasks done or confirmed)
app.delete('/make-server-8f21c4d2/projects/:projectId/force', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only project owner can delete' }, 403);
    }

    // Delete project and associated data
    await kv.del(`project:${projectId}`);
    await kv.del(`tasks:${projectId}`);
    await kv.del(`deletion-vote:${projectId}`);

    return c.json({ success: true, message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Error force deleting project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Vote on project deletion
app.post('/make-server-8f21c4d2/projects/:projectId/vote-delete', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { approve } = await c.req.json();

    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    const deleteVote = await kv.get(`deletion-vote:${projectId}`);
    if (!deleteVote) {
      return c.json({ error: 'No deletion vote in progress' }, 404);
    }

    // If rejecting, cancel the vote
    if (!approve) {
      await kv.del(`deletion-vote:${projectId}`);
      
      // Notify owner
      const notificationId = crypto.randomUUID();
      const notification = {
        id: notificationId,
        userId: deleteVote.requestedBy,
        type: 'deletion_rejected',
        message: `${user.user_metadata?.name || user.email} rejected deletion of project "${project.name}"`,
        projectId: projectId,
        read: false,
        createdAt: new Date().toISOString()
      };
      await kv.set(`notification:${notificationId}`, notification);

      return c.json({ success: true, approved: false, message: 'Deletion request rejected' });
    }

    // Add vote if not already voted
    if (!deleteVote.votes.includes(user.id)) {
      deleteVote.votes.push(user.id);
      await kv.set(`deletion-vote:${projectId}`, deleteVote);
    }

    // Check if all members have voted
    if (deleteVote.votes.length >= deleteVote.required) {
      // Delete the project
      await kv.del(`project:${projectId}`);
      await kv.del(`tasks:${projectId}`);
      await kv.del(`deletion-vote:${projectId}`);

      // Notify all members
      const notificationPromises = project.members.map(async (memberId: string) => {
        const notificationId = crypto.randomUUID();
        const notification = {
          id: notificationId,
          userId: memberId,
          type: 'project_deleted',
          message: `Project "${project.name}" has been deleted`,
          projectId: projectId,
          read: false,
          createdAt: new Date().toISOString()
        };
        await kv.set(`notification:${notificationId}`, notification);
      });

      await Promise.all(notificationPromises);

      return c.json({ success: true, approved: true, deleted: true, message: 'Project deleted successfully' });
    }

    return c.json({ 
      success: true, 
      approved: true,
      votes: deleteVote.votes.length,
      required: deleteVote.required,
      message: `Vote recorded. ${deleteVote.votes.length}/${deleteVote.required} votes received.` 
    });

  } catch (error) {
    console.error('Error voting on project deletion:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get deletion vote status
app.get('/make-server-8f21c4d2/projects/:projectId/deletion-vote', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const deleteVote = await kv.get(`deletion-vote:${projectId}`);

    if (!deleteVote) {
      return c.json({ success: true, voteInProgress: false });
    }

    return c.json({ 
      success: true, 
      voteInProgress: true,
      votes: deleteVote.votes.length,
      required: deleteVote.required,
      hasVoted: deleteVote.votes.includes(user.id),
      incompleteTasks: deleteVote.incompleteTasks
    });

  } catch (error) {
    console.error('Error fetching deletion vote:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ USER SETTINGS ============

// Get user settings
app.get('/make-server-8f21c4d2/user/settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const settings = await kv.get(`user-settings:${user.id}`);

    return c.json({ 
      success: true, 
      settings: settings || { darkMode: false } 
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Save user settings
app.post('/make-server-8f21c4d2/user/settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { darkMode } = await c.req.json();

    const settings = {
      darkMode: darkMode ?? false,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user-settings:${user.id}`, settings);

    return c.json({ success: true, settings });

  } catch (error) {
    console.error('Error saving user settings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ TIME LOGGING ============

// Get time entries for a project
app.get('/make-server-8f21c4d2/projects/:projectId/time-entries', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    const timeEntries = await kv.get(`time-entries:${projectId}`) || [];

    return c.json({ success: true, timeEntries });

  } catch (error) {
    console.error('Error fetching time entries:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Log time entry for a project
app.post('/make-server-8f21c4d2/projects/:projectId/time-entries', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    console.log(`[Time Entry] Looking for project with ID: ${projectId}`);
    console.log(`[Time Entry] Searching with key: project:${projectId}`);
    
    const project = await kv.get(`project:${projectId}`);
    console.log(`[Time Entry] Project found:`, project ? 'YES' : 'NO');
    
    if (!project) {
      // List all projects to help debug
      const allProjects = await kv.getByPrefix('project:');
      console.log(`[Time Entry] Total projects in DB:`, allProjects.length);
      console.log(`[Time Entry] Available project IDs:`, allProjects.map((p: any) => p.id));
      return c.json({ 
        error: 'Project not found. Please make sure the project exists.',
        debug: {
          searchedProjectId: projectId,
          availableProjects: allProjects.length,
          projectIds: allProjects.map((p: any) => p.id)
        }
      }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (jsonError) {
      console.error('Error parsing JSON request body:', jsonError);
      return c.json({ error: 'Invalid JSON in request body' }, 400);
    }

    const { taskNames, hours, date } = requestBody;

    if (!taskNames || !Array.isArray(taskNames) || taskNames.length === 0) {
      return c.json({ error: 'At least one task is required' }, 400);
    }

    if (!hours || typeof hours !== 'number' || hours <= 0) {
      return c.json({ error: 'Valid hours value is required' }, 400);
    }

    if (!date) {
      return c.json({ error: 'Date is required' }, 400);
    }

    const entryId = crypto.randomUUID();
    const newEntry = {
      id: entryId,
      projectId,
      userId: user.id,
      userName: user.user_metadata?.name || user.email?.split('@')[0],
      taskNames,
      hours,
      date,
      createdAt: new Date().toISOString()
    };

    const timeEntries = await kv.get(`time-entries:${projectId}`) || [];
    timeEntries.push(newEntry);

    await kv.set(`time-entries:${projectId}`, timeEntries);

    return c.json({ success: true, timeEntry: newEntry });

  } catch (error) {
    console.error('Error logging time entry:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete a time entry
app.delete('/make-server-8f21c4d2/projects/:projectId/time-entries/:entryId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const entryId = c.req.param('entryId');

    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    // Get time entries
    const timeEntries = await kv.get(`time-entries:${projectId}`) || [];
    
    // Find the entry
    const entryIndex = timeEntries.findIndex((entry: any) => entry.id === entryId);
    
    if (entryIndex === -1) {
      return c.json({ error: 'Time entry not found' }, 404);
    }

    // Check if user owns this entry
    if (timeEntries[entryIndex].userId !== user.id) {
      return c.json({ error: 'You can only delete your own time entries' }, 403);
    }

    // Remove the entry
    timeEntries.splice(entryIndex, 1);
    await kv.set(`time-entries:${projectId}`, timeEntries);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error deleting time entry:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get pending invitations for current user
app.get('/make-server-8f21c4d2/pending-invitations', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all invitations for this user
    const allInvitations = await kv.getByPrefix(`invitation:${user.id}:`);
    const pendingInvitations = allInvitations.filter((inv: any) => inv.status === 'pending');

    return c.json({ invitations: pendingInvitations });

  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Accept project invitation
app.post('/make-server-8f21c4d2/invitations/:invitationId/accept', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invitationId = c.req.param('invitationId');
    
    // Get the invitation
    const invitation = await kv.get(`invitation:${user.id}:${invitationId}`);

    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation is not pending' }, 400);
    }

    // Get the project
    const project = await kv.get(`project:${invitation.projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Add user to project
    project.members = [...(project.members || []), user.id];
    project.memberDetails = [
      ...(project.memberDetails || []),
      {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0]
      }
    ];

    await kv.set(`project:${invitation.projectId}`, project);

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    await kv.set(`invitation:${user.id}:${invitationId}`, invitation);

    return c.json({ success: true, project });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Decline project invitation
app.post('/make-server-8f21c4d2/invitations/:invitationId/decline', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invitationId = c.req.param('invitationId');
    
    // Get the invitation
    const invitation = await kv.get(`invitation:${user.id}:${invitationId}`);

    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation is not pending' }, 400);
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.declinedAt = new Date().toISOString();
    await kv.set(`invitation:${user.id}:${invitationId}`, invitation);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error declining invitation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get chat messages for a project
app.get('/make-server-8f21c4d2/projects/:projectId/messages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    // Get messages
    const messages = await kv.get(`messages:${projectId}`) || [];
    
    // Get chat settings to determine auto-delete period
    const settings = await kv.get(`chat-settings:${projectId}`) || { autoDeleteDays: 7 };
    
    // Filter out messages older than autoDeleteDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.autoDeleteDays);
    
    const validMessages = messages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= cutoffDate;
    });
    
    // If messages were filtered, update the stored messages
    if (validMessages.length !== messages.length) {
      await kv.set(`messages:${projectId}`, validMessages);
    }

    return c.json({ success: true, messages: validMessages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Post a new message
app.post('/make-server-8f21c4d2/projects/:projectId/messages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { content } = await c.req.json();

    if (!content || !content.trim()) {
      return c.json({ error: 'Message content is required' }, 400);
    }

    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    const newMessage = {
      id: crypto.randomUUID(),
      content: content.trim(),
      senderId: user.id,
      senderName: user.user_metadata?.name || user.email?.split('@')[0],
      timestamp: new Date().toISOString(),
      projectId
    };

    const messages = await kv.get(`messages:${projectId}`) || [];
    messages.push(newMessage);

    await kv.set(`messages:${projectId}`, messages);

    return c.json({ success: true, message: newMessage });

  } catch (error) {
    console.error('Error posting message:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete all messages (owner only)
app.delete('/make-server-8f21c4d2/projects/:projectId/messages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is the owner
    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only the project owner can delete all messages' }, 403);
    }

    await kv.set(`messages:${projectId}`, []);

    return c.json({ success: true });

  } catch (error) {
    console.error('Error deleting messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get chat settings
app.get('/make-server-8f21c4d2/projects/:projectId/chat-settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is a member
    if (!project.members?.includes(user.id)) {
      return c.json({ error: 'Not a member of this project' }, 403);
    }

    const settings = await kv.get(`chat-settings:${projectId}`) || { autoDeleteDays: 7 };

    return c.json({ success: true, settings });

  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update chat settings (owner only)
app.put('/make-server-8f21c4d2/projects/:projectId/chat-settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { autoDeleteDays } = await c.req.json();

    if (!autoDeleteDays || autoDeleteDays < 1 || autoDeleteDays > 365) {
      return c.json({ error: 'autoDeleteDays must be between 1 and 365' }, 400);
    }

    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user is the owner
    if (project.ownerId !== user.id) {
      return c.json({ error: 'Only the project owner can update chat settings' }, 403);
    }

    const settings = { autoDeleteDays };
    await kv.set(`chat-settings:${projectId}`, settings);

    return c.json({ success: true, settings });

  } catch (error) {
    console.error('Error updating chat settings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);
