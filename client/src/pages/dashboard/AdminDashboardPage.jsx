import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, projectService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, Spinner, Button, Badge } from '@/components/ui';
import {
  TrendingUp,
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  MoreHorizontal,
  ChevronRight,
  UserPlus,
  Settings,
  Activity,
  Briefcase,
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

// Team Member Card
function TeamMemberCard({ member, onClick }) {
  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    performance_marketer: 'bg-blue-100 text-blue-700',
    ui_ux_designer: 'bg-purple-100 text-purple-700',
    graphic_designer: 'bg-pink-100 text-pink-700',
    developer: 'bg-green-100 text-green-700',
    tester: 'bg-orange-100 text-orange-700',
  };

  const roleLabels = {
    admin: 'Admin',
    performance_marketer: 'Performance Marketer',
    ui_ux_designer: 'UI/UX Designer',
    graphic_designer: 'Graphic Designer',
    developer: 'Developer',
    tester: 'Tester',
  };

  const availabilityColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
            {member.name?.charAt(0).toUpperCase()}
          </div>
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            availabilityColors[member.availability]
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
          <p className="text-sm text-gray-500 truncate">{member.email}</p>
        </div>
        <Badge className={cn('text-xs', roleColors[member.role])}>
          {roleLabels[member.role]}
        </Badge>
      </div>
      {member.specialization && (
        <p className="mt-2 text-xs text-gray-400">{member.specialization}</p>
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onClick }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{project.projectName || project.businessName}</h3>
          <p className="text-sm text-gray-500">{project.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          {project.isActive ? (
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
          )}
          <Badge className={cn('text-xs', statusColors[project.status])}>
            {project.status}
          </Badge>
        </div>
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
      {project.industry && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Industry: {project.industry}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    recentProjects: [],
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    byRole: {},
    available: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, teamRes] = await Promise.all([
        projectService.getDashboardStats(),
        authService.getTeamMembers()
      ]);

      setStats(dashboardRes.data);

      // Calculate team statistics
      const members = teamRes.data || [];
      setTeamMembers(members);

      const teamByRole = {};
      let availableCount = 0;

      members.forEach(member => {
        teamByRole[member.role] = (teamByRole[member.role] || 0) + 1;
        if (member.availability === 'available') availableCount++;
      });

      setTeamStats({
        total: members.length,
        byRole: teamByRole,
        available: availableCount,
      });
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
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! Here's your team overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/team')}>
            <Users size={18} className="mr-2" />
            Manage Team
          </Button>
          <Button onClick={() => navigate('/projects/new')}>
            <span className="mr-2">+</span> New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={String(stats.totalProjects)}
          change="+8%"
          changeType="positive"
          icon={FolderKanban}
          iconBg="bg-gradient-to-br from-primary-400 to-primary-600"
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
          change="+12%"
          changeType="positive"
          icon={Activity}
          iconBg="bg-gradient-to-br from-green-400 to-green-600"
        />
        <StatCard
          title="Team Members"
          value={String(teamStats.total)}
          icon={Users}
          iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title="Available Members"
          value={String(teamStats.available)}
          icon={CheckCircle}
          iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
      </div>

      {/* Team Overview by Role */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries({
          admin: { label: 'Admins', color: 'bg-red-500' },
          performance_marketer: { label: 'Marketers', color: 'bg-blue-500' },
          ui_ux_designer: { label: 'UI/UX', color: 'bg-purple-500' },
          graphic_designer: { label: 'Designers', color: 'bg-pink-500' },
          developer: { label: 'Developers', color: 'bg-green-500' },
          tester: { label: 'Testers', color: 'bg-orange-500' },
        }).map(([role, config]) => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-3 h-3 rounded-full', config.color)} />
              <span className="text-sm text-gray-600">{config.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {teamStats.byRole[role] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Projects and Team Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <p className="text-sm text-gray-500 mt-1">Latest project activity</p>
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

        {/* Team Members */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-500 mt-1">Your team roster</p>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300" />
              <h4 className="mt-2 font-medium text-gray-900">No team members</h4>
              <p className="text-sm text-gray-500 mt-1">Add team members to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.slice(0, 5).map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  onClick={() => navigate('/team')}
                />
              ))}
            </div>
          )}
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
          onClick={() => navigate('/team')}
          className="p-4 bg-dark-300 rounded-2xl text-white text-left hover:bg-dark-200 transition-all duration-200"
        >
          <UserPlus size={24} className="mb-2 text-primary-500" />
          <p className="font-semibold">Add Team Member</p>
          <p className="text-sm text-gray-400 mt-1">Invite new members</p>
        </button>
        <button
          onClick={() => navigate('/projects')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <Briefcase size={24} className="mb-2 text-green-500" />
          <p className="font-semibold">All Projects</p>
          <p className="text-sm text-gray-500 mt-1">View and manage projects</p>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <Settings size={24} className="mb-2 text-purple-500" />
          <p className="font-semibold">Settings</p>
          <p className="text-sm text-gray-500 mt-1">Configure your workspace</p>
        </button>
      </div>
    </div>
  );
}