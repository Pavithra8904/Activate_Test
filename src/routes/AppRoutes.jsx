import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard';
import Tables from '../pages/Tables/Tables';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/settings/Settings';
import Login from '../pages/Login/Login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;
