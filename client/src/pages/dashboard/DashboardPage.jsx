import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { projectService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, Spinner, Badge, Button } from '@/components/ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

// Stat Card Component
function StatCard({ title, value, change, changeType, icon: Icon, iconBg }) {
  const isPositive = changeType === 'positive';
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUpRight size={16} className="text-green-500" />
              ) : (
                <ArrowDownRight size={16} className="text-red-500" />
              )}
              <span className={cn('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
                {change}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-2xl', iconBg)}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// Line Chart Component (SVG-based)
function LineChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="w-full h-48 relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Grid lines */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC107" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#FFC107"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 80 - 10;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1"
              fill="#FFC107"
              stroke="white"
              strokeWidth="0.3"
            />
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {data.filter((_, i) => i % 2 === 0).map((d, i) => (
          <span key={i} className="text-xs text-gray-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Donut Chart Component
function DonutChart({ completed, inProgress, pending }) {
  const total = completed + inProgress + pending;
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPercent = total > 0 ? (inProgress / total) * 100 : 0;
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;

  // Calculate stroke-dasharray values
  const circumference = 2 * Math.PI * 42; // radius = 42
  const completedDash = (completedPercent / 100) * circumference;
  const inProgressDash = (inProgressPercent / 100) * circumference;
  const pendingDash = (pendingPercent / 100) * circumference;

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="12"
        />
        {/* Completed */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#FFC107"
          strokeWidth="12"
          strokeDasharray={`${completedDash} ${circumference}`}
          strokeDashoffset="0"
        />
        {/* In Progress */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#FFEB3B"
          strokeWidth="12"
          strokeDasharray={`${inProgressDash} ${circumference}`}
          strokeDashoffset={`-${completedDash}`}
        />
        {/* Pending */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#1F1F1F"
          strokeWidth="12"
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={`-${completedDash + inProgressDash}`}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ label, value, max, color = 'primary' }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #FFC107 0%, #FFD54F 100%)'
          }}
        />
      </div>
    </div>
  );
}

// Notification Item Component
function NotificationItem({ title, description, time, unread }) {
  return (
    <div className={cn(
      'p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0',
      unread && 'bg-primary-50/20'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-2 h-2 rounded-full mt-2',
          unread ? 'bg-primary-500' : 'bg-gray-300'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onClick }) {
  const stageColors = {
    onboarding: 'bg-blue-100 text-blue-700',
    marketResearch: 'bg-purple-100 text-purple-700',
    offerEngineering: 'bg-orange-100 text-orange-700',
    trafficStrategy: 'bg-green-100 text-green-700',
    landingPage: 'bg-pink-100 text-pink-700',
    creativeStrategy: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{project.businessName}</h3>
          <p className="text-sm text-gray-500">{project.customerName}</p>
        </div>
        <span className={cn(
          'px-2.5 py-1 rounded-lg text-xs font-medium',
          project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        )}>
          {project.status}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-900">{project.overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.overallProgress}%`,
              background: project.overallProgress >= 100
                ? '#10B981'
                : 'linear-gradient(90deg, #FFC107 0%, #FFD54F 100%)'
            }}
          />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Updated {formatDate(project.updatedAt)}
        </span>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    recentProjects: [],
  });

  // Mock data for charts
  const revenueData = [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 52 },
    { label: 'Mar', value: 49 },
    { label: 'Apr', value: 63 },
    { label: 'May', value: 72 },
    { label: 'Jun', value: 68 },
    { label: 'Jul', value: 85 },
    { label: 'Aug', value: 78 },
    { label: 'Sep', value: 92 },
    { label: 'Oct', value: 88 },
    { label: 'Nov', value: 95 },
    { label: 'Dec', value: 102 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await projectService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Marketer'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <span className="mr-2">+</span> New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$124,500"
          change="+12.5%"
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-gradient-to-br from-primary-400 to-primary-600"
        />
        <StatCard
          title="New Users"
          value="2,350"
          change="+8.2%"
          changeType="positive"
          icon={Users}
          iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
          change="+5.4%"
          changeType="positive"
          icon={FolderKanban}
          iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Tasks Completed"
          value="186"
          change="-2.1%"
          changeType="negative"
          icon={CheckCircle}
          iconBg="bg-gradient-to-br from-green-400 to-green-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
                <p className="text-sm text-gray-500 mt-1">Monthly revenue trend</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal size={18} className="text-gray-400" />
              </button>
            </div>
            <LineChart data={revenueData} />
          </div>
        </div>

        {/* Task Overview */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
              <p className="text-sm text-gray-500 mt-1">Current task status</p>
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <DonutChart completed={45} inProgress={23} pending={12} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">45</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-300" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="text-sm font-medium text-gray-900">23</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-dark-100" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects and Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Projects</h3>
                <p className="text-sm text-gray-500 mt-1">Your most active projects</p>
              </div>
              <Link
                to="/projects"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </Link>
            </div>

            {stats.recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-gray-300" />
                <h4 className="mt-2 font-medium text-gray-900">No projects yet</h4>
                <p className="text-sm text-gray-500 mt-1">Create your first project to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentProjects.slice(0, 5).map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500 mt-1">Recent updates</p>
            </div>
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-gray-400" />
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                3 new
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            <NotificationItem
              title="New project created"
              description="Client onboarding for Acme Corp completed"
              time="5 minutes ago"
              unread
            />
            <NotificationItem
              title="Task completed"
              description="Market research phase finished successfully"
              time="1 hour ago"
              unread
            />
            <NotificationItem
              title="Reminder"
              description="Review offer engineering documents"
              time="2 hours ago"
              unread={false}
            />
            <NotificationItem
              title="Team update"
              description="New team member added to project"
              time="3 hours ago"
              unread={false}
            />
            <NotificationItem
              title="Deadline approaching"
              description="Traffic strategy due tomorrow"
              time="5 hours ago"
              unread={false}
            />
          </div>
          <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all notifications
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/projects/new')}
          className="p-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl text-white text-left hover:shadow-lg transition-all duration-200"
        >
          <FolderKanban size={24} className="mb-2" />
          <p className="font-semibold">Create Project</p>
          <p className="text-sm text-white/80 mt-1">Start a new client project</p>
        </button>
        <button
          onClick={() => navigate('/analytics')}
          className="p-4 bg-dark-300 rounded-2xl text-white text-left hover:bg-dark-200 transition-all duration-200"
        >
          <TrendingUp size={24} className="mb-2 text-primary-500" />
          <p className="font-semibold">View Analytics</p>
          <p className="text-sm text-gray-400 mt-1">Check performance metrics</p>
        </button>
        <button
          onClick={() => navigate('/projects')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <CheckCircle size={24} className="mb-2 text-green-500" />
          <p className="font-semibold">Active Tasks</p>
          <p className="text-sm text-gray-500 mt-1">Manage your tasks</p>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <Clock size={24} className="mb-2 text-purple-500" />
          <p className="font-semibold">Schedule</p>
          <p className="text-sm text-gray-500 mt-1">View your calendar</p>
        </button>
      </div>
    </div>
  );
}