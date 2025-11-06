import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { authService } from '../utils/auth';
import { useTheme } from '../utils/ThemeContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
}

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
  initialView?: 'settings' | 'account';
  accessToken?: string | null;
}

export function Settings({ user, onLogout, onUserUpdate, initialView = 'settings', accessToken }: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Password change states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update editedName and editedEmail when user changes
  useEffect(() => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
  }, [user]);

  // Save settings when component unmounts or settings change
  useEffect(() => {
    const saveSettings = async () => {
      if (!accessToken) return;

      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/user/settings`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              darkMode: theme === 'dark',
            }),
          }
        );
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    // Save on unmount or when settings change
    const timeoutId = setTimeout(saveSettings, 1000);
    return () => {
      clearTimeout(timeoutId);
      saveSettings();
    };
  }, [theme, accessToken]);

  const handleSaveAccount = async () => {
    if (!user) return;

    setUpdateError('');
    setIsUpdating(true);

    const result = await authService.updateProfile(editedName, editedEmail);
    setIsUpdating(false);

    if (result.success && result.user) {
      onUserUpdate(result.user);
      setIsEditDialogOpen(false);
      toast.success('Profile updated successfully! Changes will be visible to all team members.');
    } else {
      setUpdateError(result.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!user || !accessToken) return;

    setPasswordError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (initialView === 'account') {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
        <div className="flex-1 p-12 overflow-y-auto">
          <h1 className="text-4xl text-gray-900 dark:text-white mb-12">Account</h1>

          <div className="max-w-2xl space-y-8">
            <Card className="p-8 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1">Name</h3>
                  <p className="text-gray-600 dark:text-gray-400">{user?.name}</p>
                </div>
                <Button
                  variant="outline"
                  className="bg-[#d8dde6] dark:bg-[#1a1d24] hover:bg-[#c4ccd9] dark:hover:bg-[#0f1115] border-none text-gray-700 dark:text-gray-300 rounded-xl h-10 px-6"
                  onClick={() => {
                    setEditedName(user?.name || '');
                    setEditedEmail(user?.email || '');
                    setUpdateError('');
                    setIsEditDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </Card>

            <Card className="p-8 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  className="bg-[#d8dde6] dark:bg-[#1a1d24] hover:bg-[#c4ccd9] dark:hover:bg-[#0f1115] border-none text-gray-700 dark:text-gray-300 rounded-xl h-10 px-6"
                  onClick={() => {
                    setEditedName(user?.name || '');
                    setEditedEmail(user?.email || '');
                    setUpdateError('');
                    setIsEditDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </Card>

            <Card className="p-8 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1">Password</h3>
                  <p className="text-gray-600 dark:text-gray-400">••••••••</p>
                </div>
                <Button
                  variant="outline"
                  className="bg-[#d8dde6] dark:bg-[#1a1d24] hover:bg-[#c4ccd9] dark:hover:bg-[#0f1115] border-none text-gray-700 dark:text-gray-300 rounded-xl h-10 px-6 transition-all duration-150 ease-out"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setIsPasswordDialogOpen(true);
                  }}
                >
                  Change
                </Button>
              </div>
            </Card>

            <Card className="p-8 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <Button
                variant="destructive"
                className="w-full h-12 rounded-xl transition-all duration-150 ease-out"
                onClick={onLogout}
              >
                Logout
              </Button>
            </Card>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-[#252930] rounded-2xl border-none shadow-2xl p-0 overflow-hidden" aria-describedby={undefined}>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-2xl text-gray-900 dark:text-white">Edit Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 px-6 pb-6">
              {updateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-900 dark:text-gray-200">Name</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => {
                    setEditedName(e.target.value);
                    setUpdateError('');
                  }}
                  className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-900 dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedEmail}
                  onChange={(e) => {
                    setEditedEmail(e.target.value);
                    setUpdateError('');
                  }}
                  className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                  disabled={isUpdating}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-[#3a3f4a]">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-gray-200 dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1d24]"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4]"
                onClick={handleSaveAccount}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-[#252930] rounded-2xl border-none shadow-2xl p-0 overflow-hidden" aria-describedby={undefined}>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-2xl text-gray-900 dark:text-white">Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 px-6 pb-6">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                <Label htmlFor="account-current-password" className="text-gray-900 dark:text-gray-200">Current Password</Label>
                <Input
                  id="account-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                  placeholder="Enter current password"
                  disabled={isChangingPassword}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="account-new-password" className="text-gray-900 dark:text-gray-200">New Password</Label>
                <Input
                  id="account-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                  disabled={isChangingPassword}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="account-confirm-password" className="text-gray-900 dark:text-gray-200">Confirm New Password</Label>
                <Input
                  id="account-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                  placeholder="Confirm new password"
                  disabled={isChangingPassword}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-[#3a3f4a]">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-gray-200 dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1d24]"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4]"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
      <div className="flex-1 p-12 overflow-y-auto">
        <h1 className="text-4xl text-gray-900 dark:text-white mb-12">Settings</h1>

        <div className="max-w-2xl space-y-8">
          {/* Theme */}
          <div>
            <h2 className="text-2xl text-gray-900 dark:text-white mb-4">Theme</h2>
            <Card className="p-6 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xl text-gray-900 dark:text-white">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-[#4c7ce5]"
                />
              </div>
            </Card>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-2xl text-gray-900 dark:text-white mb-4">Account</h2>
            <Card className="p-6 bg-white dark:bg-[#252930] border-2 border-[#e8ecf1] dark:border-[#3a3f4a] rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xl text-gray-900 dark:text-white">Manage</span>
                <Button
                  variant="outline"
                  className="bg-[#d8dde6] dark:bg-[#1a1d24] hover:bg-[#c4ccd9] dark:hover:bg-[#0f1115] border-none text-gray-700 dark:text-gray-300 rounded-xl h-10 px-6 transition-all duration-150 ease-out"
                  onClick={() => {
                    setEditedName(user?.name || '');
                    setEditedEmail(user?.email || '');
                    setUpdateError('');
                    setIsEditDialogOpen(true);
                  }}
                >
                  Manage
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Account Management Dialog for Settings view */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-[#252930] rounded-2xl border-none shadow-2xl p-0 overflow-hidden" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl text-gray-900 dark:text-white">Manage Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-6 pb-6">
            {updateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{updateError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Label htmlFor="manage-name" className="text-gray-900 dark:text-gray-200">Name</Label>
              <Input
                id="manage-name"
                value={editedName}
                onChange={(e) => {
                  setEditedName(e.target.value);
                  setUpdateError('');
                }}
                className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="manage-email" className="text-gray-900 dark:text-gray-200">Email</Label>
              <Input
                id="manage-email"
                type="email"
                value={editedEmail}
                onChange={(e) => {
                  setEditedEmail(e.target.value);
                  setUpdateError('');
                }}
                className="h-14 rounded-xl bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-[#3a3f4a] text-gray-900 dark:text-white"
                disabled={isUpdating}
              />
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-4 pt-3 border-t border-gray-100 dark:border-[#3a3f4a]">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-gray-200 dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1d24]"
              onClick={() => {
                setEditedName(user?.name || '');
                setEditedEmail(user?.email || '');
                setUpdateError('');
              }}
              disabled={isUpdating}
            >
              Reset
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4]"
              onClick={handleSaveAccount}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-[#3a3f4a] pt-4">
            <Button
              variant="destructive"
              className="w-full h-11 rounded-xl"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
