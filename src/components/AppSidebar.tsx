import { KanbanSquare, BarChart3, Circle, Settings as SettingsIcon, User, Clock, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

type View = 'kanban' | 'focus' | 'reports' | 'settings' | 'account' | 'time' | 'chat';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'kanban' as View, icon: KanbanSquare, label: 'Tasks' },
    { id: 'reports' as View, icon: BarChart3, label: 'Statistics' },
    { id: 'time' as View, icon: Clock, label: 'Time Logging' },
    { id: 'chat' as View, icon: MessageCircle, label: 'Team Chat' },
    { id: 'focus' as View, icon: Circle, label: 'Focus Mode' },
    { id: 'settings' as View, icon: SettingsIcon, label: 'Settings' },
    { id: 'account' as View, icon: User, label: 'Account' },
  ];

  return (
    <aside className="w-[280px] bg-[#d8dde6] dark:bg-[#252930] flex flex-col py-8 px-6">
      <div className="mb-8">
        <h2 className="text-2xl text-gray-900 dark:text-white mb-8">DeskFlow</h2>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-xl ${
                isActive 
                  ? 'bg-[#c4ccd9] dark:bg-[#1a1d24] text-gray-900 dark:text-white hover:bg-[#c4ccd9] dark:hover:bg-[#1a1d24]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-[#c4ccd9] dark:hover:bg-[#1a1d24] hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
