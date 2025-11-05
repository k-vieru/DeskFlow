import { useState, useEffect } from "react";
import { KanbanBoard } from "./components/KanbanBoard";
import { FocusMode } from "./components/FocusMode";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { TimeLogging } from "./components/TimeLogging";
import { Chat } from "./components/Chat";
import { Sidebar } from "./components/AppSidebar";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { authService, User } from "./utils/auth";
import { ThemeProvider } from "./utils/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";

type View =
  | "kanban"
  | "focus"
  | "reports"
  | "settings"
  | "account"
  | "time"
  | "chat";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] =
    useState<View>("kanban");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const result = await authService.verifySession();
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        setShowLanding(false);
        
        // Get access token from localStorage
        const sessionData = localStorage.getItem('deskflow_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setAccessToken(session.access_token);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const result = await authService.login(email, password);

    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      if (result.session?.access_token) {
        setAccessToken(result.session.access_token);
      }
      return null;
    }

    return result.error || "Login failed";
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
  ): Promise<string | null> => {
    const result = await authService.register(
      email,
      password,
      name,
    );

    if (result.success && result.user) {
      // After registration, login automatically
      const loginResult = await authService.login(
        email,
        password,
      );
      if (loginResult.success && loginResult.user) {
        setUser(loginResult.user);
        setIsAuthenticated(true);
        return null;
      }
    }

    return result.error || "Registration failed";
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setShowLanding(true);
    setCurrentView("kanban");
    setAccessToken(null);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="h-screen flex items-center justify-center bg-gradient-to-br from-[#d0d8e3] via-[#c8cfd9] to-[#b8c2d0] dark:from-[#0f1115] dark:via-[#1a1d24] dark:to-[#252930]"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.03, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-2xl text-gray-700 dark:text-gray-300"
        >
          Loading...
        </motion.div>
      </motion.div>
    );
  }

  if (showLanding && !isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <LandingPage onGetStarted={() => setShowLanding(false)} />
      </motion.div>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <LoginPage
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </motion.div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "kanban":
        return <KanbanBoard accessToken={accessToken} currentUserId={user?.id} />;
      case "focus":
        return <FocusMode />;
      case "reports":
        return <Reports accessToken={accessToken} currentUserId={user?.id} />;
      case "time":
        return <TimeLogging accessToken={accessToken} currentUserId={user?.id} />;
      case "chat":
        return <Chat accessToken={accessToken} currentUserId={user?.id} />;
      case "settings":
        return (
          <Settings
            user={user}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
            accessToken={accessToken}
          />
        );
      case "account":
        return (
          <Settings
            user={user}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
            initialView="account"
            accessToken={accessToken}
          />
        );
      default:
        return <KanbanBoard accessToken={accessToken} currentUserId={user?.id} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex h-screen bg-[#c8cfd9] dark:bg-[#1a1d24]"
    >
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
        <ConnectionStatus accessToken={accessToken} />
      </main>
      <Toaster />
    </motion.div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
