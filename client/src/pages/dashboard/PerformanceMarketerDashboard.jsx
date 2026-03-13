import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, Button, Badge, ProgressBar, Spinner } from '@/components/ui';
import { toast } from 'sonner';
import {
  FolderKanban,
  Search,
  Gift,
  TrendingUp,
  FileText,
  Lightbulb,
  CheckCircle,
  Clock,
  Play,
  ChevronRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import { formatDate, getStageName } from '@/lib/utils';

const STAGE_ICONS = {
  marketResearch: Search,
  offerEngineering: Gift,
  trafficStrategy: TrendingUp,
  landingPage: FileText,
  creativeStrategy: Lightbulb,
};

const STAGE_NAMES = {
  marketResearch: 'Market Research',
  offerEngineering: 'Offer Engineering',
  trafficStrategy: 'Traffic Strategy',
  landingPage: 'Landing Page',
  creativeStrategy: 'Creative Strategy',
};

const STAGE_PATHS = {
  marketResearch: '/market-research',
  offerEngineering: '/offer-engineering',
  trafficStrategy: '/traffic-strategy',
  landingPage: '/landing-pages',
  creativeStrategy: '/creative-strategy',
};

// Dummy data for showcase
const DUMMY_PROJECTS = [
  {
    _id: 'demo-1',
    projectName: 'TechStartup SaaS Launch',
    businessName: 'TechStartup Inc.',
    customerName: 'John Smith',
    industry: 'Technology',
    status: 'active',
    isActive: true,
    overallProgress: 65,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stages: {
      onboarding: { isCompleted: true },
      marketResearch: { isCompleted: true },
      offerEngineering: { isCompleted: true },
      trafficStrategy: { isCompleted: false, progress: 75 },
      landingPage: { isCompleted: false, progress: 0 },
      creativeStrategy: { isCompleted: false, progress: 0 },
    },
  },
  {
    _id: 'demo-2',
    projectName: 'E-commerce Fashion Brand',
    businessName: 'StyleHub',
    customerName: 'Sarah Johnson',
    industry: 'Fashion',
    status: 'active',
    isActive: true,
    overallProgress: 40,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    stages: {
      onboarding: { isCompleted: true },
      marketResearch: { isCompleted: true },
      offerEngineering: { isCompleted: false, progress: 50 },
      trafficStrategy: { isCompleted: false, progress: 0 },
      landingPage: { isCompleted: false, progress: 0 },
      creativeStrategy: { isCompleted: false, progress: 0 },
    },
  },
  {
    _id: 'demo-3',
    projectName: 'Fitness App Campaign',
    businessName: 'FitLife Solutions',
    customerName: 'Mike Davis',
    industry: 'Health & Fitness',
    status: 'active',
    isActive: true,
    overallProgress: 90,
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    stages: {
      onboarding: { isCompleted: true },
      marketResearch: { isCompleted: true },
      offerEngineering: { isCompleted: true },
      trafficStrategy: { isCompleted: true },
      landingPage: { isCompleted: true },
      creativeStrategy: { isCompleted: false, progress: 50 },
    },
  },
  {
    _id: 'demo-4',
    projectName: 'Real Estate Lead Gen',
    businessName: 'PropertyPro',
    customerName: 'Emily Brown',
    industry: 'Real Estate',
    status: 'paused',
    isActive: false,
    overallProgress: 25,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    stages: {
      onboarding: { isCompleted: true },
      marketResearch: { isCompleted: true },
      offerEngineering: { isCompleted: false, progress: 25 },
      trafficStrategy: { isCompleted: false, progress: 0 },
      landingPage: { isCompleted: false, progress: 0 },
      creativeStrategy: { isCompleted: false, progress: 0 },
    },
  },
  {
    _id: 'demo-5',
    projectName: 'Online Course Platform',
    businessName: 'LearnNow Academy',
    customerName: 'David Wilson',
    industry: 'Education',
    status: 'completed',
    isActive: false,
    overallProgress: 100,
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    stages: {
      onboarding: { isCompleted: true },
      marketResearch: { isCompleted: true },
      offerEngineering: { isCompleted: true },
      trafficStrategy: { isCompleted: true },
      landingPage: { isCompleted: true },
      creativeStrategy: { isCompleted: true },
    },
  },
];

export default function PerformanceMarketerDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    inProgress: 0,
  });

  useEffect(() => {
    // Load dummy data for showcase
    setLoading(true);

    // Simulate a brief loading delay for realistic UX
    const timer = setTimeout(() => {
      setProjects(DUMMY_PROJECTS);

      // Calculate stats
      const total = DUMMY_PROJECTS.length;
      const active = DUMMY_PROJECTS.filter(p => p.isActive && p.status === 'active').length;
      const completed = DUMMY_PROJECTS.filter(p => p.overallProgress === 100).length;
      const inProgress = DUMMY_PROJECTS.filter(p => p.overallProgress > 0 && p.overallProgress < 100).length;

      setStats({ total, active, completed, inProgress });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getNextStage = (project) => {
    const stageKeys = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];

    for (let i = 1; i < stageKeys.length; i++) {
      const key = stageKeys[i];
      const prevKey = stageKeys[i - 1];

      // Check if previous stage is completed
      const prevCompleted = project.stages?.[prevKey]?.isCompleted;

      if (!project.stages?.[key]?.isCompleted && prevCompleted) {
        return { key, name: STAGE_NAMES[key], index: i };
      }
    }

    // All stages completed or find first incomplete accessible stage
    for (let i = 1; i < stageKeys.length; i++) {
      const key = stageKeys[i];
      if (!project.stages?.[key]?.isCompleted) {
        // Check if we can access this stage
        let canAccess = true;
        for (let j = 1; j < i; j++) {
          if (!project.stages?.[stageKeys[j]]?.isCompleted) {
            canAccess = false;
            break;
          }
        }
        if (canAccess) {
          return { key, name: STAGE_NAMES[key], index: i };
        }
      }
    }

    return null;
  };

  const getStageProgress = (project) => {
    const stageKeys = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
    const completed = stageKeys.filter(key => project.stages?.[key]?.isCompleted).length;
    return { completed, total: 6 };
  };

  // Demo mode click handler - shows toast instead of navigating
  const handleDemoClick = (action) => {
    toast.info(`${action} - Demo Mode`, {
      description: 'This is a showcase demo. Full functionality requires a connected backend.',
    });
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
      {/* Demo Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-800">Demo Mode</p>
          <p className="text-sm text-blue-600">
            This dashboard shows sample data for demonstration purposes. Navigation is disabled in demo mode.
          </p>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(' ')[0] || 'Marketer'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your assigned projects and workflow stages.
          </p>
        </div>
        <Button variant="secondary" onClick={() => handleDemoClick('View All Projects')}>
          <FolderKanban className="w-4 h-4 mr-2" />
          View All Projects
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderKanban className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
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
              <Button variant="secondary" onClick={() => handleDemoClick('View All Projects')}>
                View All Projects
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Active Projects Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Active Projects</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects
                .filter(p => p.isActive && p.status === 'active')
                .slice(0, 4)
                .map((project) => {
                  const nextStage = getNextStage(project);
                  const progress = getStageProgress(project);

                  return (
                    <Card
                      key={project._id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardBody className="p-6">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {project.projectName || project.businessName}
                              </h3>
                              <Badge variant="success">Active</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{project.customerName}</p>
                            {project.industry && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {project.industry}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDemoClick('View Project')}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {progress.completed}/{progress.total} stages
                            </span>
                          </div>
                          <ProgressBar
                            value={(progress.completed / progress.total) * 100}
                            color={progress.completed === progress.total ? 'success' : 'primary'}
                          />
                        </div>

                        {/* Next Stage Action */}
                        {nextStage ? (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  {(() => {
                                    const Icon = STAGE_ICONS[nextStage.key] || Search;
                                    return <Icon className="w-5 h-5 text-blue-600" />;
                                  })()}
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Next Stage</p>
                                  <p className="font-medium text-gray-900">{nextStage.name}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleDemoClick(`Continue to ${nextStage.name}`)}
                              >
                                Continue
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">All stages completed!</p>
                                <p className="text-sm text-green-600">This project is ready for final review.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Last Updated */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Last updated: {formatDate(project.updatedAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDemoClick('View Details')}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Other Projects */}
          {projects.filter(p => !p.isActive || p.status !== 'active').length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects
                  .filter(p => !p.isActive || p.status !== 'active')
                  .map((project) => {
                    const progress = getStageProgress(project);

                    return (
                      <Card
                        key={project._id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleDemoClick('View Project')}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between mb-3">
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

                          <div className="mb-2">
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

                          <p className="text-xs text-gray-500">
                            Updated {formatDate(project.updatedAt)}
                          </p>
                        </CardBody>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(STAGE_NAMES).map(([key, name]) => {
                  const Icon = STAGE_ICONS[key];

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => handleDemoClick(`Open ${name}`)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{name}</span>
                    </Button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}