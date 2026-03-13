import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner, Badge } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, Plus, X, CheckCircle, Palette, Video, FileVideo, User } from 'lucide-react';
import { taskService, creativeService, projectService } from '@/services/api';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Mock project data with landing page completed
const STATIC_PROJECT = {
  _id: 'static-project-1',
  customerName: 'John Smith',
  businessName: 'Acme Corporation',
  email: 'john@acme.com',
  mobile: '+1-555-0123',
  currentStage: 6,
  overallProgress: 83,
  stages: {
    onboarding: { isCompleted: true, completedAt: new Date() },
    marketResearch: { isCompleted: true, completedAt: new Date() },
    offerEngineering: { isCompleted: true, completedAt: new Date() },
    trafficStrategy: { isCompleted: true, completedAt: new Date() },
    landingPage: { isCompleted: true, completedAt: new Date() },
    creativeStrategy: { isCompleted: false, completedAt: null }
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock creative strategy data
const STATIC_CREATIVE = {
  stages: {
    awareness: {
      count: 2,
      creatives: [
        { name: 'Awareness Ad 1', creativeType: 'image', platform: 'facebook', status: 'approved', notes: 'Main brand awareness ad' },
        { name: 'Awareness Video', creativeType: 'video', platform: 'youtube', status: 'in_progress', notes: '60-second brand story' }
      ]
    },
    consideration: {
      count: 1,
      creatives: [
        { name: 'Case Study', creativeType: 'carousel', platform: 'facebook', status: 'pending', notes: 'Success story carousel' }
      ]
    },
    conversion: {
      count: 1,
      creatives: [
        { name: 'Special Offer', creativeType: 'image', platform: 'instagram', status: 'pending', notes: 'Limited time offer' }
      ]
    }
  },
  creativeBrief: 'Focus on emotional storytelling and clear value propositions. Use brand colors: blue and gold.',
  isCompleted: false
};

const STAGES = [
  { id: 'awareness', label: 'Awareness', description: 'Create awareness about your brand/product' },
  { id: 'consideration', label: 'Consideration', description: 'Engage interested prospects' },
  { id: 'conversion', label: 'Conversion', description: 'Drive action and sales' },
];

const CREATIVE_TYPES = [
  { id: 'static_creative', label: 'Static Creative', icon: Palette, description: 'Images, graphics, designs' },
  { id: 'video_creative', label: 'Video Creative', icon: Video, description: 'Video productions' },
  { id: 'video_content', label: 'Video Content', icon: FileVideo, description: 'Scripts, storyboards' },
];

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter' },
];

const CREATIVE_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { id: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

export default function CreativeStrategyPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stages, setStages] = useState({
    awareness: { count: 0, creatives: [] },
    consideration: { count: 0, creatives: [] },
    conversion: { count: 0, creatives: [] },
  });
  const [creativeBrief, setCreativeBrief] = useState('');
  const [teamMembers, setTeamMembers] = useState({ contentWriters: [], designers: [] });

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchData();
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      const res = await taskService.getTeamMembers();
      setTeamMembers(res.data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      // Use mock data in static mode
      if (USE_STATIC_DATA) {
        setTeamMembers({
          contentWriters: [
            { _id: 'cw1', name: 'Sarah Writer', email: 'sarah@growthvalley.com' },
            { _id: 'cw2', name: 'Mike Content', email: 'mike@growthvalley.com' }
          ],
          designers: [
            { _id: 'd1', name: 'Alex Designer', email: 'alex@growthvalley.com' },
            { _id: 'd2', name: 'Lisa Creative', email: 'lisa@growthvalley.com' }
          ]
        });
      }
    }
  };

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (USE_STATIC_DATA) {
        // Use static data for development
        setProject(STATIC_PROJECT);
        setStages(STATIC_CREATIVE.stages);
        setCreativeBrief(STATIC_CREATIVE.creativeBrief);
        setIsCompleted(STATIC_CREATIVE.isCompleted);
      } else {
        // Real API calls
        const { projectService, creativeService } = await import('@/services/api');
        const [projectRes, creativeRes] = await Promise.all([
          projectService.getProject(projectId),
          creativeService.get(projectId),
        ]);
        setProject(projectRes.data);

        if (creativeRes.data) {
          const stageData = { awareness: { count: 0, creatives: [] }, consideration: { count: 0, creatives: [] }, conversion: { count: 0, creatives: [] } };
          creativeRes.data.stages?.forEach(s => {
            stageData[s.stage] = {
              count: s.creatives?.length || 0,
              creatives: s.creatives || [],
            };
          });
          setStages(stageData);
          setCreativeBrief(creativeRes.data.creativeBrief || '');
          setIsCompleted(creativeRes.data.isCompleted);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load creative strategy');
      if (error.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCreatives = (stageId) => {
    const count = stages[stageId].count;
    if (count <= 0) return;

    // Generate placeholder creatives
    const newCreatives = Array.from({ length: count }, (_, i) => ({
      name: `${stageId.charAt(0).toUpperCase() + stageId.slice(1)} Creative ${i + 1}`,
      creativeType: 'static_creative',
      platform: 'facebook',
      status: 'pending',
      contentStatus: 'pending',
      designStatus: 'pending',
    }));

    setStages({
      ...stages,
      [stageId]: { count, creatives: newCreatives },
    });
  };

  const updateCreative = (stageId, index, field, value) => {
    const newStages = { ...stages };
    newStages[stageId].creatives[index][field] = value;
    setStages(newStages);
  };

  const addCreative = (stageId) => {
    const newStages = { ...stages };
    newStages[stageId].creatives.push({
      name: `${stageId.charAt(0).toUpperCase() + stageId.slice(1)} Creative ${newStages[stageId].creatives.length + 1}`,
      creativeType: 'static_creative',
      platform: 'facebook',
      status: 'pending',
      contentStatus: 'pending',
      designStatus: 'pending',
    });
    setStages(newStages);
  };

  const removeCreative = (stageId, index) => {
    const newStages = { ...stages };
    newStages[stageId].creatives.splice(index, 1);
    setStages(newStages);
  };

  const onSubmit = async (markComplete = false) => {
    try {
      setSaving(true);

      if (USE_STATIC_DATA) {
        // Static mode - simulate save
        await new Promise(resolve => setTimeout(resolve, 500));
        if (markComplete) {
          setIsCompleted(true);
          setProject(prev => ({
            ...prev,
            stages: {
              ...prev.stages,
              creativeStrategy: { isCompleted: true, completedAt: new Date() }
            },
            currentStage: 6,
            overallProgress: 100
          }));
          toast.success('Creative strategy completed! Project is now complete!');
          setTimeout(() => {
            navigate(`/projects/${projectId}`);
          }, 1500);
        } else {
          toast.success('Progress saved!');
        }
      } else {
        // Real API call
        const { creativeService } = await import('@/services/api');
        const stagesData = Object.entries(stages).map(([stage, data]) => ({
          stage,
          creatives: data.creatives,
          totalCreatives: data.creatives.length,
        }));

        await creativeService.upsert(projectId, {
          stages: stagesData,
          creativeBrief,
          isCompleted: markComplete,
        });
        toast.success(markComplete ? 'Creative strategy completed!' : 'Progress saved!');
        if (markComplete) {
          navigate(`/projects/${projectId}`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save creative strategy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate total creatives
  const totalCreatives = Object.values(stages).reduce((sum, stage) => sum + stage.creatives.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Creative Strategy</h1>
          <p className="text-gray-600 mt-1">{project?.businessName}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Creatives</div>
          <div className="text-2xl font-bold text-primary-600">{totalCreatives}</div>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-800">Project Completed!</h3>
            <p className="text-sm text-green-600">All stages have been completed successfully.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      {/* Creative Brief */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Creative Brief</h2>
          <p className="text-sm text-gray-500">Define your overall creative direction</p>
        </CardHeader>
        <CardBody>
          <Textarea
            placeholder="Describe your creative strategy, brand guidelines, and key messaging..."
            rows={4}
            value={creativeBrief}
            onChange={(e) => setCreativeBrief(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Stages */}
      {STAGES.map((stage) => (
        <Card key={stage.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{stage.label}</h2>
                <p className="text-sm text-gray-500">{stage.description}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => addCreative(stage.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Creative
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {stages[stage.id].creatives.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No creatives added yet for this stage</p>
                <div className="flex items-center justify-center gap-4">
                  <Input
                    type="number"
                    placeholder="Number of creatives"
                    value={stages[stage.id].count}
                    onChange={(e) => setStages({
                      ...stages,
                      [stage.id]: { ...stages[stage.id], count: Number(e.target.value) },
                    })}
                    className="w-32"
                    min="0"
                  />
                  <Button onClick={() => generateCreatives(stage.id)}>
                    Generate Cards
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {stages[stage.id].creatives.map((creative, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        value={creative.name}
                        onChange={(e) => updateCreative(stage.id, index, 'name', e.target.value)}
                        className="max-w-xs font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCreative(stage.id, index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Task Status Badges */}
                    <div className="flex gap-2 mb-3">
                      {creative.contentStatus && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          creative.contentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          creative.contentStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          creative.contentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Content: {creative.contentStatus}
                        </span>
                      )}
                      {creative.designStatus && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          creative.designStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          creative.designStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          creative.designStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Design: {creative.designStatus}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={creative.creativeType}
                          onChange={(e) => updateCreative(stage.id, index, 'creativeType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {CREATIVE_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                        <select
                          value={creative.platform}
                          onChange={(e) => updateCreative(stage.id, index, 'platform', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {PLATFORMS.map((platform) => (
                            <option key={platform.id} value={platform.id}>{platform.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={creative.status}
                          onChange={(e) => updateCreative(stage.id, index, 'status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {CREATIVE_STATUSES.map((status) => (
                            <option key={status.id} value={status.id}>{status.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <User className="w-4 h-4 inline mr-1" />
                          Content Writer
                        </label>
                        <select
                          value={creative.assignedContentWriter?._id || creative.assignedContentWriter || ''}
                          onChange={(e) => updateCreative(stage.id, index, 'assignedContentWriter', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select Content Writer</option>
                          {teamMembers.contentWriters?.map((writer) => (
                            <option key={writer._id} value={writer._id}>
                              {writer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Textarea
                        placeholder="Notes or description..."
                        rows={2}
                        value={creative.notes || ''}
                        onChange={(e) => updateCreative(stage.id, index, 'notes', e.target.value)}
                      />
                    </div>

                    {/* Content Output Preview */}
                    {creative.contentOutput && (creative.contentOutput.headline || creative.contentOutput.bodyText) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Content Output</h4>
                        {creative.contentOutput.headline && (
                          <p className="text-sm font-semibold">{creative.contentOutput.headline}</p>
                        )}
                        {creative.contentOutput.bodyText && (
                          <p className="text-sm text-gray-600 mt-1">{creative.contentOutput.bodyText}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ))}

      {/* Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            {STAGES.map((stage) => (
              <div key={stage.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600">
                  {stages[stage.id].creatives.length}
                </div>
                <div className="text-sm text-gray-600">{stage.label} Creatives</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {!isCompleted ? (
          <>
            <Button variant="secondary" onClick={() => onSubmit(false)} loading={saving}>
              Save Progress
            </Button>
            <Button onClick={() => onSubmit(true)} loading={saving}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Project
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            View Project Details
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}