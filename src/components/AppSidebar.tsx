import { KanbanSquare, BarChart3, Circle, Settings as SettingsIcon, User, Clock, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

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
    <motion.aside 
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-[280px] bg-[#d8dde6] dark:bg-[#252930] flex flex-col py-8 px-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.2, ease: "easeOut" }}
        className="mb-8"
      >
        <h2 className="text-2xl text-gray-900 dark:text-white mb-8">DeskFlow</h2>
      </motion.div>

      <nav className="space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.03, duration: 0.2, ease: "easeOut" }}
              whileHover={{ x: 3, transition: { duration: 0.1 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 rounded-xl transition-all duration-150 ease-out ${
                  isActive 
                    ? 'bg-[#c4ccd9] dark:bg-[#1a1d24] text-gray-900 dark:text-white hover:bg-[#c4ccd9] dark:hover:bg-[#1a1d24]' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-[#c4ccd9] dark:hover:bg-[#1a1d24] hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </nav>
    </motion.aside>
  );
}
