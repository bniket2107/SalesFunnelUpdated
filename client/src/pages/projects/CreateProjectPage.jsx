import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { projectService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Input } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

const projectSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  mobile: z.string().min(10, 'Please enter a valid mobile number'),
  email: z.string().email('Please enter a valid email'),
});

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      customerName: '',
      businessName: '',
      mobile: '',
      email: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await projectService.createProject(data);
      toast.success('Project created successfully!');
      navigate(`/projects/${response.data._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">
            Start a new client project and begin the onboarding process.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Customer Onboarding</h2>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the customer details to create a new project.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                placeholder="John Doe"
                error={errors.customerName?.message}
                {...register('customerName')}
              />
              <Input
                label="Business Name"
                placeholder="Acme Corporation"
                error={errors.businessName?.message}
                {...register('businessName')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                placeholder="+1 234 567 890"
                error={errors.mobile?.message}
                {...register('mobile')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Project
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}