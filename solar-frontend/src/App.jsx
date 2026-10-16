import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import Locations from './pages/Locations';
import Sites from './pages/Sites';
import Chat from './pages/Chat';
import Alerts from './pages/Alerts';
import JuniorAdmins from './pages/JuniorAdmins';

function Protected({ children, superOnly = false }) {
  const { isAuthenticated, isSuper } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (superOnly && !isSuper) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="customers" element={<Customers />} />
        <Route path="services" element={<Services />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="salary" element={<Salary />} />
        <Route path="locations" element={<Locations />} />
        <Route path="sites" element={<Sites />} />
        <Route path="chat" element={<Chat />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="junior-admins" element={<Protected superOnly><JuniorAdmins /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
