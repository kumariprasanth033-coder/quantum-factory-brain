import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { NavigationBreadcrumbBar } from './components/NavigationBreadcrumbBar';
import { WhatIfSimulationModal } from './components/WhatIfSimulationModal';
import { HackathonDemoModal } from './components/HackathonDemoModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { Jobs } from './pages/Jobs';
import { JobDetails } from './pages/JobDetails';
import { Scheduling } from './pages/Scheduling';
import { GanttPage } from './pages/GanttPage';
import { Optimization } from './pages/Optimization';
import { Analytics } from './pages/Analytics';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';
import { Login } from './pages/Login';

import { api } from './services/api';
import { Schedule, FactoryMode } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  // Navigation History for Previous / Forward Buttons
  const [pageHistory, setPageHistory] = useState<string[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [factoryMode, setFactoryMode] = useState<FactoryMode>('demo');

  const fetchAlertsCount = async () => {
    try {
      const alerts = await api.getAlerts(true);
      if (alerts) {
        setUnreadAlertsCount(alerts.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlertsCount();
  }, [currentPage]);

  const handleNavigate = (page: string, params?: any, isHistoryMove: boolean = false) => {
    if (page === 'job-details' && params?.id) {
      setSelectedJobId(params.id);
    }
    
    if (!isHistoryMove && page !== currentPage) {
      const updatedHistory = pageHistory.slice(0, historyIndex + 1);
      updatedHistory.push(page);
      setPageHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      handleNavigate(pageHistory[prevIndex], undefined, true);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < pageHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      handleNavigate(pageHistory[nextIndex], undefined, true);
    }
  };

  const handleToggleFactoryMode = () => {
    setFactoryMode(prev => (prev === 'demo' ? 'custom' : 'demo'));
  };

  const handleUndoSchedule = async () => {
    try {
      const reverted = await api.undoSchedule();
      setActiveSchedule(reverted);
      await fetchAlertsCount();
      alert(`Schedule undone successfully! Reverted to ${reverted.version} (Makespan: ${reverted.makespan}h).`);
    } catch (err: any) {
      alert(err.message || 'No previous schedule version available to undo to.');
    }
  };

  const handleResetDemoData = async () => {
    const confirmReset = window.confirm(
      'Reset all factory data to original demo state (6 machines, 20 multi-operation jobs, baseline schedules)?'
    );
    if (!confirmReset) return;

    try {
      await api.seedDemoData();
      alert('Factory data re-seeded successfully! Loading refreshed state...');
      window.location.reload();
    } catch (err: any) {
      alert('Failed to reset demo: ' + err.message);
    }
  };

  const handleScheduleGenerated = (schedule: Schedule) => {
    setActiveSchedule(schedule);
    fetchAlertsCount();
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
        {/* Top Navbar */}
        <Navbar
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
          onResetDemo={handleResetDemoData}
          onNavigateToAlerts={() => handleNavigate('alerts')}
          onNavigateToLogin={() => handleNavigate('login')}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Navigation Breadcrumb Bar with Previous, Forward, and Undo Schedule Buttons */}
        <NavigationBreadcrumbBar
          currentPage={currentPage}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < pageHistory.length - 1}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          factoryMode={factoryMode}
          onToggleFactoryMode={handleToggleFactoryMode}
          onNavigate={handleNavigate}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onUndoSchedule={handleUndoSchedule}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Sidebar */}
          <Sidebar
            currentPage={currentPage}
            onNavigate={(page: string) => handleNavigate(page)}
            onOpenHackathonGuide={() => setIsTourOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
            {currentPage === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                onOpenWhatIf={() => setIsWhatIfOpen(true)}
              />
            )}

            {currentPage === 'machines' && (
              <Machines
                onTriggerReoptimize={() => setIsWhatIfOpen(true)}
              />
            )}

            {currentPage === 'jobs' && (
              <Jobs
                onSelectJob={(id) => handleNavigate('job-details', { id })}
                onTriggerReoptimize={() => setIsWhatIfOpen(true)}
              />
            )}

            {currentPage === 'job-details' && selectedJobId && (
              <JobDetails
                jobId={selectedJobId}
                onBack={() => handleGoBack()}
                onNavigateToGantt={() => handleNavigate('gantt')}
              />
            )}

            {currentPage === 'scheduling' && (
              <Scheduling
                onScheduleGenerated={handleScheduleGenerated}
                onNavigateToGantt={() => handleNavigate('gantt')}
              />
            )}

            {currentPage === 'gantt' && (
              <GanttPage
                onOpenWhatIf={() => setIsWhatIfOpen(true)}
              />
            )}

            {currentPage === 'optimization' && (
              <Optimization />
            )}

            {currentPage === 'analytics' && (
              <Analytics
                onNavigateToScheduling={() => handleNavigate('scheduling')}
              />
            )}

            {currentPage === 'alerts' && (
              <Alerts />
            )}

            {currentPage === 'reports' && (
              <Reports />
            )}

            {currentPage === 'history' && (
              <History
                onSelectSchedule={(s) => setActiveSchedule(s)}
                onNavigateToGantt={() => handleNavigate('gantt')}
              />
            )}

            {currentPage === 'settings' && (
              <Settings />
            )}

            {currentPage === 'system-health' && (
              <SystemHealth />
            )}

            {currentPage === 'login' && (
              <Login
                onLoginSuccess={() => handleNavigate('dashboard')}
              />
            )}
          </main>
        </div>

        {/* What-If Disruption Simulator Modal */}
        <WhatIfSimulationModal
          isOpen={isWhatIfOpen}
          onClose={() => setIsWhatIfOpen(false)}
          onApplied={() => {
            fetchAlertsCount();
            handleNavigate('gantt');
          }}
        />

        {/* 8-Step Hackathon Judge Tour Modal */}
        <HackathonDemoModal
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onNavigateToPage={(page) => handleNavigate(page)}
        />
      </div>
    </AuthProvider>
  );
}
