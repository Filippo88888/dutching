import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Layers,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  ArrowRight,
  Tag
} from 'lucide-react';
import ProfitCardsHeader from './ProfitCardsHeader';
import { api } from '../services/api';

const DEFAULT_BANKROLL = 1000;
const DEFAULT_EVENTS_COUNT = 5;
const PRESET_AMOUNTS = [250, 500, 1000, 2000, 5000];
const DEFAULT_OUTCOME_NAMES = ['1+GG', '1+NG', '2+GG', '2+NG', 'X+GG'];

export default function DutchingCalculator({ onScenarioSaved, onViewHistory }) {
  const [bankroll, setBankroll] = useState(DEFAULT_BANKROLL);
  const [eventCount, setEventCount] = useState(DEFAULT_EVENTS_COUNT);
  const [roundStep, setRoundStep] = useState(5.0); // Step di 5 come da specifica

  // Initial outcomes list
  const [outcomes, setOutcomes] = useState(() => {
    return Array.from({ length: DEFAULT_EVENTS_COUNT }, (_, i) => ({
      name: DEFAULT_OUTCOME_NAMES[i] || `Esito ${i + 1}`,
      odds: '',
      confirmed_stake: null,
    }));
  });

  const [scenarioName, setScenarioName] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Event Count Changes
  const handleCountChange = (newCount) => {
    const clampedCount = Math.max(2, Math.min(12, newCount));
    setEventCount(clampedCount);

    setOutcomes((prev) => {
      const current = [...prev];
      if (clampedCount > current.length) {
        // Add more
        for (let i = current.length; i < clampedCount; i++) {
          current.push({
            name: DEFAULT_OUTCOME_NAMES[i] || `Esito ${i + 1}`,
            odds: '',
            confirmed_stake: null,
          });
        }
      } else {
        // Shrink
        current.length = clampedCount;
      }
      return current;
    });
  };

  // Perform calculation via API or local fallback
  const performCalculation = useCallback(async () => {
    setIsCalculating(true);
    setErrorMessage('');
    try {
      const res = await api.calculateDutching(bankroll, outcomes, roundStep);
      setCalculation(res);
    } catch (err) {
      console.error('Calculation error:', err);
      setErrorMessage("Errore nel calcolo del dutching: " + err.message);
    } finally {
      setIsCalculating(false);
    }
  }, [bankroll, outcomes, roundStep]);

  // Recalculate when bankroll, outcomes or roundStep change
  useEffect(() => {
    const timer = setTimeout(() => {
      performCalculation();
    }, 200);
    return () => clearTimeout(timer);
  }, [performCalculation]);

  // Update specific outcome field
  const handleOutcomeChange = (index, field, value) => {
    setOutcomes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Reset to initial blank or other odds
  const handleResetOdds = () => {
    setOutcomes(
      Array.from({ length: eventCount }, (_, i) => ({
        name: DEFAULT_OUTCOME_NAMES[i] || `Esito ${i + 1}`,
        odds: '',
        confirmed_stake: null,
      }))
    );
    setCalculation(null);
    setSaveSuccess(null);
    setErrorMessage('');
    setScenarioName('');
  };

  // Quick fill with sample realistic betting odds
  const handleLoadSampleOdds = () => {
    const samples = [
      [5.50, 4.20, 6.00, 7.50, 8.00], // 5 events
      [3.80, 4.50, 5.00, 6.50, 7.00, 8.50], // 6 events
      [2.20, 3.40, 4.50], // 3 events
    ];
    const sample = samples[0];
    const newCount = Math.max(sample.length, eventCount);
    handleCountChange(newCount);

    setOutcomes((prev) => {
      return Array.from({ length: newCount }, (_, i) => ({
        name: prev[i]?.name || DEFAULT_OUTCOME_NAMES[i] || `Esito ${i + 1}`,
        odds: sample[i] ? sample[i].toFixed(2) : (4.0 + i).toFixed(2),
        confirmed_stake: null,
      }));
    });
  };

  // Save Scenario to Database
  const handleSaveScenario = async () => {
    if (!calculation || !calculation.outcomes) {
      setErrorMessage("Nessun calcolo valido da salvare.");
      return;
    }

    const validOutcomes = calculation.outcomes.filter((o) => Number(o.odds) > 1.0);
    if (validOutcomes.length === 0) {
      setErrorMessage("Inserisci almeno un esito con quota valida (> 1.0) prima di salvare.");
      return;
    }

    const defaultName = scenarioName.trim()
      ? scenarioName.trim()
      : `Dutching ${validOutcomes.length} Esiti - €${calculation.actual_invested} (${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })})`;

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(null);

    try {
      const payload = {
        name: defaultName,
        target_bankroll: calculation.target_bankroll,
        actual_invested: calculation.actual_invested,
        notes: `Lavagna: ${calculation.bookmaker_margin}% - Multiplo di arrotondamento: €${roundStep}`,
        outcomes: calculation.outcomes.map((o) => ({
          outcome_name: o.name || `Esito ${o.order_index + 1}`,
          odds: Number(o.odds),
          implied_prob: Number(o.implied_prob),
          calculated_stake: Number(o.calculated_stake),
          rounded_stake: Number(o.rounded_stake),
          confirmed_stake: Number(o.confirmed_stake),
          potential_payout: Number(o.potential_payout),
          potential_profit: Number(o.potential_profit),
          potential_roi: Number(o.potential_roi),
          order_index: o.order_index,
          is_winner: false,
        })),
      };

      const saved = await api.saveScenario(payload);
      setSaveSuccess(saved);
      if (onScenarioSaved) {
        onScenarioSaved(saved);
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage("Impossibile salvare lo scenario nel database: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const actualInvested = calculation ? calculation.actual_invested : 0;

  return (
    <div className="calculator-view" id="dutching-calculator-container">
      {/* Error message banner if any */}
      {errorMessage && (
        <div className="alert-banner info" style={{ borderColor: 'var(--negative)', color: 'var(--negative-light)' }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="alert-banner success" id="save-success-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} color="var(--positive-light)" />
            <div>
              <strong>Scenario salvato con successo nel database!</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                ID: {saveSuccess.id} &bull; Nome: &ldquo;{saveSuccess.name}&rdquo;
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            onClick={onViewHistory}
            id="btn-goto-history-from-save"
          >
            <span>Apri nello Storico</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 1. BANKROLL TOTALE, NUM EVENTI E ARROTONDAMENTO */}
      <div className="controls-bar" id="calculator-controls-bar">
        {/* Bankroll Input */}
        <div className="control-group">
          <label className="control-label" htmlFor="bankroll-input">
            <Wallet size={16} color="#3b82f6" />
            <span>Bankroll Totale (€)</span>
          </label>
          <div className="bankroll-input-wrap">
            <span className="input-currency-symbol">€</span>
            <input
              id="bankroll-input"
              type="number"
              step="50"
              min="10"
              className="styled-input with-prefix"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value) || 0)}
              onWheel={(e) => e.target.blur()}
              placeholder="1000"
            />
          </div>
          {/* Quick Bankroll Presets */}
          <div className="presets-row">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                id={`preset-amt-${amt}`}
                className={`preset-chip ${bankroll === amt ? 'active' : ''}`}
                onClick={() => setBankroll(amt)}
              >
                €{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Events Counter */}
        <div className="control-group">
          <label className="control-label">
            <Layers size={16} color="#3b82f6" />
            <span>Numero di Eventi / Esiti da Coprire</span>
          </label>
          <div className="counter-controls">
            <button
              type="button"
              id="btn-decrement-events"
              className="counter-btn"
              onClick={() => handleCountChange(eventCount - 1)}
              disabled={eventCount <= 2}
              title="Rimuovi esito"
            >
              -
            </button>
            <div className="counter-display" id="event-count-display">
              {eventCount} Esiti
            </div>
            <button
              type="button"
              id="btn-increment-events"
              className="counter-btn"
              onClick={() => handleCountChange(eventCount + 1)}
              disabled={eventCount >= 12}
              title="Aggiungi esito"
            >
              +
            </button>
          </div>
        </div>

        {/* Rounding Step Control (Modifiable, default 5) */}
        <div className="control-group">
          <label className="control-label" htmlFor="round-step-input">
            <DollarSign size={16} color="#10b981" />
            <span>Passo di Arrotondamento (€)</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              id="round-step-input"
              type="number"
              min="1"
              step="1"
              className="styled-input"
              style={{ width: '80px', textAlign: 'center', padding: '0.55rem' }}
              value={roundStep}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRoundStep(val > 0 ? val : 1);
              }}
              onWheel={(e) => e.target.blur()}
              title="Inserisci qualsiasi valore di arrotondamento"
            />
            <div className="presets-row" style={{ marginTop: 0 }}>
              {[1, 2, 5, 10, 20].map((stepVal) => (
                <button
                  key={stepVal}
                  type="button"
                  id={`preset-step-${stepVal}`}
                  className={`preset-chip ${roundStep === stepVal ? 'active' : ''}`}
                  onClick={() => setRoundStep(stepVal)}
                >
                  ±{stepVal}€
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Puntate arrotondate per eccesso o difetto a multipli di {roundStep}€
          </span>
        </div>
      </div>

      {/* 2. NOME SCENARIO */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }} id="scenario-name-card">
        <label
          className="control-label"
          htmlFor="scenario-name-input"
          style={{ marginBottom: '0.45rem', fontSize: '0.9rem' }}
        >
          <Tag size={16} color="#3b82f6" />
          <span>Nome dello Scenario (Opzionale)</span>
        </label>
        <input
          id="scenario-name-input"
          type="text"
          className="styled-input"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="Es. Real Madrid vs Barcellona - Dutching 5 Esiti"
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>
          Assegna un nome per identificare facilmente questa giocata nello storico
        </span>
      </div>

      {/* 3. RIEPILOGO TOTALI (BANKROLL PREVISTO, INVESTITO EFFETTIVO) & AZIONI SALVATAGGIO */}
      <div className="save-scenario-card" id="save-scenario-section" style={{ marginBottom: '1.5rem' }}>
        <div className="save-scenario-inner" style={{ justifyContent: 'space-between' }}>
          {/* Aggregated Totals Pills */}
          <div className="scenario-summary-pills">
            <div className="summary-pill">
              <span className="summary-pill-label">Bankroll Previsto</span>
              <span className="summary-pill-val">€{bankroll}</span>
            </div>

            <div className="summary-pill">
              <span className="summary-pill-label">Investito Effettivo (Arrotondato)</span>
              <span className="summary-pill-val" style={{ color: '#60a5fa' }} id="actual-invested-display">
                €{actualInvested.toFixed(2)}
              </span>
            </div>

            <div className="summary-pill">
              <span className="summary-pill-label">Differenza Arrotondamento</span>
              <span
                className="summary-pill-val"
                style={{
                  color: actualInvested === bankroll ? 'var(--positive-light)' : 'var(--warning)',
                  fontSize: '0.95rem'
                }}
              >
                {actualInvested === bankroll
                  ? 'Perfetto (€0)'
                  : `${actualInvested > bankroll ? '+' : ''}${(actualInvested - bankroll).toFixed(2)}€`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-group">
            <button
              type="button"
              id="btn-use-other-odds"
              className="btn btn-secondary"
              onClick={handleResetOdds}
            >
              <RotateCcw size={16} />
              <span>Utilizza Altre Quote</span>
            </button>

            <button
              type="button"
              id="btn-save-scenario"
              className="btn btn-primary"
              onClick={handleSaveScenario}
              disabled={isSaving || !calculation || calculation.actual_invested <= 0}
            >
              <Save size={18} />
              <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Scenario nel Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. INSERIMENTO QUOTE & RIPARTIZIONE PUNTATE */}
      <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 className="card-title">Inserimento Quote & Ripartizione Puntate</h2>
              {/* Range di % rendimento accanto al titolo */}
              {(() => {
                const validCalcOutcomes = calculation?.outcomes?.filter((o) => Number(o.odds) > 1.0) || [];
                if (validCalcOutcomes.length === 0) return null;
                const rois = validCalcOutcomes.map((o) => Number(o.potential_roi) || 0);
                const minRoi = Math.min(...rois);
                const maxRoi = Math.max(...rois);

                if (minRoi >= 0 && maxRoi >= 0) {
                  return (
                    <span className="card-range-badge positive" id="title-roi-range-badge" title="Tutti gli esiti in utile">
                      {minRoi === maxRoi ? `+${minRoi.toFixed(1)}%` : `+${minRoi.toFixed(1)}% ~ +${maxRoi.toFixed(1)}%`}
                    </span>
                  );
                } else if (maxRoi < 0) {
                  return (
                    <span className="card-range-badge negative" id="title-roi-range-badge" title="Tutti gli esiti in perdita">
                      {minRoi === maxRoi ? `${minRoi.toFixed(1)}%` : `${minRoi.toFixed(1)}% ~ ${maxRoi.toFixed(1)}%`}
                    </span>
                  );
                } else {
                  return (
                    <span className="card-range-badge mixed" id="title-roi-range-badge" title="Rendimento misto (alcuni esiti in perdita, altri in utile)">
                      <span style={{ color: 'var(--negative-light)' }}>{minRoi.toFixed(1)}%</span>
                      <span style={{ color: 'var(--text-dim)', margin: '0 3px' }}>~</span>
                      <span style={{ color: 'var(--positive-light)' }}>+{maxRoi.toFixed(1)}%</span>
                    </span>
                  );
                }
              })()}
            </div>
            <p className="card-subtitle">
              Inserisci la quota per ciascun esito. Puoi modificare liberamente le puntate confermate prima di salvare.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              id="btn-load-sample"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
              onClick={handleLoadSampleOdds}
            >
              Esempio Quote
            </button>
            <button
              type="button"
              id="btn-reset-odds"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
              onClick={handleResetOdds}
              title="Azzera e utilizza altre quote"
            >
              <RotateCcw size={14} />
              <span>Nuove Quote</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dutching-table" id="outcomes-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Nome Esito</th>
                <th style={{ textAlign: 'right' }}>Quota Decimale</th>
                <th style={{ textAlign: 'right' }}>Puntata Teorica</th>
                <th style={{ textAlign: 'right' }}>
                  Puntata Arrotondata (&plusmn;{roundStep}€)
                </th>
                <th style={{ textAlign: 'right', color: '#60a5fa' }}>
                  Puntata Confermata (€)
                </th>
                <th style={{ textAlign: 'right' }}>Vincita Potenziale</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((item, index) => {
                const calcItem = calculation?.outcomes?.[index] || {};
                const hasOdds = Number(item.odds) > 1.0;

                return (
                  <tr key={index} id={`outcome-row-${index}`}>
                    <td style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                      {index + 1}
                    </td>

                    {/* Outcome Name */}
                    <td>
                      <input
                        id={`outcome-name-${index}`}
                        type="text"
                        className="outcome-name-input"
                        value={item.name}
                        onChange={(e) => handleOutcomeChange(index, 'name', e.target.value)}
                        placeholder={`Esito ${index + 1}`}
                      />
                    </td>

                    {/* Odds Input (Numbers only, no triangles) */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        id={`outcome-odds-${index}`}
                        type="number"
                        step="0.01"
                        min="1.01"
                        className="odds-input"
                        value={item.odds}
                        onChange={(e) => handleOutcomeChange(index, 'odds', e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Es. 4.50"
                      />
                    </td>

                    {/* Calculated Theoretical Stake */}
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      <span className="mono-val">
                        {hasOdds ? `€${Number(calcItem.calculated_stake || 0).toFixed(2)}` : '--'}
                      </span>
                    </td>

                    {/* Rounded Stake to multiple of roundStep */}
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="mono-val"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}
                      >
                        {hasOdds ? `€${Number(calcItem.rounded_stake || 0).toFixed(2)}` : '--'}
                      </span>
                    </td>

                    {/* Confirmed Stake (Editable by User) */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        id={`outcome-confirmed-stake-${index}`}
                        type="number"
                        step="1"
                        min="0"
                        className="stake-editable-input"
                        value={
                          item.confirmed_stake !== null && item.confirmed_stake !== undefined
                            ? item.confirmed_stake
                            : (calcItem.rounded_stake || '')
                        }
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleOutcomeChange(index, 'confirmed_stake', val);
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder={hasOdds ? String(calcItem.rounded_stake || 0) : '0'}
                        title="Modifica manualmente la puntata se desideri"
                      />
                    </td>

                    {/* Vincita Potenziale */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono-val">
                        {hasOdds
                          ? `€${Number(calcItem.potential_payout || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '--'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RENDIMENTO NETTO PER SINGOLO ESITO */}
      <ProfitCardsHeader
        calculation={calculation}
        actualInvested={actualInvested}
      />

      {/* Bottom Save Action Bar for convenience */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button
          type="button"
          id="btn-use-other-odds-bottom"
          className="btn btn-secondary"
          onClick={handleResetOdds}
        >
          <RotateCcw size={16} />
          <span>Utilizza Altre Quote</span>
        </button>

        <button
          type="button"
          id="btn-save-scenario-bottom"
          className="btn btn-primary"
          onClick={handleSaveScenario}
          disabled={isSaving || !calculation || calculation.actual_invested <= 0}
        >
          <Save size={18} />
          <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Scenario nel Database'}</span>
        </button>
      </div>
    </div>
  );
}
