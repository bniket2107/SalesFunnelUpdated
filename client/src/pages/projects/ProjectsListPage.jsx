import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader, Button, Badge, ProgressBar, Spinner, EmptyState } from '@/components/ui';
import { FolderKanban, Plus, Search, Filter } from 'lucide-react';
import { formatDate, getStageName, getStatusColor } from '@/lib/utils';

// Role labels for display
const roleLabels = {
  admin: 'Admin',
  performance_marketer: 'Performance Marketer',
  ui_ux_designer: 'UI/UX Designer',
  graphic_designer: 'Graphic Designer',
  developer: 'Developer',
  tester: 'Tester',
};

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProjects();
  }, [status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { projectService } = await import('@/services/api');
      const response = await projectService.getProjects({ status, search });
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Projects' : 'My Projects'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Manage all client projects and assign teams.'
              : 'View and work on your assigned projects.'}
          </p>
        </div>
        {/* Only Admin can create new projects */}
        {isAdmin && (
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <Button type="submit" variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardBody className="py-12">
            <EmptyState
              icon={FolderKanban}
              title={isAdmin ? "No projects found" : "No assigned projects"}
              description={
                isAdmin
                  ? "Get started by creating your first project."
                  : "You haven't been assigned to any projects yet. Contact your administrator."
              }
              action={
                isAdmin && (
                  <Button onClick={() => navigate('/projects/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.projectName || project.businessName}
                    </h3>
                    <p className="text-sm text-gray-500">{project.customerName}</p>
                    {project.industry && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {project.industry}
                      </span>
                    )}
                  </div>
                  <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {project.overallProgress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={project.overallProgress}
                      color={project.overallProgress >= 100 ? 'success' : 'primary'}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Stage</span>
                    <span className="font-medium text-gray-900">
                      {getStageName(project.stages ? Object.keys(project.stages)[project.currentStage - 1] : 'onboarding')}
                    </span>
                  </div>

                  {/* Show team for admin */}
                  {isAdmin && project.assignedTeam && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Team</span>
                      <div className="flex -space-x-2">
                        {project.assignedTeam.performanceMarketer && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                            {project.assignedTeam.performanceMarketer.name?.charAt(0)}
                          </div>
                        )}
                        {project.assignedTeam.uiUxDesigner && (
                          <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                            {project.assignedTeam.uiUxDesigner.name?.charAt(0)}
                          </div>
                        )}
                        {project.assignedTeam.graphicDesigner && (
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                            {project.assignedTeam.graphicDesigner.name?.charAt(0)}
                          </div>
                        )}
                        {project.assignedTeam.developer && (
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                            {project.assignedTeam.developer.name?.charAt(0)}
                          </div>
                        )}
                        {project.assignedTeam.tester && (
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                            {project.assignedTeam.tester.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-500">{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}