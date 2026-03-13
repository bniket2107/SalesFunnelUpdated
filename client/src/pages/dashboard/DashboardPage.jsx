import { useAuth } from '@/context/AuthContext';
import AdminDashboardPage from './AdminDashboardPage';

// Performance Marketer Dashboard Component
function PerformanceMarketerDashboard({ user }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome, {user?.name?.split(' ')[0] || 'Marketer'}!
      </h1>
      <p className="text-gray-600">
        Your assigned projects will appear here. Navigate to Projects to see your active work.
      </p>
    </div>
  );
}

// Designer Dashboard Component
function DesignerDashboard({ user }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome, {user?.name?.split(' ')[0] || 'Designer'}!
      </h1>
      <p className="text-gray-600">
        Your design tasks will appear here. Check the Projects section for your assignments.
      </p>
    </div>
  );
}

// Developer Dashboard Component
function DeveloperDashboard({ user }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome, {user?.name?.split(' ')[0] || 'Developer'}!
      </h1>
      <p className="text-gray-600">
        Your development tasks will appear here. Check the Projects section for your assignments.
      </p>
    </div>
  );
}

// Tester Dashboard Component
function TesterDashboard({ user }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome, {user?.name?.split(' ')[0] || 'Tester'}!
      </h1>
      <p className="text-gray-600">
        Your testing tasks will appear here. Check the Projects section for your assignments.
      </p>
    </div>
  );
}

// Main Dashboard Page - Routes to role-specific dashboard
export default function DashboardPage() {
  const { user } = useAuth();

  // Route to appropriate dashboard based on role
  switch (user?.role) {
    case 'admin':
      return <AdminDashboardPage />;
    case 'performance_marketer':
      return <PerformanceMarketerDashboard user={user} />;
    case 'ui_ux_designer':
    case 'graphic_designer':
      return <DesignerDashboard user={user} />;
    case 'developer':
      return <DeveloperDashboard user={user} />;
    case 'tester':
      return <TesterDashboard user={user} />;
    default:
      return <PerformanceMarketerDashboard user={user} />;
  }
}