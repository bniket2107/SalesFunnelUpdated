import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { Layout } from '@/components/layout';

// Auth pages
import { LoginPage, RegisterPage } from '@/pages/auth';

// Dashboard
import { DashboardPage } from '@/pages/dashboard';

// Projects
import { ProjectsListPage, CreateProjectPage, ProjectDetailPage, TeamAssignmentPage } from '@/pages/projects';

// Stages
import {
  MarketResearchPage,
  OfferEngineeringPage,
  TrafficStrategyPage,
  LandingPageStrategyPage,
  CreativeStrategyPage,
} from '@/pages/stages';

// Tasks
import { TasksPage } from '@/pages/tasks';

// Team
import { TeamManagementPage } from '@/pages/team';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route wrapper
function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Team Route wrapper (NOT admin - for performance marketers, designers, developers, testers)
function TeamRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin cannot access strategy stages
  if (user?.role === 'admin') {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <SocketProvider>
              <NotificationProvider>
                <ProjectProvider>
                  <Layout />
                </ProjectProvider>
              </NotificationProvider>
            </SocketProvider>
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />

        {/* Create Project - Admin only */}
        <Route
          path="/projects/new"
          element={
            <AdminRoute>
              <CreateProjectPage />
            </AdminRoute>
          }
        />

        {/* Team Assignment - Admin only */}
        <Route
          path="/projects/:id/assign-team"
          element={
            <AdminRoute>
              <TeamAssignmentPage />
            </AdminRoute>
          }
        />

        {/* Stage routes - NOT accessible by admin (team members only) */}
        <Route
          path="/market-research"
          element={
            <TeamRoute>
              <MarketResearchPage />
            </TeamRoute>
          }
        />
        <Route
          path="/offer-engineering"
          element={
            <TeamRoute>
              <OfferEngineeringPage />
            </TeamRoute>
          }
        />
        <Route
          path="/traffic-strategy"
          element={
            <TeamRoute>
              <TrafficStrategyPage />
            </TeamRoute>
          }
        />
        <Route
          path="/landing-pages"
          element={
            <TeamRoute>
              <LandingPageStrategyPage />
            </TeamRoute>
          }
        />
        <Route
          path="/creative-strategy"
          element={
            <TeamRoute>
              <CreativeStrategyPage />
            </TeamRoute>
          }
        />

        {/* Tasks */}
        <Route path="/tasks" element={<TasksPage />} />

        {/* Team Management (Admin only) */}
        <Route
          path="/team"
          element={
            <AdminRoute>
              <TeamManagementPage />
            </AdminRoute>
          }
        />

        {/* Reports (placeholder) */}
        <Route
          path="/reports"
          element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}