import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Badge, ProgressBar, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Search,
  Gift,
  TrendingUp,
  FileText,
  Lightbulb,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { formatDate, getStageName, STAGE_ORDER } from '@/lib/utils';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Mock project data
const STATIC_PROJECT = {
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
};

const STAGE_ICONS = {
  onboarding: CheckCircle,
  marketResearch: Search,
  offerEngineering: Gift,
  trafficStrategy: TrendingUp,
  landingPage: FileText,
  creativeStrategy: Lightbulb,
};

const STAGE_PATHS = {
  onboarding: '/projects',
  marketResearch: '/market-research',
  offerEngineering: '/offer-engineering',
  trafficStrategy: '/traffic-strategy',
  landingPage: '/landing-pages',
  creativeStrategy: '/creative-strategy',
};

const STAGE_NAMES = {
  onboarding: 'Customer Onboarding',
  marketResearch: 'Market Research',
  offerEngineering: 'Offer Engineering',
  trafficStrategy: 'Traffic Strategy',
  landingPage: 'Landing Page & Lead Capture',
  creativeStrategy: 'Creative Strategy Execution'
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);

      if (USE_STATIC_DATA) {
        // Use static data for development
        await new Promise(resolve => setTimeout(resolve, 300));
        setProject(STATIC_PROJECT);
      } else {
        // Real API call
        const { projectService } = await import('@/services/api');
        const response = await projectService.getProject(id);
        setProject(response.data);
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      if (USE_STATIC_DATA) {
        toast.success('Project deleted successfully');
        navigate('/projects');
      } else {
        const { projectService } = await import('@/services/api');
        await projectService.deleteProject(id);
        toast.success('Project deleted successfully');
        navigate('/projects');
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Generate stage status from project stages
  const stageKeys = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stages = stageKeys.map((key, index) => {
    const stageData = project.stages[key] || {};
    const isCompleted = stageData.isCompleted || false;
    const isAccessible = index === 0 || (project.stages[stageKeys[index - 1]]?.isCompleted);

    return {
      key,
      name: STAGE_NAMES[key],
      order: index + 1,
      isCompleted,
      isAccessible,
      completedAt: stageData.completedAt,
      isLocked: !isAccessible
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.businessName}
              </h1>
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{project.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Project Progress</h2>
            <span className="text-2xl font-bold text-primary-600">
              {project.overallProgress}%
            </span>
          </div>
          <ProgressBar
            value={project.overallProgress}
            color={project.overallProgress >= 100 ? 'success' : 'primary'}
            size="lg"
          />
          <div className="mt-6">
            <StageProgressTracker stages={project.stages} currentStage={project.currentStage} />
          </div>
        </CardBody>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500">Customer Name</label>
              <p className="mt-1 font-medium text-gray-900">{project.customerName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              <p className="mt-1 font-medium text-gray-900">{project.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="mt-1 font-medium text-gray-900">{project.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Mobile</label>
              <p className="mt-1 font-medium text-gray-900">{project.mobile}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Created</label>
              <p className="mt-1 font-medium text-gray-900">{formatDate(project.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Last Updated</label>
              <p className="mt-1 font-medium text-gray-900">{formatDate(project.updatedAt)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Workflow Stages */}
      <h2 className="text-lg font-semibold text-gray-900">Workflow Stages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.key] || CheckCircle;
          const isAccessible = stage.isAccessible;
          const isCompleted = stage.isCompleted;

          return (
            <Card
              key={stage.key}
              className={`relative overflow-hidden transition-all ${
                isAccessible ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
              }`}
              onClick={() => {
                if (isAccessible) {
                  navigate(`${STAGE_PATHS[stage.key]}?projectId=${id}`);
                }
              }}
            >
              {!isAccessible && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isAccessible
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Stage {stage.order} of 6
                    </p>
                    {isAccessible && !isCompleted && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${STAGE_PATHS[stage.key]}?projectId=${id}`);
                        }}
                      >
                        {index === 0 ? 'Start' : 'Continue'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}