import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DutchingCalculator from './components/DutchingCalculator';
import HistoryView from './components/HistoryView';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'history'
  const [scenarios, setScenarios] = useState([]);
  const [stats, setStats] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load scenarios from API
  const loadScenarios = useCallback(async () => {
    try {
      const data = await api.fetchScenarios();
      setScenarios(data || []);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    }
  }, []);

  // Load aggregated concluded stats
  const loadStats = useCallback(async () => {
    try {
      const data = await api.fetchConcludedStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Load DB status
  const loadDbStatus = useCallback(async () => {
    try {
      const status = await api.fetchConfigStatus();
      setDbStatus(status);
    } catch (err) {
      console.error('Error fetching db status:', err);
    }
  }, []);

  // Refresh all state
  const refreshAll = useCallback(async () => {
    await Promise.all([loadScenarios(), loadStats(), loadDbStatus()]);
  }, [loadScenarios, loadStats, loadDbStatus]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    init();
  }, [refreshAll]);

  // Disable mouse wheel value changes on all number inputs
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
        e.target.blur();
      }
      if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleScenarioSaved = () => {
    refreshAll();
  };

  const pendingCount = scenarios.filter((s) => s.status === 'pending').length;

  return (
    <div className="app-container" id="app-root">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scenariosCount={scenarios.length}
        pendingCount={pendingCount}
        dbStatus={dbStatus}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Tab 1: Dutching Calculator */}
        {activeTab === 'calculator' && (
          <DutchingCalculator
            onScenarioSaved={handleScenarioSaved}
            onViewHistory={() => setActiveTab('history')}
          />
        )}

        {/* Tab 2: Operations History & Winner Settlement */}
        {activeTab === 'history' && (
          <HistoryView
            scenarios={scenarios}
            stats={stats}
            onRefresh={refreshAll}
            onOpenCalculator={() => setActiveTab('calculator')}
          />
        )}
      </main>
    </div>
  );
}
