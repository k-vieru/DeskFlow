import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, TrendingUp, CheckCircle, Clock, Users, Target, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { fetchWithRetry, getUserFriendlyErrorMessage } from '../utils/fetchWithRetry';

interface ReportsProps {
  accessToken?: string | null;
  currentUserId?: string;
}

interface Project {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  taskNames: string[];
  hours: number;
  date: string;
}

interface Task {
  id: string;
  title: string;
  assignedTo?: string;
  column: string;
}

const COLORS = {
  primary: '#4c7ce5',
  secondary: '#7ba4d9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#9370DB',
  teal: '#14b8a6',
  pink: '#ec4899',
};

const CHART_COLORS = ['#4c7ce5', '#7ba4d9', '#9370DB', '#14b8a6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export function Reports({ accessToken, currentUserId }: ReportsProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'project'>('daily');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch projects');

        const data = await response.json();
        setProjects(data.projects || []);
        
        if (data.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [accessToken]);

  // Fetch time entries and tasks
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !selectedProjectId) return;

      console.log('[Reports] ============ FETCHING DATA ============');
      console.log('[Reports] Selected Project ID:', selectedProjectId);
      console.log('[Reports] Project Name:', projects.find(p => p.id === selectedProjectId)?.name);

      try {
        // Fetch time entries
        const timeResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/time-entries`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (timeResponse.ok) {
          try {
            const timeData = await timeResponse.json();
            console.log('[Reports] Time entries fetched:', timeData.timeEntries?.length || 0, 'entries');
            setTimeEntries(timeData.timeEntries || []);
          } catch (parseError) {
            console.error('[Reports] Error parsing time entries response:', parseError);
            setTimeEntries([]);
          }
        } else if (timeResponse.status === 404) {
          // Project not found or no time entries yet
          console.log('[Reports] No time entries found (404)');
          setTimeEntries([]);
        } else {
          console.error('[Reports] Failed to fetch time entries. Status:', timeResponse.status);
          setTimeEntries([]);
        }

        // Fetch tasks
        const tasksResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (tasksResponse.ok) {
          try {
            const tasksData = await tasksResponse.json();
            const allTasks = [
              ...(tasksData.tasks?.todo?.map((t: any) => ({ ...t, column: 'todo' })) || []),
              ...(tasksData.tasks?.['in-progress']?.map((t: any) => ({ ...t, column: 'in-progress' })) || []),
              ...(tasksData.tasks?.done?.map((t: any) => ({ ...t, column: 'done' })) || []),
            ];
            setTasks(allTasks);
          } catch (parseError) {
            console.error('Error parsing tasks response:', parseError);
            setTasks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [accessToken, selectedProjectId, refreshTrigger]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isOwner = selectedProject?.ownerId === currentUserId;

  // Filter entries based on view mode
  const relevantEntries = viewMode === 'personal'
    ? timeEntries.filter(e => e.userId === currentUserId)
    : timeEntries;

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'daily':
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 6);
        return { start: lastWeek, end: today };
      
      case 'weekly':
        const last4Weeks = new Date(today);
        last4Weeks.setDate(last4Weeks.getDate() - 27);
        return { start: last4Weeks, end: today };
      
      case 'project':
        return { start: new Date(0), end: today };
      
      default:
        return { start: today, end: today };
    }
  };

  const { start, end } = getDateRange();
  
  // Fix date comparison - normalize to date only (no time)
  const filteredEntries = relevantEntries.filter(entry => {
    const entryDateStr = entry.date.split('T')[0]; // Get YYYY-MM-DD only
    const entryDate = new Date(entryDateStr + 'T00:00:00'); // Normalize to midnight
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    return entryDate >= startDate && entryDate <= endDate;
  });

  // Debug logging for data filtering
  console.log('[Reports] ========== DATA FILTERING ==========');
  console.log('[Reports] - Total entries from server:', timeEntries.length);
  console.log('[Reports] - Current user ID:', currentUserId);
  console.log('[Reports] - View mode:', viewMode);
  
  if (timeEntries.length > 0) {
    console.log('[Reports] - Sample entry:', timeEntries[0]);
    console.log('[Reports] - Entry user IDs:', timeEntries.map(e => e.userId));
  }
  
  console.log('[Reports] - After personal/team filter:', relevantEntries.length);
  console.log('[Reports] - Period:', period);
  console.log('[Reports] - Date range:', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);
  
  if (relevantEntries.length > 0) {
    console.log('[Reports] - Entry dates:', relevantEntries.map(e => e.date));
  }
  
  console.log('[Reports] - After date range filter:', filteredEntries.length);
  
  if (filteredEntries.length === 0 && relevantEntries.length > 0) {
    console.warn('[Reports] ⚠️ WARNING: Entries exist but date filter excluded them all!');
  }

  // Daily performance data
  const getDailyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = filteredEntries.filter(e => e.date === dateStr);
      const hours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
      
      // Calculate tasks for this day (simplified)
      const tasksCount = dayEntries.reduce((sum, e) => sum + e.taskNames.length, 0);
      
      data.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        fullDate: dateStr,
        hours: parseFloat(hours.toFixed(1)),
        tasks: tasksCount,
        productivity: hours > 0 ? Math.min(100, Math.round((tasksCount / hours) * 20)) : 0,
      });
    }
    return data;
  };

  // Weekly performance data
  const getWeeklyData = () => {
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const weekEntries = filteredEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      const hours = weekEntries.reduce((sum, e) => sum + e.hours, 0);
      const tasksCount = weekEntries.reduce((sum, e) => sum + e.taskNames.length, 0);
      
      data.push({
        week: `Week ${4 - i}`,
        hours: parseFloat(hours.toFixed(1)),
        tasks: tasksCount,
        productivity: hours > 0 ? Math.min(100, Math.round((tasksCount / hours) * 20)) : 0,
      });
    }
    return data;
  };

  // Team time distribution
  const getTeamTimeDistribution = () => {
    if (viewMode !== 'team') return [];
    
    const userHours: { [userId: string]: { name: string; hours: number } } = {};
    
    filteredEntries.forEach(entry => {
      if (!userHours[entry.userId]) {
        userHours[entry.userId] = { name: entry.userName, hours: 0 };
      }
      userHours[entry.userId].hours += entry.hours;
    });
    
    return Object.values(userHours).map(user => ({
      name: user.name,
      hours: parseFloat(user.hours.toFixed(1)),
    }));
  };

  // Team tasks distribution
  const getTeamTasksDistribution = () => {
    if (viewMode !== 'team') return [];
    
    const userTasks: { [userId: string]: { name: string; tasks: number; completed: number; inProgress: number } } = {};
    
    tasks.forEach(task => {
      if (!task.assignedTo) return;
      
      const userName = filteredEntries.find(e => e.userId === task.assignedTo)?.userName || 'Unknown';
      if (!userTasks[task.assignedTo]) {
        userTasks[task.assignedTo] = { name: userName, tasks: 0, completed: 0, inProgress: 0 };
      }
      
      userTasks[task.assignedTo].tasks += 1;
      if (task.column === 'done') {
        userTasks[task.assignedTo].completed += 1;
      } else if (task.column === 'in-progress') {
        userTasks[task.assignedTo].inProgress += 1;
      }
    });
    
    return Object.values(userTasks);
  };

  // Performance metrics by category
  const getPerformanceByCategory = () => {
    const categories = ['Focus', 'Speed', 'Quality', 'Consistency', 'Collaboration'];
    
    // Simplified performance calculation
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);
    const avgHoursPerDay = totalHours / 7;
    const tasksCompleted = tasks.filter(t => t.column === 'done' && (viewMode === 'personal' ? t.assignedTo === currentUserId : true)).length;
    
    return categories.map(category => {
      let value = 0;
      switch (category) {
        case 'Focus':
          value = Math.min(100, avgHoursPerDay * 12);
          break;
        case 'Speed':
          value = Math.min(100, tasksCompleted * 8);
          break;
        case 'Quality':
          value = Math.min(100, 65 + Math.random() * 20);
          break;
        case 'Consistency':
          value = filteredEntries.length > 0 ? Math.min(100, (filteredEntries.length / 7) * 30) : 0;
          break;
        case 'Collaboration':
          value = viewMode === 'team' ? Math.min(100, 70 + Math.random() * 20) : Math.min(100, 60 + Math.random() * 20);
          break;
      }
      return {
        category,
        value: Math.round(value),
      };
    });
  };

  const dailyData = getDailyData();
  const weeklyData = getWeeklyData();
  const teamTimeDistribution = getTeamTimeDistribution();
  const teamTasksData = getTeamTasksDistribution();
  const performanceData = getPerformanceByCategory();

  // Calculate comprehensive stats
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);
  const completedTasks = tasks.filter(t => 
    t.column === 'done' && 
    (viewMode === 'personal' ? t.assignedTo === currentUserId : true)
  ).length;
  
  const avgHoursPerDay = totalHours / (period === 'daily' ? 7 : period === 'weekly' ? 28 : 30);
  const productivity = totalHours > 0 ? Math.round((completedTasks / totalHours) * 100) : 0;
  
  const stats = [
    {
      label: 'Tasks Completed',
      value: completedTasks.toString(),
      change: '+12%',
      icon: CheckCircle,
      color: COLORS.success,
    },
    {
      label: 'Hours Worked',
      value: totalHours.toFixed(1),
      change: '+5%',
      icon: Clock,
      color: COLORS.primary,
    },
    {
      label: 'Avg Hours/Day',
      value: avgHoursPerDay.toFixed(1),
      change: '+3%',
      icon: TrendingUp,
      color: COLORS.warning,
    },
    {
      label: viewMode === 'team' ? 'Team Members' : 'Productivity',
      value: viewMode === 'team' ? (selectedProject?.members.length || 0).toString() : `${productivity}%`,
      change: '+8%',
      icon: viewMode === 'team' ? Users : Target,
      color: viewMode === 'team' ? COLORS.purple : COLORS.teal,
    },
  ];

  const handleExport = () => {
    let csvContent = 'DeskFlow Statistics Report\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Period: ${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csvContent += `View: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}\n\n`;

    csvContent += 'SUMMARY STATISTICS\n';
    csvContent += 'Metric,Value,Change\n';
    stats.forEach(stat => {
      csvContent += `${stat.label},${stat.value},${stat.change}\n`;
    });
    csvContent += '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `deskflow-report-${period}-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully!');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#252930] p-4 rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3f4a]">
          <p className="text-sm text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8 pb-6 border-b border-gray-100 dark:border-[#3a3f4a]">
        <div>
          <h1 className="text-gray-900 dark:text-white">Statistics & Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Data from Time Logging • {timeEntries.length} {timeEntries.length === 1 ? 'entry' : 'entries'} loaded
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px] bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isOwner && (
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'personal' | 'team')}>
              <SelectTrigger className="w-[150px] bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            variant="outline"
            size="sm"
            className="bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] hover:bg-gray-100 dark:hover:bg-[#2a2f3a]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-12 pt-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, scale: 1.015, transition: { duration: 0.15 } }}
              >
                <Card className="p-4 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                      className="w-10 h-10 rounded-lg flex items-center justify-center" 
                      style={{ backgroundColor: stat.color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </motion.div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="flex-1 px-12 pb-8 overflow-y-auto">
        {/* No Data State */}
        {timeEntries.length === 0 && (
          <Card className="p-12 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
            <div className="text-center max-w-md mx-auto">
              <Clock className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-gray-900 dark:text-white mb-2">No Time Entries Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start logging your time in the Time Logging tab to see detailed statistics and analytics here.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                  <strong>Quick Start:</strong>
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4">
                  <li>1. Go to the Time Logging tab</li>
                  <li>2. Select tasks you worked on</li>
                  <li>3. Enter hours spent</li>
                  <li>4. Click "Log Time"</li>
                  <li>5. Return here to see your statistics!</li>
                </ol>
              </div>
            </div>
          </Card>
        )}

        {/* Charts - Show when there is ANY data (will show message if filtered out) */}
        {timeEntries.length > 0 && (
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly' | 'project')}>
            <TabsList className="mb-6">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="project">Whole Project</TabsTrigger>
            </TabsList>

            {/* Show message if data exists but filter excluded it */}
            {filteredEntries.length === 0 && (
              <Card className="p-8 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
                <div className="text-center">
                  <h3 className="text-lg text-yellow-900 dark:text-yellow-100 mb-2">
                    No Data for Selected Period
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                    You have {timeEntries.length} time {timeEntries.length === 1 ? 'entry' : 'entries'} total, but none match the current period/view.
                  </p>
                  <Button
                    onClick={() => setPeriod('project')}
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-gray-800"
                  >
                    View All Time (Whole Project)
                  </Button>
                </div>
              </Card>
            )}

            {viewMode === 'personal' && filteredEntries.length > 0 && (
              <>
              <TabsContent value="daily" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Hours Worked - Area Chart */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Hours Worked (Daily)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="hours" 
                          stroke={COLORS.primary} 
                          fillOpacity={1} 
                          fill="url(#colorHours)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Tasks Completed - Bar Chart */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Tasks Completed (Daily)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tasks" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Productivity Trend */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Productivity Trend</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="productivity" 
                          stroke={COLORS.teal} 
                          strokeWidth={3}
                          dot={{ fill: COLORS.teal, r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Performance Radar */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={performanceData}>
                        <PolarGrid stroke="#e8ecf1" />
                        <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                        <PolarRadiusAxis stroke="#9ca3af" />
                        <Radar name="Performance" dataKey="value" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.6} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Hours Worked - Area Chart */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Hours Worked (Weekly)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="colorHoursWeekly" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="week" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="hours" 
                          stroke={COLORS.primary} 
                          fillOpacity={1} 
                          fill="url(#colorHoursWeekly)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Tasks Completed - Bar Chart */}
                  <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Tasks Completed (Weekly)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="week" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tasks" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Combined Performance */}
                  <Card className="col-span-2 p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                    <h3 className="text-gray-900 dark:text-white mb-4">Combined Performance Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                        <XAxis dataKey="week" stroke="#9ca3af" />
                        <YAxis yAxisId="left" stroke="#9ca3af" />
                        <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="hours" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 5 }} name="Hours" />
                        <Line yAxisId="right" type="monotone" dataKey="tasks" stroke={COLORS.success} strokeWidth={3} dot={{ r: 5 }} name="Tasks" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="project" className="mt-0 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <Card className="p-8 bg-gradient-to-br from-[#4c7ce5] to-[#7ba4d9] text-white">
                    <CheckCircle className="w-12 h-12 mb-4 opacity-80" />
                    <div className="text-5xl mb-2">{completedTasks}</div>
                    <div className="text-lg opacity-90">Total Tasks</div>
                  </Card>

                  <Card className="p-8 bg-gradient-to-br from-[#10b981] to-[#14b8a6] text-white">
                    <Clock className="w-12 h-12 mb-4 opacity-80" />
                    <div className="text-5xl mb-2">{totalHours.toFixed(0)}h</div>
                    <div className="text-lg opacity-90">Total Hours</div>
                  </Card>

                  <Card className="p-8 bg-gradient-to-br from-[#f59e0b] to-[#ec4899] text-white">
                    <Target className="w-12 h-12 mb-4 opacity-80" />
                    <div className="text-5xl mb-2">{productivity}%</div>
                    <div className="text-lg opacity-90">Efficiency</div>
                  </Card>
                </div>

                <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                  <h3 className="text-gray-900 dark:text-white mb-4">Overall Performance Metrics</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#e8ecf1" />
                      <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                      <PolarRadiusAxis stroke="#9ca3af" />
                      <Radar name="Performance" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.5} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>
            </>
          )}

          {viewMode === 'team' && (
            <TabsContent value={period} className="mt-0 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Team Time Distribution */}
                <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                  <h3 className="text-gray-900 dark:text-white mb-4">Team Time Distribution</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={teamTimeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, hours }) => `${name}: ${hours}h`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="hours"
                      >
                        {teamTimeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Team Tasks Performance */}
                <Card className="p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                  <h3 className="text-gray-900 dark:text-white mb-4">Team Tasks Performance</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={teamTasksData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="completed" fill={COLORS.success} name="Completed" />
                      <Bar dataKey="inProgress" fill={COLORS.warning} name="In Progress" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Team Overview */}
                <Card className="col-span-2 p-6 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                  <h3 className="text-gray-900 dark:text-white mb-4">Team Members Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {teamTasksData.map((member, index) => (
                      <Card key={member.name} className="p-4 bg-white dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a]">
                        <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-lg text-gray-900 dark:text-white mb-1">{member.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.completed} tasks completed
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.inProgress} in progress
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          )}
          </Tabs>
        )}

        {/* Export Button */}
        {timeEntries.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleExport}
              className="bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white rounded-xl h-12 px-6 shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
