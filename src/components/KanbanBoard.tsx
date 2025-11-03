import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Plus, X, Trash2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TeamManagement } from './TeamManagement';
import { ProjectInvitationPopup } from './ProjectInvitationPopup';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  projectId?: string;
  color?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  accessToken?: string | null;
  currentUserId?: string;
}

interface MemberDetail {
  id: string;
  email: string;
  name: string;
}

const getDefaultColumns = (): Column[] => {
  return [
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ];
};

export function KanbanBoard({ accessToken, currentUserId }: KanbanBoardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>(getDefaultColumns());
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('todo');
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', assignedTo: '', color: 'sky' });
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<MemberDetail[]>([]);
  const [projectOwnerId, setProjectOwnerId] = useState<string | null>(null);

  const colorOptions = [
    { id: 'sky', label: 'Sky', class: 'bg-sky' },
    { id: 'lavender', label: 'Lavender', class: 'bg-lavender' },
    { id: 'mint', label: 'Mint', class: 'bg-mint' },
    { id: 'peach', label: 'Peach', class: 'bg-peach' },
    { id: 'rose', label: 'Rose', class: 'bg-rose' },
    { id: 'lemon', label: 'Lemon', class: 'bg-lemon' },
    { id: 'coral', label: 'Coral', class: 'bg-coral' },
    { id: 'teal', label: 'Teal', class: 'bg-teal' },
    { id: 'violet', label: 'Violet', class: 'bg-violet' },
    { id: 'amber', label: 'Amber', class: 'bg-amber' },
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald' },
    { id: 'pink', label: 'Pink', class: 'bg-pink' },
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan' },
    { id: 'orange', label: 'Orange', class: 'bg-orange' },
    { id: 'purple', label: 'Purple', class: 'bg-purple' },
  ];

  // Fetch tasks function (extracted so it can be used by invitation popup)
  const fetchTasks = async () => {
    if (!accessToken || !selectedProjectId) {
      setColumns(getDefaultColumns());
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tasksData = data.tasks;
        
        setColumns([
          { id: 'todo', title: 'To Do', tasks: tasksData.todo || [] },
          { id: 'in-progress', title: 'In Progress', tasks: tasksData['in-progress'] || [] },
          { id: 'done', title: 'Done', tasks: tasksData.done || [] },
        ]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch tasks from backend when project changes
  useEffect(() => {
    fetchTasks();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [selectedProjectId, accessToken]);

  // Fetch project members
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!accessToken || !selectedProjectId) {
        setProjectMembers([]);
        setProjectOwnerId(null);
        return;
      }

      try {
        // Get project members
        const membersResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/members`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setProjectMembers(membersData.members || []);
        }

        // Get project details for owner ID
        const projectsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const currentProject = projectsData.projects?.find((p: any) => p.id === selectedProjectId);
          if (currentProject) {
            setProjectOwnerId(currentProject.ownerId);
          }
        }
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };

    fetchProjectMembers();
  }, [accessToken, selectedProjectId]);

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Save tasks to backend
  const saveTasks = async (updatedColumns: Column[], action?: 'add' | 'delete' | 'move') => {
    if (!accessToken || !selectedProjectId) return;

    const tasksData = {
      todo: updatedColumns.find(col => col.id === 'todo')?.tasks || [],
      'in-progress': updatedColumns.find(col => col.id === 'in-progress')?.tasks || [],
      done: updatedColumns.find(col => col.id === 'done')?.tasks || [],
    };

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tasks: tasksData,
            action: action || 'move',
          }),
        }
      );
    } catch (error) {
      console.error('Error saving tasks:', error);
      toast.error('Failed to save tasks');
    }
  };

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedTask) return;

    const wasInDone = draggedTask.columnId === 'done';
    const isMovingToDone = targetColumnId === 'done';

    const newColumns = columns.map((col) => {
      if (col.id === draggedTask.columnId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, draggedTask.task],
        };
      }
      return col;
    });

    setColumns(newColumns);
    await saveTasks(newColumns, 'move');

    // Send notification if task moved to Done and we have access token
    if (!wasInDone && isMovingToDone && accessToken && selectedProjectId) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/tasks/${draggedTask.task.id}/complete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              taskTitle: draggedTask.task.title,
              projectId: selectedProjectId,
            }),
          }
        );
        toast.success('Task completed! Team members notified.');
      } catch (error) {
        console.error('Error sending task completion notification:', error);
      }
    }

    setDraggedTask(null);
  };

  const openAddTaskDialog = (columnId: string) => {
    setSelectedColumn(columnId);
    setNewTask({ title: '', description: '', dueDate: '', assignedTo: '', color: 'sky' });
    setIsAddTaskOpen(true);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const assignedMember = projectMembers.find(m => m.id === newTask.assignedTo);

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.dueDate || undefined,
      assignedTo: newTask.assignedTo || undefined,
      assignedToName: assignedMember?.name,
      projectId: selectedProjectId || undefined,
      color: newTask.color || 'sky',
    };

    const newColumns = columns.map(col => 
      col.id === selectedColumn 
        ? { ...col, tasks: [...col.tasks, task] }
        : col
    );

    setColumns(newColumns);
    await saveTasks(newColumns, 'add');

    setIsAddTaskOpen(false);
    setNewTask({ title: '', description: '', dueDate: '', assignedTo: '', color: 'sky' });
    toast.success('Task added successfully');
  };

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    const newColumns = columns.map(col =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        : col
    );
    
    setColumns(newColumns);
    await saveTasks(newColumns, 'delete');
    toast.success('Task deleted successfully');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const doneTasks = columns.find(col => col.id === 'done')?.tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const isOwner = currentUserId === projectOwnerId;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px] relative">
      {/* Project Invitation Popup */}
      <ProjectInvitationPopup 
        accessToken={accessToken} 
        currentUserId={currentUserId}
        onInvitationAccepted={fetchTasks}
      />
      
      {/* Header */}
      <div className="flex items-center justify-center px-12 pt-8 pb-6 relative">
        <h1 className="text-gray-900 dark:text-white">DeskFlow</h1>
      </div>

      {/* Team Management Section */}
      {accessToken && currentUserId && (
        <div className="px-12 pb-6">
          <TeamManagement
            accessToken={accessToken}
            currentUserId={currentUserId}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
          />
        </div>
      )}

      {/* Info message for team members */}
      {selectedProjectId && !isOwner && (
        <div className="px-12 pb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <User className="w-4 h-4 inline mr-2" />
              You can move tasks between columns. Only the project owner can add or delete tasks.
            </p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 px-12 pb-8 overflow-hidden">
        <div className="flex gap-6 h-full">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-1 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <h2 className="text-gray-900 dark:text-white mb-6">{column.title}</h2>

              <div className="flex-1 space-y-4 overflow-y-auto pb-4">
                {column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    className="p-4 cursor-move hover:shadow-md transition-shadow bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] group relative overflow-hidden"
                  >
                    {/* Color accent bar */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-${task.color || 'sky'}`}
                    />
                    <div className="pl-2">
                      <div className="flex items-start justify-between">
                        <p className="text-gray-900 dark:text-white flex-1">{task.title}</p>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteTask(task.id, column.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">Due: {task.dueDate}</p>
                        )}
                        {task.assignedTo && task.assignedToName && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                                {getInitials(task.assignedToName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {task.assignedToName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {isOwner && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f8f9fb] dark:hover:bg-[#252930] border border-dashed border-gray-300 dark:border-[#3a3f4a]"
                    onClick={() => openAddTaskDialog(column.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Progress Circle */}
          <div className="flex-shrink-0 flex items-start justify-center pt-16">
            <button 
              onClick={() => setIsStatsOpen(true)}
              className="relative w-32 h-32 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e8ecf1"
                  strokeWidth="12"
                  fill="none"
                  className="dark:stroke-[#3a3f4a]"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#4c7ce5"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl text-gray-900 dark:text-white">{progress}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dialog */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="sm:max-w-[800px] bg-[#e8ecf1] dark:bg-[#252930] rounded-3xl border-none shadow-2xl p-12" aria-describedby={undefined}>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-4xl text-gray-900 dark:text-white">Statistics</DialogTitle>
          </DialogHeader>
          
          <Card className="p-10 bg-white dark:bg-[#1a1d24] border-none rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-3xl text-gray-900 dark:text-white mb-8">Task Completion</h3>
              </div>
              
              <div className="relative w-48 h-48">
                <svg className="w-48 h-48 -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e8ecf1"
                    strokeWidth="24"
                    fill="none"
                    className="dark:stroke-[#3a3f4a]"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#4c7ce5"
                    strokeWidth="24"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl text-gray-900 dark:text-white">{progress}%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center p-4 bg-[#f8f9fb] dark:bg-[#252930] rounded-xl">
                <div className="text-3xl text-gray-900 dark:text-white">{doneTasks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center p-4 bg-[#f8f9fb] dark:bg-[#252930] rounded-xl">
                <div className="text-3xl text-gray-900 dark:text-white">{totalTasks - doneTasks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            </div>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#252930] rounded-3xl border-none shadow-2xl p-8" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 dark:text-white">Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-gray-900 dark:text-gray-200">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 h-14 rounded-xl"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-gray-900 dark:text-gray-200">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl min-h-[120px]"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="dueDate" className="text-gray-900 dark:text-gray-200">Due date</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white h-14 rounded-xl"
              />
            </div>
            {projectMembers.length > 0 && (
              <div className="space-y-3">
                <Label htmlFor="assignedTo" className="text-gray-900 dark:text-gray-200">Assign to</Label>
                <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                  <SelectTrigger className="w-full h-14 bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] rounded-xl text-gray-900 dark:text-white">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#252930] border-gray-200 dark:border-[#3a3f4a]">
                    <SelectItem value="" className="text-gray-900 dark:text-white">Unassigned</SelectItem>
                    {projectMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="text-gray-900 dark:text-white">
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-3">
              <Label className="text-gray-900 dark:text-gray-200">Color</Label>
              <div className="flex gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setNewTask({ ...newTask, color: color.id })}
                    className={`w-12 h-12 rounded-xl ${color.class} transition-all hover:scale-110 ${
                      newTask.color === color.id 
                        ? 'ring-4 ring-gray-400 dark:ring-gray-500 ring-offset-2 dark:ring-offset-[#252930]' 
                        : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsAddTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white"
                onClick={handleAddTask}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
