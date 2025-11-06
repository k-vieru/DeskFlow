import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  MessageCircle, 
  Send, 
  Settings, 
  Trash2,
  Clock,
  Users,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  projectId: string;
}

interface ChatSettings {
  autoDeleteDays: number;
}

interface ChatProps {
  accessToken?: string | null;
  currentUserId?: string;
}

interface Project {
  id: string;
  name: string;
  ownerId: string;
}

export function Chat({ accessToken, currentUserId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({ autoDeleteDays: 7 });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
          
          // Auto-select first project if none selected
          if (data.projects && data.projects.length > 0 && !selectedProjectId) {
            const firstProject = data.projects[0];
            setSelectedProjectId(firstProject.id);
            setIsOwner(firstProject.ownerId === currentUserId);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [accessToken, currentUserId]);

  // Update isOwner when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId && currentUserId) {
      const project = projects.find(p => p.id === selectedProjectId);
      setIsOwner(project?.ownerId === currentUserId);
    }
  }, [selectedProjectId, currentUserId, projects]);

  // Fetch messages and settings
  useEffect(() => {
    if (!accessToken || !selectedProjectId) return;

    const fetchData = async () => {
      try {
        // Fetch messages
        const messagesResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }

        // Fetch chat settings
        const settingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/chat-settings`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.settings) {
            setChatSettings(settingsData.settings);
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };

    fetchData();

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [accessToken, selectedProjectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !accessToken || !selectedProjectId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newMessage,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleUpdateSettings = async () => {
    if (!accessToken || !selectedProjectId || !isOwner) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/chat-settings`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatSettings),
        }
      );

      if (response.ok) {
        toast.success('Chat settings updated');
        setIsSettingsOpen(false);
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleClearMessages = async () => {
    if (!accessToken || !selectedProjectId || !isOwner) return;

    if (!confirm('Are you sure you want to delete all messages? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/messages`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setMessages([]);
        toast.success('All messages deleted');
      } else {
        toast.error('Failed to delete messages');
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!accessToken || !selectedProjectId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="p-8 bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-900 dark:text-white mb-2">
            Select a Project
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a project to start chatting with your team members.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#c8cfd9] dark:bg-[#1a1d24]">
      {/* Header */}
      <div className="bg-white dark:bg-[#252930] border-b border-[#e8ecf1] dark:border-[#3a3f4a] px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-gray-900 dark:text-white">Team Chat</h1>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                {/* Project Selector */}
                {projects.length > 1 ? (
                  <Select value={selectedProjectId || undefined} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="h-7 w-[200px] bg-transparent border-none text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-0">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
                      {projects.map(project => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id}
                          className="text-gray-900 dark:text-white hover:bg-[#f8f9fb] dark:hover:bg-[#1a1d24]"
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProject?.name || 'Project Chat'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              <Clock className="w-3 h-3 mr-1" />
              Auto-delete: {chatSettings.autoDeleteDays} days
            </Badge>
            {isOwner && (
              <>
                <Button
                  onClick={() => setIsSettingsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  onClick={handleClearMessages}
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-[#1a1d24] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-8 py-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-12"
              >
                <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg text-gray-900 dark:text-white mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to send a message to your team!
                </p>
              </motion.div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.senderId === currentUserId;
                return (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.02
                    }}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.02 + 0.1, type: "spring", stiffness: 200 }}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className={`${
                          isCurrentUser 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-br from-green-500 to-teal-600'
                        } text-white`}>
                          {message.senderName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <Card className={`p-3 ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0'
                          : 'bg-[#f8f9fb] dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </Card>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-white dark:bg-[#252930] border-t border-[#e8ecf1] dark:border-[#3a3f4a] px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message... (Press Enter to send)"
              className="flex-1 bg-[#f8f9fb] dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 px-6 shadow-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-white dark:bg-[#252930] border-[#e8ecf1] dark:border-[#3a3f4a]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Chat Settings
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Configure how long messages are kept before auto-deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">
                Auto-delete messages after (days)
              </Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={chatSettings.autoDeleteDays}
                onChange={(e) => setChatSettings({ 
                  autoDeleteDays: parseInt(e.target.value) || 7 
                })}
                className="bg-[#f8f9fb] dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a]"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Messages older than this will be automatically deleted. Minimum: 1 day, Maximum: 365 days.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Note:</strong> Only the project owner can change this setting. 
                Deleted messages cannot be recovered.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              className="bg-white dark:bg-[#1a1d24] border-[#e8ecf1] dark:border-[#3a3f4a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSettings}
              className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
