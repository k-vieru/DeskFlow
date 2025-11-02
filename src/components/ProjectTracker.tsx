import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  deadline: string;
  team: string[];
  tasks: { total: number; completed: number };
  integration?: string;
}

const projects: Project[] = [
  {
    id: '1',
    name: 'Redesign aplicație mobile',
    description: 'Actualizare completă a UI/UX pentru aplicația mobilă',
    progress: 65,
    status: 'active',
    deadline: '2025-10-30',
    team: ['AB', 'CD', 'EF'],
    tasks: { total: 24, completed: 16 },
    integration: 'Figma',
  },
  {
    id: '2',
    name: 'Website corporativ',
    description: 'Dezvoltare website pentru client corporativ',
    progress: 40,
    status: 'active',
    deadline: '2025-11-15',
    team: ['GH', 'IJ'],
    tasks: { total: 18, completed: 7 },
    integration: 'Adobe XD',
  },
  {
    id: '3',
    name: 'Dashboard Analytics',
    description: 'Creare dashboard pentru vizualizare date',
    progress: 90,
    status: 'active',
    deadline: '2025-10-20',
    team: ['AB', 'KL'],
    tasks: { total: 15, completed: 14 },
    integration: 'Figma',
  },
];

export function ProjectTracker() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on-hold':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activ';
      case 'completed':
        return 'Finalizat';
      case 'on-hold':
        return 'În așteptare';
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-tl-[32px]">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8 pb-6 border-b border-gray-100">
        <h1 className="text-gray-900">Projects</h1>
        <Button className="bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white rounded-xl h-10">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects List */}
      <div className="flex-1 px-12 py-8 overflow-y-auto">
        <div className="space-y-6">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 bg-[#f8f9fb] border-[#e8ecf1] hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{project.name}</h3>
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    {project.integration && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {project.integration}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>
                <div className="flex -space-x-2">
                  {project.team.map((member, idx) => (
                    <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                      <AvatarFallback className="text-xs bg-[#7ba4d9] text-white">
                        {member}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                
                <div className="flex items-center justify-between text-sm pt-2">
                  <div className="text-gray-600">
                    Tasks: <span className="text-gray-900">{project.tasks.completed}/{project.tasks.total}</span>
                  </div>
                  <div className="text-gray-600">
                    Deadline: <span className="text-gray-900">
                      {new Date(project.deadline).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
