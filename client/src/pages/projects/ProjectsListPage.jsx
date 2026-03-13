import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Badge, ProgressBar, Spinner, EmptyState } from '@/components/ui';
import { FolderKanban, Plus, Search, Filter } from 'lucide-react';
import { formatDate, getStageName, getStatusColor } from '@/lib/utils';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Mock projects data
const STATIC_PROJECTS = [
  {
    _id: 'static-project-1',
    customerName: 'John Smith',
    businessName: 'Acme Corporation',
    email: 'john@acme.com',
    mobile: '+1-555-0123',
    currentStage: 2,
    overallProgress: 16,
    stages: {
      onboarding: { isCompleted: true, completedAt: new Date() },
      marketResearch: { isCompleted: false, completedAt: null },
      offerEngineering: { isCompleted: false, completedAt: null },
      trafficStrategy: { isCompleted: false, completedAt: null },
      landingPage: { isCompleted: false, completedAt: null },
      creativeStrategy: { isCompleted: false, completedAt: null }
    },
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    _id: 'static-project-2',
    customerName: 'Sarah Johnson',
    businessName: 'TechStart Inc',
    email: 'sarah@techstart.com',
    mobile: '+1-555-0456',
    currentStage: 4,
    overallProgress: 50,
    stages: {
      onboarding: { isCompleted: true, completedAt: new Date() },
      marketResearch: { isCompleted: true, completedAt: new Date() },
      offerEngineering: { isCompleted: true, completedAt: new Date() },
      trafficStrategy: { isCompleted: false, completedAt: null },
      landingPage: { isCompleted: false, completedAt: null },
      creativeStrategy: { isCompleted: false, completedAt: null }
    },
    status: 'active',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    _id: 'static-project-3',
    customerName: 'Michael Brown',
    businessName: 'Global Marketing Co',
    email: 'michael@globalmarketing.com',
    mobile: '+1-555-0789',
    currentStage: 6,
    overallProgress: 100,
    stages: {
      onboarding: { isCompleted: true, completedAt: new Date() },
      marketResearch: { isCompleted: true, completedAt: new Date() },
      offerEngineering: { isCompleted: true, completedAt: new Date() },
      trafficStrategy: { isCompleted: true, completedAt: new Date() },
      landingPage: { isCompleted: true, completedAt: new Date() },
      creativeStrategy: { isCompleted: true, completedAt: new Date() }
    },
    status: 'completed',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      if (USE_STATIC_DATA) {
        // Use static data for development
        await new Promise(resolve => setTimeout(resolve, 300));
        let filteredProjects = STATIC_PROJECTS;

        if (status) {
          filteredProjects = filteredProjects.filter(p => p.status === status);
        }

        if (search) {
          filteredProjects = filteredProjects.filter(p =>
            p.businessName.toLowerCase().includes(search.toLowerCase()) ||
            p.customerName.toLowerCase().includes(search.toLowerCase())
          );
        }

        setProjects(filteredProjects);
      } else {
        // Real API calls
        const { projectService } = await import('@/services/api');
        const response = await projectService.getProjects({ status, search });
        setProjects(response.data);
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your client projects and track progress.
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
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
              title="No projects found"
              description="Get started by creating your first project."
              action={
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
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
                      {project.businessName}
                    </h3>
                    <p className="text-sm text-gray-500">{project.customerName}</p>
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