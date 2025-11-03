import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { checkServerHealth } from '../utils/fetchWithRetry';
import { projectId } from '../utils/supabase/info';

interface ConnectionStatusProps {
  accessToken: string | null;
}

export function ConnectionStatus({ accessToken }: ConnectionStatusProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Perform initial health check
    performHealthCheck();

    // Check health every 30 seconds
    const interval = setInterval(performHealthCheck, 30000);
    
    return () => clearInterval(interval);
  }, [accessToken]);

  const performHealthCheck = async () => {
    setIsChecking(true);
    const result = await checkServerHealth(projectId, accessToken || undefined);
    setIsHealthy(result.healthy);
    setError(result.error || null);
    setLastCheckTime(new Date());
    setIsChecking(false);

    // Show status if there's an issue
    if (!result.healthy) {
      setShowStatus(true);
    }
  };

  // Don't show anything if connection is healthy
  if (isHealthy && !showStatus) {
    return null;
  }

  // Show warning if connection failed
  if (isHealthy === false) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium mb-1">Connection Issue Detected</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {error || 'Unable to reach server. Some features may not work.'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={performHealthCheck}
                    disabled={isChecking}
                    className="text-xs h-7"
                  >
                    {isChecking ? 'Checking...' : 'Retry'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowStatus(false)}
                    className="text-xs h-7"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show success message briefly after reconnection
  if (isHealthy && showStatus) {
    setTimeout(() => setShowStatus(false), 3000);
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-sm text-green-900 dark:text-green-100">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Connected to server</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStatus(false)}
                className="text-xs h-6 px-2"
              >
                ✓
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
