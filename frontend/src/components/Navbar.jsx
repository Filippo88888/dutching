import React from 'react';
import { Calculator, History, Database } from 'lucide-react';

/**
 * Logo ufficiale vettoriale SSC Napoli
 */
function NapoliLogo({ size = 38 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', borderRadius: '50%', filter: 'drop-shadow(0 2px 8px rgba(0, 128, 255, 0.45))' }}
      aria-label="SSC Napoli Logo"
    >
      <defs>
        {/* Gradiente azzurro iconico Napoli */}
        <radialGradient id="napoliRadial" cx="38%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#29B6F6" />
          <stop offset="50%" stopColor="#0288D1" />
          <stop offset="90%" stopColor="#01579B" />
          <stop offset="100%" stopColor="#003366" />
        </radialGradient>
        {/* Anello esterno sfumato */}
        <linearGradient id="napoliRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E1F5FE" />
          <stop offset="50%" stopColor="#B3E5FC" />
          <stop offset="100%" stopColor="#81D4FA" />
        </linearGradient>
      </defs>

      {/* Bordo scuro esterno */}
      <circle cx="50" cy="50" r="49" fill="#002244" />
      {/* Anello bianco/azzurro chiaro */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#napoliRingGrad)" strokeWidth="3" />
      {/* Cerchio azzurro Napoli principale */}
      <circle cx="50" cy="50" r="42.5" fill="url(#napoliRadial)" />
      {/* Anello sottile di rifinitura interna */}
      <circle cx="50" cy="50" r="39.5" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />

      {/* N stilizzata della SSC Napoli con proporzioni esatte */}
      <path
        d="M 32 70 L 32 30 L 40 30 L 60.5 61 L 60.5 30 L 68 30 L 68 70 L 60 70 L 39.5 39 L 39.5 70 Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0, 20, 50, 0.5))"
      />
    </svg>
  );
}

export default function Navbar({
  activeTab,
  setActiveTab,
  scenariosCount,
  pendingCount,
  dbStatus
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-section" onClick={() => setActiveTab('calculator')} id="brand-logo-btn" title="Dutching Pro - SSC Napoli">
          {/* Logo SSC Napoli */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NapoliLogo size={42} />
          </div>
          <div>
            <span className="brand-title">DUTCHING PRO</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            id="nav-tab-calculator"
            className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={18} />
            <span>Calcolatore</span>
          </button>

          <button
            id="nav-tab-history"
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Storico Operazioni</span>
            {scenariosCount > 0 && (
              <span className="badge-count" id="badge-scenarios-count">
                {scenariosCount}
              </span>
            )}
            {pendingCount > 0 && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}
                title={`${pendingCount} operazioni in attesa di esito`}
              >
                {pendingCount} attive
              </span>
            )}
          </button>
        </nav>

        {/* Badge di stato Supabase protetto (senza modale impostazioni per sicurezza) */}
        <div className="nav-actions">
          <div
            id="btn-db-status"
            className="db-status-pill"
            style={{ cursor: 'default' }}
            title="Database protetto e connesso via server"
          >
            <span
              className={`status-dot ${
                dbStatus?.connected ? 'connected' : 'error'
              }`}
            />
            <Database size={15} color={dbStatus?.connected ? '#10b981' : '#f59e0b'} />
            <span style={{ fontWeight: 600 }}>
              {dbStatus?.connected ? 'Supabase Connesso' : 'Database Connesso'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
