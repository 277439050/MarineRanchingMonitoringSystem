import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/Layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import DevicesPage from '@/pages/DevicesPage';
import DeviceSharePage from '@/pages/DeviceSharePage';
import RealtimePage from '@/pages/RealtimePage';
import VideoPage from '@/pages/VideoPage';
import HistoryPage from '@/pages/HistoryPage';
import DataDisplayPage from '@/pages/DataDisplayPage';
import SmartControlPage from '@/pages/SmartControlPage';
import EncryptionPage from '@/pages/EncryptionPage';
import AlertsPage from '@/pages/AlertsPage';
import PredictionPage from '@/pages/PredictionPage';
import ReportsPage from '@/pages/ReportsPage';
import StatisticsPage from '@/pages/StatisticsPage';
import DeviceHealthPage from '@/pages/DeviceHealthPage';
import NotificationCenterPage from '@/pages/NotificationCenterPage';
import ComparisonPage from '@/pages/ComparisonPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="devices/share" element={<DeviceSharePage />} />
          <Route path="realtime" element={<RealtimePage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="data-display" element={<DataDisplayPage />} />
          <Route path="smart-control" element={<SmartControlPage />} />
          <Route path="encryption" element={<EncryptionPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="prediction" element={<PredictionPage />} />
          <Route path="device-health" element={<DeviceHealthPage />} />
          <Route path="notification" element={<NotificationCenterPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
