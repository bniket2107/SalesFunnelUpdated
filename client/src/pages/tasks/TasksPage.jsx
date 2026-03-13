import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner, Badge } from '@/components/ui';
import { taskService } from '@/services/api';
import { ClipboardList, FileText, Palette, Clock, CheckCircle, XCircle, Play } from 'lucide-react';

const TASK_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Play },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
];

const TASK_TYPES = [
  { id: 'content_writing', label: 'Content Writing', icon: FileText },
  { id: 'design', label: 'Design', icon: Palette },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', taskType: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [contentForm, setContentForm] = useState({
    headline: '',
    bodyText: '',
    cta: '',
    script: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.taskType) params.taskType = filter.taskType;

      const res = await taskService.getMyTasks(params);
      setTasks(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleContentSubmit = async (taskId) => {
    try {
      await taskService.updateTaskContent(taskId, contentForm);
      await taskService.updateTaskStatus(taskId, { status: 'completed' });
      toast.success('Content submitted successfully');
      setShowModal(false);
      setSelectedTask(null);
      setContentForm({ headline: '', bodyText: '', cta: '', script: '', notes: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit content');
    }
  };

  const openContentModal = (task) => {
    setSelectedTask(task);
    setContentForm({
      headline: task.contentOutput?.headline || '',
      bodyText: task.contentOutput?.bodyText || '',
      cta: task.contentOutput?.cta || '',
      script: task.contentOutput?.script || '',
      notes: task.contentOutput?.notes || ''
    });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = TASK_STATUSES.find(s => s.id === status) || TASK_STATUSES[0];
    const Icon = statusConfig.icon;
    return (
      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const getTaskTypeBadge = (taskType) => {
    const typeConfig = TASK_TYPES.find(t => t.id === taskType);
    const Icon = typeConfig?.icon || ClipboardList;
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {typeConfig?.label || taskType}
      </span>
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                value={filter.taskType}
                onChange={(e) => setFilter({ ...filter, taskType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                {TASK_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tasks assigned to you</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task._id}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTaskTypeBadge(task.taskType)}
                      {getStatusBadge(task.status)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>Project: {task.projectId?.businessName || task.projectId?.customerName || 'Unknown'}</span>
                      <span>Stage: {task.creativeStage}</span>
                    </div>
                    {task.dueDate && (
                      <div className="mt-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    {/* Content Output Preview */}
                    {task.contentOutput && (task.contentOutput.headline || task.contentOutput.bodyText) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Submitted Content</h4>
                        {task.contentOutput.headline && (
                          <p className="text-sm font-semibold">{task.contentOutput.headline}</p>
                        )}
                        {task.contentOutput.bodyText && (
                          <p className="text-sm text-gray-600 mt-1">{task.contentOutput.bodyText}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                      >
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && task.taskType === 'content_writing' && (
                      <Button
                        size="sm"
                        onClick={() => openContentModal(task)}
                      >
                        Submit Content
                      </Button>
                    )}
                    {task.status === 'in_progress' && task.taskType === 'design' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(task._id, 'completed')}
                      >
                        Complete Design
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Content Submission Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Submit Content</h2>
            <p className="text-gray-600 mb-4">{selectedTask.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  value={contentForm.headline}
                  onChange={(e) => setContentForm({ ...contentForm, headline: e.target.value })}
                  placeholder="Enter headline..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
                <Textarea
                  value={contentForm.bodyText}
                  onChange={(e) => setContentForm({ ...contentForm, bodyText: e.target.value })}
                  placeholder="Enter body text..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action</label>
                <Input
                  value={contentForm.cta}
                  onChange={(e) => setContentForm({ ...contentForm, cta: e.target.value })}
                  placeholder="Enter CTA..."
                />
              </div>
              {selectedTask.taskType === 'video_content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <Textarea
                    value={contentForm.script}
                    onChange={(e) => setContentForm({ ...contentForm, script: e.target.value })}
                    placeholder="Enter video script..."
                    rows={4}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Textarea
                  value={contentForm.notes}
                  onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleContentSubmit(selectedTask._id)}>
                Submit & Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}