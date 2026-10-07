import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ActivityInsights from './pages/ActivityInsights';
import Projects from './pages/Projects';
import AddProject from './pages/AddProject';
import ProjectDetails from './pages/ProjectDetails';
import EditProject from './pages/EditProject';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SharedStudentProfile from './pages/SharedStudentProfile';
import About from './pages/About';
import StudentSearch from './pages/StudentSearch';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import FloatingProjectAction from './components/FloatingProjectAction';
import AdminStudents from './pages/AdminStudents';
import AdminReviews from './pages/AdminReviews';
import AdminActivityAnalytics from './pages/AdminActivityAnalytics';
import AdminDepartments from './pages/AdminDepartments';

function Layout() {
  const { isAdmin } = useAuth();
  return (
    <div className="shell">
      <Navbar />
      <div className={`body ${isAdmin ? 'body-admin' : ''}`}>
        <Sidebar />
        <main><Outlet /></main>
      </div>
      <FloatingProjectAction />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activity" element={<ActivityInsights />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/students/:id" element={<SharedStudentProfile />} />
          <Route path="/students" element={<StudentSearch />} />
        </Route>
        <Route element={<ProtectedRoute roles={['STUDENT']} />}>
          <Route element={<Layout />}>
            <Route path="/projects/new" element={<AddProject />} />
            <Route path="/projects/:id/edit" element={<EditProject />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/staff" element={<AdminStudents accountRole="ADMIN" />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/activity" element={<AdminActivityAnalytics />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
