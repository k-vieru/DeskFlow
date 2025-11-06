import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PendingInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  invitedAt: string;
}

interface ProjectInvitationPopupProps {
  accessToken?: string | null;
  currentUserId?: string;
  onInvitationAccepted?: () => void;
}

export function ProjectInvitationPopup({ 
  accessToken, 
  currentUserId,
  onInvitationAccepted 
}: ProjectInvitationPopupProps) {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingInvitations();
    
    // Poll for new invitations every 10 seconds
    const interval = setInterval(fetchPendingInvitations, 10000);
    return () => clearInterval(interval);
  }, [accessToken, currentUserId]);

  const fetchPendingInvitations = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/pending-invitations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const handleAccept = async (invitationId: string) => {
    if (!accessToken) return;

    setProcessingId(invitationId);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/invitations/${invitationId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Project invitation accepted!');
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        if (onInvitationAccepted) {
          onInvitationAccepted();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!accessToken) return;

    setProcessingId(invitationId);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/invitations/${invitationId}/decline`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Invitation declined');
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 animate-fade-in">
      {pendingInvitations.map((invitation) => (
        <Card
          key={invitation.id}
          className="p-4 bg-white dark:bg-[#252930] border-2 border-blue-500 dark:border-blue-600 shadow-xl w-[380px] animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-gray-900 dark:text-white mb-1">
                Project Invitation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span className="text-gray-900 dark:text-white">
                  {invitation.inviterName}
                </span>
                {' '}invited you to join{' '}
                <span className="text-gray-900 dark:text-white">
                  {invitation.projectName}
                </span>
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAccept(invitation.id)}
                  disabled={processingId === invitation.id}
                  className="flex-1 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-9 text-sm transition-all duration-150 ease-out"
                >
                  {processingId === invitation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Accept'
                  )}
                </Button>
                <Button
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processingId === invitation.id}
                  variant="outline"
                  className="flex-1 border-[#e8ecf1] dark:border-[#3a3f4a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2f38] h-9 text-sm transition-all duration-150 ease-out"
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
