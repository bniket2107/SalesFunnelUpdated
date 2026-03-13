import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/api';
import { Card, CardBody, Button, Badge, ProgressBar, Spinner } from '@/components/ui';
import {
  FolderKanban,
  Clock,
  Play,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Palette,
  Code,
  Bug,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const ROLE_CONFIG = {
  ui_ux_designer: {
    icon: Palette,
    color: 'purple',
    stage: 'UI/UX Design',
    description: 'Design tasks will appear here.',
  },
  graphic_designer: {
    icon: Palette,
    color: 'pink',
    stage: 'Creative Strategy',
    description: 'Design tasks will appear here.',
  },
  developer: {
    icon: Code,
    color: 'green',
    stage: 'Development',
    description: 'Development tasks will appear here.',
  },
  tester: {
    icon: Bug,
    color: 'orange',
    stage: 'Testing',
    description: 'Testing tasks will appear here.',
  },
};

export default function TeamMemberDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
  });

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.ui_ux_designer;
  const Icon = roleConfig.icon;

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects({ limit: 50 });
      const assignedProjects = response.data || [];

      setProjects(assignedProjects);

      // Calculate stats
      const total = assignedProjects.length;
      const active = assignedProjects.filter(p => p.isActive && p.status === 'active').length;
      const completed = assignedProjects.filter(p => p.status === 'completed').length;

      setStats({ total, active, completed });
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(' ')[0] || 'Team Member'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your assigned projects.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/projects')}>
          <FolderKanban className="w-4 h-4 mr-2" />
          View All Projects
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className={`p-3 bg-${roleConfig.color}-100 rounded-lg`}>
                <Icon className={`w-6 h-6 text-${roleConfig.color}-600`} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* No Projects State */}
      {projects.length === 0 ? (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Projects</h3>
              <p className="text-gray-600 mb-4">
                You haven't been assigned to any projects yet. Contact your administrator to get started.
              </p>
              <Button variant="secondary" onClick={() => navigate('/projects')}>
                View All Projects
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Active Projects */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .filter(p => p.isActive && p.status === 'active')
                .map((project) => (
                  <Card
                    key={project._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <CardBody className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {project.projectName || project.businessName}
                          </h3>
                          <p className="text-sm text-gray-500">{project.customerName}</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{project.overallProgress}%</span>
                        </div>
                        <ProgressBar
                          value={project.overallProgress}
                          size="sm"
                          color={project.overallProgress === 100 ? 'success' : 'primary'}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDate(project.updatedAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project._id}`);
                          }}
                        >
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          </div>

          {/* Other Projects */}
          {projects.filter(p => !p.isActive || p.status !== 'active').length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects
                  .filter(p => !p.isActive || p.status !== 'active')
                  .map((project) => (
                    <Card
                      key={project._id}
                      className="hover:shadow-md transition-shadow cursor-pointer opacity-75"
                      onClick={() => navigate(`/projects/${project._id}`)}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {project.projectName || project.businessName}
                            </h3>
                            <p className="text-sm text-gray-500">{project.customerName}</p>
                          </div>
                          <Badge
                            variant={
                              project.status === 'completed' ? 'success' :
                              project.status === 'paused' ? 'warning' : 'default'
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                      </CardBody>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Access */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => navigate('/projects')}
                >
                  <FolderKanban className="w-5 h-5" />
                  <span className="text-sm">All Projects</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => navigate('/tasks')}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">My Tasks</span>
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}