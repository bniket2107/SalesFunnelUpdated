import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, Plus, X, CheckCircle } from 'lucide-react';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Mock project data with market research completed
const STATIC_PROJECT = {
  _id: 'static-project-1',
  customerName: 'John Smith',
  businessName: 'Acme Corporation',
  email: 'john@acme.com',
  mobile: '+1-555-0123',
  currentStage: 3,
  overallProgress: 33,
  stages: {
    onboarding: { isCompleted: true, completedAt: new Date() },
    marketResearch: { isCompleted: true, completedAt: new Date() },
    offerEngineering: { isCompleted: false, completedAt: null },
    trafficStrategy: { isCompleted: false, completedAt: null },
    landingPage: { isCompleted: false, completedAt: null },
    creativeStrategy: { isCompleted: false, completedAt: null }
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock offer data
const STATIC_OFFER = {
  functionalValue: 'Our platform helps businesses automate their marketing funnels, saving 20+ hours per week on manual tasks.',
  emotionalValue: 'Feel confident and in control of your marketing, knowing everything is running smoothly without constant oversight.',
  socialValue: 'Join a community of successful marketers who have scaled their businesses using our proven system.',
  economicValue: 'Average ROI of 300% within the first 90 days, with reduced ad spend and higher conversion rates.',
  experientialValue: 'Seamless onboarding experience with dedicated support and step-by-step guidance.',
  bonuses: [
    { title: 'Marketing Templates Pack', description: '50+ proven templates for emails, ads, and landing pages', value: 297 },
    { title: 'Private Community Access', description: 'Lifetime access to our exclusive marketing community', value: 997 }
  ],
  guarantees: ['30-day money-back guarantee', 'Results guarantee - if you don\'t see results, we\'ll work with you personally'],
  urgencyTactics: ['Limited bonus availability', 'Price increases after launch period'],
  pricing: {
    basePrice: 1997,
    currency: 'USD',
    upsell: { enabled: true, price: 497, description: 'VIP coaching package with 1-on-1 support' },
    crossSell: { enabled: true, price: 197, description: 'Advanced analytics dashboard' }
  },
  completionPercentage: 40,
  isCompleted: false
};

export default function OfferEngineeringPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [newGuarantee, setNewGuarantee] = useState('');
  const [newUrgency, setNewUrgency] = useState('');

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      functionalValue: '',
      emotionalValue: '',
      socialValue: '',
      economicValue: '',
      experientialValue: '',
      bonuses: [],
      guarantees: [],
      urgencyTactics: [],
      pricing: {
        basePrice: 0,
        currency: 'USD',
      },
    },
  });

  const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
    control,
    name: 'bonuses',
  });

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
        setValue('functionalValue', STATIC_OFFER.functionalValue);
        setValue('emotionalValue', STATIC_OFFER.emotionalValue);
        setValue('socialValue', STATIC_OFFER.socialValue);
        setValue('economicValue', STATIC_OFFER.economicValue);
        setValue('experientialValue', STATIC_OFFER.experientialValue);
        setValue('bonuses', STATIC_OFFER.bonuses);
        setValue('guarantees', STATIC_OFFER.guarantees);
        setValue('urgencyTactics', STATIC_OFFER.urgencyTactics);
        setValue('pricing', STATIC_OFFER.pricing);
        setIsCompleted(STATIC_OFFER.isCompleted);
      } else {
        // Real API calls
        const { projectService, offerService } = await import('@/services/api');
        const [projectRes, offerRes] = await Promise.all([
          projectService.getProject(projectId),
          offerService.get(projectId),
        ]);
        setProject(projectRes.data);

        if (offerRes.data) {
          setValue('functionalValue', offerRes.data.functionalValue || '');
          setValue('emotionalValue', offerRes.data.emotionalValue || '');
          setValue('socialValue', offerRes.data.socialValue || '');
          setValue('economicValue', offerRes.data.economicValue || '');
          setValue('experientialValue', offerRes.data.experientialValue || '');
          setValue('bonuses', offerRes.data.bonuses || []);
          setValue('guarantees', offerRes.data.guarantees || []);
          setValue('urgencyTactics', offerRes.data.urgencyTactics || []);
          setValue('pricing', offerRes.data.pricing || { basePrice: 0, currency: 'USD' });
          setIsCompleted(offerRes.data.isCompleted);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load offer');
      if (error.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData, markComplete = false) => {
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
              offerEngineering: { isCompleted: true, completedAt: new Date() }
            },
            currentStage: 4,
            overallProgress: 50
          }));
          toast.success('Offer engineering completed! Moving to Traffic Strategy...');
          setTimeout(() => {
            navigate(`/traffic-strategy?projectId=${projectId}`);
          }, 1500);
        } else {
          toast.success('Progress saved!');
        }
      } else {
        // Real API call
        const { offerService } = await import('@/services/api');
        await offerService.upsert(projectId, {
          ...formData,
          isCompleted: markComplete,
        });
        toast.success(markComplete ? 'Offer engineering completed!' : 'Progress saved!');
        if (markComplete) {
          navigate(`/traffic-strategy?projectId=${projectId}`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field, value, setter) => {
    if (!value.trim()) return;
    const current = watch(field) || [];
    setValue(field, [...current, value.trim()]);
    setter('');
  };

  const removeItem = (field, index) => {
    const current = watch(field) || [];
    setValue(field, current.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const valueFields = [
    { key: 'functionalValue', label: 'Functional Value', placeholder: 'What does your product/service actually do?' },
    { key: 'emotionalValue', label: 'Emotional Value', placeholder: 'How does your customer feel after using it?' },
    { key: 'socialValue', label: 'Social/Status Value', placeholder: 'How does it improve their social standing?' },
    { key: 'economicValue', label: 'Economic Value', placeholder: 'What financial benefits do they receive?' },
    { key: 'experientialValue', label: 'Experiential Value', placeholder: 'What unique experience do they get?' },
  ];

  // Calculate progress
  const calculateProgress = () => {
    const fields = [
      watch('functionalValue'),
      watch('emotionalValue'),
      watch('socialValue'),
      watch('economicValue'),
      watch('experientialValue'),
      watch('pricing.basePrice') > 0,
    ];
    const filled = fields.filter(f => f).length;
    return Math.round((filled / fields.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Offer Engineering</h1>
          <p className="text-gray-600 mt-1">{project?.businessName}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-2xl font-bold text-primary-600">
            {isCompleted ? '100%' : `${progress}%`}
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-800">Stage Completed!</h3>
            <p className="text-sm text-green-600">You can now proceed to Traffic Strategy.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
        {/* Value Propositions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Value Proposition</h2>
            <p className="text-sm text-gray-500">Define the core value you provide to customers</p>
          </CardHeader>
          <CardBody className="space-y-4">
            {valueFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <Textarea
                  placeholder={field.placeholder}
                  rows={3}
                  {...register(field.key)}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Bonus Stack */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bonus Stack</h2>
                <p className="text-sm text-gray-500">Add bonuses to increase perceived value</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => appendBonus({ title: '', description: '', value: 0 })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Bonus
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {bonusFields.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bonuses added yet</p>
            ) : (
              <div className="space-y-4">
                {bonusFields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Input
                        placeholder="Bonus title"
                        {...register(`bonuses.${index}.title`)}
                        className="flex-1 mr-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBonus(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Bonus description"
                      rows={2}
                      {...register(`bonuses.${index}.description`)}
                      className="mt-2"
                    />
                    <Input
                      type="number"
                      placeholder="Value ($)"
                      {...register(`bonuses.${index}.value`, { valueAsNumber: true })}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Guarantees */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Guarantees</h2>
            <p className="text-sm text-gray-500">Add risk reversal guarantees</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g., 30-day money-back guarantee"
                value={newGuarantee}
                onChange={(e) => setNewGuarantee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('guarantees', newGuarantee, setNewGuarantee);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('guarantees', newGuarantee, setNewGuarantee)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {(watch('guarantees') || []).map((guarantee, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-lg"
                >
                  <span>{guarantee}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('guarantees', index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Urgency Tactics */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Urgency Tactics</h2>
            <p className="text-sm text-gray-500">Add scarcity and urgency elements</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g., Limited time offer - 48 hours only"
                value={newUrgency}
                onChange={(e) => setNewUrgency(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('urgencyTactics', newUrgency, setNewUrgency);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('urgencyTactics', newUrgency, setNewUrgency)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {(watch('urgencyTactics') || []).map((tactic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 text-orange-800 rounded-lg"
                >
                  <span>{tactic}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('urgencyTactics', index)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Pricing Strategy */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pricing Strategy</h2>
            <p className="text-sm text-gray-500">Set your pricing and upsell options</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Base Price"
                type="number"
                placeholder="0.00"
                {...register('pricing.basePrice', { valueAsNumber: true })}
              />
              <Input
                label="Currency"
                placeholder="USD"
                {...register('pricing.currency')}
              />
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Upsell</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Upsell Price"
                  type="number"
                  placeholder="0.00"
                  {...register('pricing.upsell.price', { valueAsNumber: true })}
                />
                <Input
                  label="Upsell Description"
                  placeholder="Premium version with additional features"
                  {...register('pricing.upsell.description')}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Cross-sell</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Cross-sell Price"
                  type="number"
                  placeholder="0.00"
                  {...register('pricing.crossSell.price', { valueAsNumber: true })}
                />
                <Input
                  label="Cross-sell Description"
                  placeholder="Complementary product"
                  {...register('pricing.crossSell.description')}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {!isCompleted ? (
            <>
              <Button type="submit" variant="secondary" loading={saving}>
                Save Progress
              </Button>
              <Button type="button" loading={saving} onClick={handleSubmit((data) => onSubmit(data, true))}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete & Continue
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => navigate(`/traffic-strategy?projectId=${projectId}`)}>
              Continue to Traffic Strategy
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}