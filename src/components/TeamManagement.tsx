import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { fetchWithRetry, getUserFriendlyErrorMessage } from "../utils/fetchWithRetry";

interface Project {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  members: string[];
  memberDetails: MemberDetail[];
  createdAt: string;
}

interface MemberDetail {
  id: string;
  email: string;
  name: string;
}

interface TeamManagementProps {
  accessToken: string | null;
  currentUserId: string;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export function TeamManagement({
  accessToken,
  currentUserId,
  selectedProjectId,
  onProjectChange,
}: TeamManagementProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{ incompleteTasks: number } | null>(null);
  const [deletionVote, setDeletionVote] = useState<any>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const fetchProjects = async () => {
    if (!accessToken) return;

    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          retries: 2,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Auto-select first project if none selected
        if (!selectedProjectId && data.projects?.length > 0) {
          onProjectChange(data.projects[0].id);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Error fetching projects:", response.status, errorData);
        toast.error(getUserFriendlyErrorMessage(errorData.error || `Status ${response.status}`));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error(getUserFriendlyErrorMessage(error));
    }
  };

  useEffect(() => {
    fetchProjects();
    
    // Poll for project updates (e.g., name changes from other users)
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [accessToken, selectedProjectId]);

  // Fetch deletion vote status
  useEffect(() => {
    const fetchDeletionVote = async () => {
      if (!accessToken || !selectedProjectId) {
        setDeletionVote(null);
        return;
      }

      try {
        const response = await fetchWithRetry(
          `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/deletion-vote`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            retries: 1,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.voteInProgress) {
            setDeletionVote(data);
          } else {
            setDeletionVote(null);
          }
        }
      } catch (error) {
        console.error('Error fetching deletion vote:', error);
      }
    };

    fetchDeletionVote();
    
    // Poll for vote updates
    const interval = setInterval(fetchDeletionVote, 5000);
    return () => clearInterval(interval);
  }, [accessToken, selectedProjectId]);

  const createProject = async () => {
    if (!accessToken || !newProjectName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name: newProjectName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Project created successfully!");
        setNewProjectName("");
        setIsCreateOpen(false);
        await fetchProjects();
        onProjectChange(data.project.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!accessToken || !selectedProjectId || !inviteEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email: inviteEmail }),
        }
      );

      if (response.ok) {
        toast.success("Invitation sent! The user will need to accept it to join the project.");
        setInviteEmail("");
        setIsInviteOpen(false);
        await fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!accessToken || !selectedProjectId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Member removed successfully!");
        await fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteProject = async () => {
    if (!accessToken || !selectedProjectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/delete-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.deleted) {
          toast.success(data.message);
          onProjectChange(null);
          await fetchProjects();
        } else if (data.requiresConfirmation) {
          setDeleteWarning({ incompleteTasks: data.incompleteTasks });
          setShowDeleteConfirm(true);
        } else if (data.votingRequired) {
          toast.success(data.message);
          setDeletionVote({
            voteInProgress: true,
            votes: data.votes,
            required: data.required,
            hasVoted: true,
          });
        }
      } else {
        toast.error(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = async () => {
    if (!accessToken || !selectedProjectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/force`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Project deleted successfully');
        setShowDeleteConfirm(false);
        setDeleteWarning(null);
        onProjectChange(null);
        await fetchProjects();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error force deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteDelete = async (approve: boolean) => {
    if (!accessToken || !selectedProjectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects/${selectedProjectId}/vote-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ approve }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.deleted) {
          toast.success('Project has been deleted');
          onProjectChange(null);
          await fetchProjects();
        } else if (data.approved) {
          toast.success(data.message);
          setDeletionVote(null);
        } else {
          toast.success('Deletion request cancelled');
          setDeletionVote(null);
        }
      } else {
        toast.error(data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting on deletion:', error);
      toast.error('Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3>Team Management</h3>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  onKeyDown={(e) => e.key === "Enter" && createProject()}
                />
              </div>
              <Button onClick={createProject} disabled={loading || !newProjectName.trim()}>
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
            No projects yet. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Select Project</Label>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#252930] border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.memberDetails?.length || 0} members)
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedProject.name}</CardTitle>
                  <div className="flex gap-2">
                    {selectedProject.ownerId === currentUserId && (
                      <>
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4 mr-2" />
                              Invite
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined}>
                            <DialogHeader>
                              <DialogTitle>Invite Team Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="inviteEmail">Email Address</Label>
                                <Input
                                  id="inviteEmail"
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="member@example.com"
                                  onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                                />
                              </div>
                              <Button onClick={inviteMember} disabled={loading || !inviteEmail.trim()}>
                                Send Invitation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteProject}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {deletionVote && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                          Deletion Vote in Progress
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                          {deletionVote.incompleteTasks > 0 && (
                            <>Project has {deletionVote.incompleteTasks} incomplete task(s). </>
                          )}
                          Votes: {deletionVote.votes}/{deletionVote.required}
                        </p>
                        {!deletionVote.hasVoted && selectedProject?.ownerId !== currentUserId && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVoteDelete(true)}
                              disabled={loading}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVoteDelete(false)}
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {deletionVote.hasVoted && (
                          <Badge className="mt-2" variant="secondary">
                            You voted to delete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedProject.memberDetails?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                        {member.id === selectedProject.ownerId && (
                          <Badge variant="secondary">Owner</Badge>
                        )}
                      </div>
                      {selectedProject.ownerId === currentUserId &&
                        member.id !== selectedProject.ownerId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarning ? (
                <>
                  This project has <strong>{deleteWarning.incompleteTasks}</strong> incomplete task(s).
                  Deleting will permanently remove all tasks and project data. This action cannot be undone.
                </>
              ) : (
                <>This action cannot be undone. This will permanently delete the project and all associated data.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteConfirm(false); setDeleteWarning(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
