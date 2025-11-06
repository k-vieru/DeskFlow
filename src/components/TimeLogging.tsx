import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Clock, Plus, X, Calendar, RefreshCw, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  taskNames: string[];
  hours: number;
  date: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
}

interface Project {
  id: string;
  name: string;
  ownerId?: string;
  members?: string[];
}

interface TimeLoggingProps {
  accessToken?: string | null;
  currentUserId?: string;
}

export function TimeLogging({ accessToken, currentUserId }: TimeLoggingProps) {
  // State management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  
  // Loading states
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error states
  const [error, setError] = useState<string>('');

  // ==================== FETCH PROJECTS ====================
  const fetchProjects = async () => {
    if (!accessToken) {
      setIsLoadingProjects(false);
      return;
    }

    setIsLoadingProjects(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      const fetchedProjects = data.projects || [];
      
      setProjects(fetchedProjects);

      // Auto-select first project if none selected
      if (fetchedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(fetchedProjects[0].id);
      }

      if (fetchedProjects.length === 0) {
        setError('No projects found. Create a project in the Kanban Board to get started.');
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please refresh the page.');
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // ==================== FETCH TASKS ====================
  const fetchTasks = async () => {
    if (!accessToken || !selectedProjectId) {
      setAvailableTasks([]);
      return;
    }

    setIsLoadingTasks(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Project has no tasks yet, this is okay
          setAvailableTasks([]);
          return;
        }
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      const allTasks = [
        ...(data.tasks?.todo || []),
        ...(data.tasks?.['in-progress'] || []),
        ...(data.tasks?.done || []),
      ];
      
      setAvailableTasks(allTasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setAvailableTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // ==================== FETCH TIME ENTRIES ====================
  const fetchTimeEntries = async () => {
    if (!accessToken || !selectedProjectId) {
      setTimeEntries([]);
      return;
    }

    setIsLoadingEntries(true);
    console.log('[TimeLogging] ============ FETCHING TIME ENTRIES ============');
    console.log('[TimeLogging] Selected Project ID:', selectedProjectId);
    console.log('[TimeLogging] Project Name:', projects.find(p => p.id === selectedProjectId)?.name);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/time-entries`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Project has no time entries yet, this is okay
          setTimeEntries([]);
          return;
        }
        throw new Error('Failed to load time entries');
      }

      const data = await response.json();
      console.log('[TimeLogging] Time entries fetched:', data.timeEntries?.length || 0, 'entries');
      setTimeEntries(data.timeEntries || []);
    } catch (err: any) {
      console.error('Error fetching time entries:', err);
      setTimeEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // ==================== LOG TIME ====================
  const handleLogTime = async () => {
    // Validation
    if (!accessToken) {
      toast.error('Authentication required. Please log in.');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (selectedTasks.length === 0) {
      toast.error('Please select at least one task');
      return;
    }

    const hoursNum = parseFloat(hours);
    if (!hours || hoursNum <= 0 || isNaN(hoursNum)) {
      toast.error('Please enter valid hours (greater than 0)');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setIsSubmitting(true);

    console.log('[TimeLogging] ============ LOGGING TIME ============');
    console.log('[TimeLogging] Project ID:', selectedProjectId);
    console.log('[TimeLogging] Project Name:', projects.find(p => p.id === selectedProjectId)?.name);
    console.log('[TimeLogging] Tasks:', selectedTasks);
    console.log('[TimeLogging] Hours:', hoursNum);
    console.log('[TimeLogging] Date:', date);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/time-entries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            taskNames: selectedTasks,
            hours: hoursNum,
            date: date,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('Project not found. Please refresh the page and try again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to log time for this project.');
        } else {
          throw new Error(errorData.error || 'Failed to log time');
        }
      }

      const data = await response.json();

      if (data.success && data.timeEntry) {
        console.log('[TimeLogging] ✅ SUCCESS! Time entry saved to KV store');
        console.log('[TimeLogging] Entry Details:', data.timeEntry);
        console.log('[TimeLogging] Stored at key: time-entries:' + selectedProjectId);
        toast.success('Time logged successfully!');
        
        // Reset form
        setSelectedTasks([]);
        setHours('');
        setDate(new Date().toISOString().split('T')[0]);
        setIsDialogOpen(false);

        // Refresh time entries
        console.log('[TimeLogging] Refreshing time entries list...');
        await fetchTimeEntries();
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      console.error('Error logging time:', err);
      toast.error(err.message || 'Failed to log time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== DELETE TIME ENTRY ====================
  const handleDeleteEntry = async (entryId: string) => {
    if (!accessToken || !selectedProjectId) {
      toast.error('Authentication required');
      return;
    }

    if (!confirm('Are you sure you want to delete this time entry? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/time-entries/${entryId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete time entry');
      }

      toast.success('Time entry deleted successfully');
      fetchTimeEntries();
    } catch (error: any) {
      console.error('Error deleting time entry:', error);
      toast.error(error.message || 'Failed to delete time entry');
    }
  };

  // ==================== EFFECTS ====================
  
  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [accessToken]);

  // Load tasks when project changes
  useEffect(() => {
    fetchTasks();
  }, [accessToken, selectedProjectId]);

  // Load time entries when project changes
  useEffect(() => {
    fetchTimeEntries();
  }, [accessToken, selectedProjectId]);

  // ==================== HELPERS ====================
  
  const handleToggleTask = (taskName: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskName)
        ? prev.filter(t => t !== taskName)
        : [...prev, taskName]
    );
  };

  const userEntries = timeEntries.filter(entry => entry.userId === currentUserId);
  const totalHours = userEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // ==================== RENDER ====================

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8 pb-6 border-b border-gray-100 dark:border-[#3a3f4a]">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Time Logging</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track the time you spend on tasks
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            className="bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white disabled:opacity-50"
            disabled={projects.length === 0 || !selectedProjectId}
            onClick={() => setIsDialogOpen(true)}
            title={projects.length === 0 ? 'Create a project first' : 'Log time entry'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Time
          </Button>

          <DialogContent className="bg-white dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Log Time Entry</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Record time spent working on tasks for{' '}
                {selectedProject ? selectedProject.name : 'this project'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 dark:text-gray-300">Project</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchProjects}
                    className="h-auto p-0 text-xs text-[#4c7ce5] hover:text-[#3d6dd4] hover:bg-transparent"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-[#f8f9fb] dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        No projects available
                      </SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Selection */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Tasks</Label>
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-8 border border-[#e8ecf1] dark:border-[#3a3f4a] rounded-lg bg-[#f8f9fb] dark:bg-[#1a1d24]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#4c7ce5]" />
                  </div>
                ) : (
                  <div className="border border-[#e8ecf1] dark:border-[#3a3f4a] rounded-lg p-3 max-h-[200px] overflow-y-auto bg-[#f8f9fb] dark:bg-[#1a1d24]">
                    {availableTasks.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          No tasks available
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Create tasks in the Kanban Board first
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(task.title)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedTasks.includes(task.title)
                                ? 'bg-[#4c7ce5] text-white'
                                : 'bg-white dark:bg-[#252930] hover:bg-gray-100 dark:hover:bg-[#2a2f38] text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{task.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedTasks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTasks.map((taskName) => (
                      <Badge
                        key={taskName}
                        className="bg-[#4c7ce5] text-white hover:bg-[#3d6dd4]"
                      >
                        {taskName}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(taskName);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Hours Input */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="bg-[#f8f9fb] dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-[#f8f9fb] dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleLogTime}
                disabled={isSubmitting || selectedTasks.length === 0 || !hours || parseFloat(hours) <= 0}
                className="w-full bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  'Log Time'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-12 pt-6">
          <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="px-12 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-[300px]">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchProjects}
              className="bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f38]"
              title="Refresh projects"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {selectedProjectId && (
        <div className="px-12 pt-6">
          <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4c7ce5] flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours Logged</p>
                <p className="text-2xl text-gray-900 dark:text-white">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Time Entries List */}
      <div className="flex-1 px-12 pt-6 pb-8 overflow-y-auto">
        {selectedProjectId ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white">Recent Entries</h3>
              {isLoadingEntries && (
                <Loader2 className="w-4 h-4 animate-spin text-[#4c7ce5]" />
              )}
            </div>
            
            <div className="space-y-3">
              {userEntries.length === 0 ? (
                <Card className="p-8 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No time entries yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Start logging your time to track your progress
                    </p>
                  </div>
                </Card>
              ) : (
                userEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <Card
                      key={entry.id}
                      className="p-4 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] hover:border-[#4c7ce5] dark:hover:border-[#4c7ce5] transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#4c7ce5]" />
                          <span className="text-gray-900 dark:text-white">{entry.hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.taskNames.map((taskName, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-white dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300"
                          >
                            {taskName}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </>
        ) : (
          <Card className="p-8 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
            <div className="text-center">
              <Clock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {isLoadingProjects
                  ? 'Loading projects...'
                  : projects.length === 0
                  ? 'Create a project in the Kanban Board to start logging time'
                  : 'Select a project to view time entries'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
