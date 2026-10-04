import React, { useState } from 'react';
import {
  Trophy,
  XCircle,
  RotateCcw,
  Trash2,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryView({
  scenarios,
  stats,
  onRefresh,
  onOpenCalculator
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'settled'
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [actionError, setActionError] = useState('');

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSettle = async (scenarioId, winningOutcomeId, outcomeResult) => {
    setLoadingActionId(scenarioId);
    setActionError('');
    try {
      await api.settleScenario(scenarioId, winningOutcomeId, outcomeResult);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error settling scenario:', err);
      setActionError("Errore durante l'aggiornamento dell'esito: " + err.message);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (scenarioId, name) => {
    if (!window.confirm(`Sei sicuro di voler eliminare lo scenario "${name}"?`)) {
      return;
    }
    setLoadingActionId(scenarioId);
    try {
      await api.deleteScenario(scenarioId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setActionError("Errore durante l'eliminazione: " + err.message);
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredScenarios = scenarios.filter((s) => {
    if (filter === 'pending') return s.status === 'pending';
    if (filter === 'settled') return s.status === 'settled' || s.status === 'void';
    return true;
  });

  const totalNetProfit = stats?.total_net_profit || 0;
  const isNetProfitPositive = totalNetProfit >= 0;

  return (
    <div className="history-view" id="history-view-container">
      {/* 1. AGGREGATED CONCLUDED OPERATIONS SUMMARY */}
      <section className="stats-section" id="concluded-stats-summary">
        <div style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={18} color="#10b981" />
            <span>Riepilogo Complessivo Operazioni Concluse</span>
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Calcolato su tutti gli scenari definiti
          </span>
        </div>

        <div className="stats-grid">
          {/* Totale Investito */}
          <div className="stat-card" id="stat-card-total-invested">
            <span className="stat-card-title">
              <Wallet size={15} color="#3b82f6" />
              <span>Totale Investito</span>
            </span>
            <span className="stat-card-value" style={{ color: '#fff' }}>
              €{(stats?.total_invested || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-card-sub">
              Somma importi definiti
            </span>
          </div>

          {/* Totale Incassato */}
          <div className="stat-card" id="stat-card-total-returned">
            <span className="stat-card-title">
              <Trophy size={15} color="#10b981" />
              <span>Totale Incassato</span>
            </span>
            <span className="stat-card-value" style={{ color: '#60a5fa' }}>
              €{(stats?.total_returned || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-card-sub">
              Vincite realizzate
            </span>
          </div>

          {/* Profitto / Perdita Netta Totale */}
          <div className={`stat-card ${isNetProfitPositive ? 'positive' : 'negative'}`} id="stat-card-net-profit">
            <span className="stat-card-title">
              {isNetProfitPositive ? <TrendingUp size={15} color="var(--positive-light)" /> : <TrendingDown size={15} color="var(--negative-light)" />}
              <span>Utile Netto Complessivo</span>
            </span>
            <span className="stat-card-value">
              {isNetProfitPositive
                ? `+€${totalNetProfit.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `-€${Math.abs(totalNetProfit).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="stat-card-sub" style={{ fontWeight: 600 }}>
              ROI Globale: {isNetProfitPositive ? `+${stats?.overall_roi || 0}%` : `${stats?.overall_roi || 0}%`}
            </span>
          </div>

          {/* Statistiche Concluse e Win Rate */}
          <div className="stat-card" id="stat-card-concluded-count">
            <span className="stat-card-title">
              <CheckCircle2 size={15} color="#8b5cf6" />
              <span>Esiti Conclusi</span>
            </span>
            <span className="stat-card-value" style={{ color: '#c084fc' }}>
              {stats?.concluded_count || 0}
            </span>
            <span className="stat-card-sub">
              {stats?.winning_count || 0} Vincenti &bull; {stats?.lost_count || 0} Perse ({stats?.win_rate || 0}% rate)
            </span>
          </div>

          {/* In Sospeso */}
          <div className="stat-card" id="stat-card-pending-count">
            <span className="stat-card-title">
              <Clock size={15} color="#f59e0b" />
              <span>In Attesa di Esito</span>
            </span>
            <span className="stat-card-value" style={{ color: '#fbbf24' }}>
              {stats?.pending_count || 0}
            </span>
            <span className="stat-card-sub">
              Operazioni aperte da verificare
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            id="filter-all-btn"
            className={`preset-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutti ({scenarios.length})
          </button>
          <button
            type="button"
            id="filter-pending-btn"
            className={`preset-chip ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            In Attesa ({scenarios.filter((s) => s.status === 'pending').length})
          </button>
          <button
            type="button"
            id="filter-settled-btn"
            className={`preset-chip ${filter === 'settled' ? 'active' : ''}`}
            onClick={() => setFilter('settled')}
          >
            Conclusi ({scenarios.filter((s) => s.status === 'settled' || s.status === 'void').length})
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenCalculator}
          style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          id="btn-new-dutching-from-history"
        >
          <span>+ Nuovo Dutching</span>
        </button>
      </div>

      {actionError && (
        <div className="alert-banner info" style={{ borderColor: 'var(--negative)', color: 'var(--negative-light)' }}>
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. LIST OF SCENARIOS */}
      {filteredScenarios.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--border-medium)' }}
        >
          <Clock size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Nessun operazione di dutching {filter !== 'all' ? 'con questo filtro' : 'salvata'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Calcola le tue quote e premi &ldquo;Salva Scenario nel Database&rdquo; per registrarle qui.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCalculator}
            id="btn-start-first-dutching"
          >
            Vai al Calcolatore
          </button>
        </div>
      ) : (
        <div className="history-list" id="scenarios-list">
          {filteredScenarios.map((scenario) => {
            const isExpanded = expandedId === scenario.id;
            const isPending = scenario.status === 'pending';
            const isSettled = scenario.status === 'settled';
            const isVoid = scenario.status === 'void';
            const realizedProfit = scenario.realized_profit;
            const isWinner = isSettled && realizedProfit !== null && realizedProfit >= 0;
            const isLoss = isSettled && realizedProfit !== null && realizedProfit < 0;

            const dateStr = scenario.created_at
              ? new Date(scenario.created_at).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div key={scenario.id} className="scenario-card" id={`scenario-card-${scenario.id}`}>
                {/* Header Row */}
                <div
                  className="scenario-card-header"
                  onClick={() => toggleExpand(scenario.id)}
                  id={`scenario-header-${scenario.id}`}
                >
                  <div className="scenario-header-left">
                    {/* Status Badge */}
                    {isPending && (
                      <span className="status-badge pending" id={`status-badge-${scenario.id}`}>
                        <Clock size={13} />
                        In Attesa
                      </span>
                    )}
                    {isWinner && (
                      <span className="status-badge settled-win" id={`status-badge-${scenario.id}`}>
                        <Trophy size={13} />
                        Vincente
                      </span>
                    )}
                    {isLoss && (
                      <span className="status-badge settled-loss" id={`status-badge-${scenario.id}`}>
                        <XCircle size={13} />
                        Chiusa / Persa
                      </span>
                    )}
                    {isVoid && (
                      <span className="status-badge void" id={`status-badge-${scenario.id}`}>
                        Rimborso / Void
                      </span>
                    )}

                    <div>
                      <div className="scenario-name-text">{scenario.name}</div>
                      <div className="scenario-date-text">
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {dateStr} &bull; {scenario.outcomes?.length || 0} esiti coperti
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Results Right */}
                  <div className="scenario-header-metrics">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Investito
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        €{Number(scenario.actual_invested).toFixed(2)}
                      </div>
                    </div>

                    {isSettled && realizedProfit !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                          Esito Netto
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: isWinner ? 'var(--positive-light)' : 'var(--negative-light)',
                            fontSize: '1.1rem'
                          }}
                        >
                          {realizedProfit >= 0 ? `+€${realizedProfit.toFixed(2)}` : `-€${Math.abs(realizedProfit).toFixed(2)}`}
                          <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                            ({realizedProfit >= 0 ? `+${scenario.realized_roi}%` : `${scenario.realized_roi}%`})
                          </span>
                        </div>
                      </div>
                    )}

                    {isPending && (
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#fbbf24',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Clicca per segnare vincente &darr;
                      </div>
                    )}

                    <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Settlement Actions */}
                {isExpanded && (
                  <div className="scenario-detail-body" id={`scenario-detail-${scenario.id}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Dettaglio Puntate & Segnalazione Esito Vincente:
                      </h4>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isSettled && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                            onClick={() => handleSettle(scenario.id, null, 'reset')}
                            disabled={loadingActionId === scenario.id}
                            title="Reimposta lo scenario come non ancora concluso"
                            id={`btn-reset-settle-${scenario.id}`}
                          >
                            <RotateCcw size={13} />
                            <span>Reimposta in Sospeso</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          onClick={() => handleDelete(scenario.id, scenario.name)}
                          disabled={loadingActionId === scenario.id}
                          id={`btn-delete-scenario-${scenario.id}`}
                        >
                          <Trash2 size={13} />
                          <span>Elimina</span>
                        </button>
                      </div>
                    </div>

                    {/* Outcomes Settlement Grid */}
                    <div className="outcomes-resolution-grid">
                      {scenario.outcomes?.map((outc) => {
                        const isThisWinner = outc.is_winner;
                        const payout = Number(outc.confirmed_stake) * Number(outc.odds);
                        const netProfit = payout - Number(scenario.actual_invested);
                        const isProfitable = netProfit >= 0;

                        return (
                          <div
                            key={outc.id}
                            className={`outcome-resolution-item ${isThisWinner ? 'is-winner' : ''}`}
                            id={`outcome-resolution-${outc.id}`}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <strong style={{ fontSize: '1rem', color: isThisWinner ? 'var(--positive-light)' : 'var(--text-main)' }}>
                                  {outc.outcome_name}
                                </strong>
                                {isThisWinner && (
                                  <span
                                    style={{
                                      background: 'var(--positive)',
                                      color: '#fff',
                                      fontSize: '0.7rem',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 700
                                    }}
                                  >
                                    VINCITORE
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                Quota: <strong>{Number(outc.odds).toFixed(2)}</strong> &bull; Puntata: <strong>€{Number(outc.confirmed_stake).toFixed(2)}</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: isProfitable ? 'var(--positive)' : 'var(--negative)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                Se vince: {isProfitable ? '+' : ''}€{netProfit.toFixed(2)} ({isProfitable ? '+' : ''}{outc.potential_roi}%)
                              </div>
                            </div>

                            {/* Settlement Button */}
                            {isPending && (
                              <button
                                type="button"
                                className="btn-mark-winner"
                                onClick={() => handleSettle(scenario.id, outc.id, 'winner')}
                                disabled={loadingActionId === scenario.id}
                                id={`btn-mark-winner-${outc.id}`}
                                title={`Segna "${outc.outcome_name}" come esito vincente`}
                              >
                                <Trophy size={14} />
                                <span>Segna Vincente</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional Settlement Options for Pending */}
                    {isPending && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-medium)' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          onClick={() => handleSettle(scenario.id, null, 'all_lost')}
                          disabled={loadingActionId === scenario.id}
                          id={`btn-mark-all-lost-${scenario.id}`}
                        >
                          <XCircle size={14} color="var(--negative)" />
                          <span>Nessun esito coperto vincente (Persa)</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          onClick={() => handleSettle(scenario.id, null, 'void')}
                          disabled={loadingActionId === scenario.id}
                          id={`btn-mark-void-${scenario.id}`}
                        >
                          <span>Gara Annullata / Rimborso (Void)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
