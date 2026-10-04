import React from 'react';
import { TrendingUp, TrendingDown, Percent, Sparkles, AlertCircle } from 'lucide-react';

export default function ProfitCardsHeader({ calculation, actualInvested }) {
  if (!calculation || !calculation.outcomes || calculation.outcomes.length === 0) {
    return null;
  }

  const outcomes = calculation.outcomes;
  const hasValidOdds = outcomes.some((o) => Number(o.odds) > 1.0);
  const isArbitrage = calculation.is_arbitrage;
  const bookmakerMargin = calculation.bookmaker_margin;

  return (
    <section className="profit-matrix-section" id="profit-matrix-section">
      <div className="profit-matrix-header">
        <div className="matrix-title">
          <Percent size={18} color="#3b82f6" />
          <span>Rendimento Netto per Singolo Esito (Puntate Arrotondate a 5€)</span>
        </div>

        {hasValidOdds && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isArbitrage ? (
              <span className="overround-badge arb" id="badge-arbitrage-detected">
                <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Arbitraggio Garantito (Lavagna {bookmakerMargin}%)
              </span>
            ) : (
              <span className="overround-badge normal" id="badge-bookmaker-margin">
                Lavagna Allibratore: {bookmakerMargin}%
              </span>
            )}
          </div>
        )}
      </div>

      {!hasValidOdds ? (
        <div
          className="glass-card"
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px dashed var(--border-medium)',
            background: 'rgba(19, 25, 38, 0.4)'
          }}
        >
          <AlertCircle size={32} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Inserisci le quote decimali per visualizzare il rendimento
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto' }}>
            Inserisci le quote per ciascun evento nella tabella sottostante. Verranno calcolate automaticamente
            le puntate arrotondate a multipli di 5 e visualizzata qui in tempo reale la % di guadagno o perdita per ogni esito.
          </p>
        </div>
      ) : (
        <div className="profit-cards-grid" id="profit-cards-container">
          {outcomes.map((item, index) => {
            const hasOdds = Number(item.odds) > 1.0;
            const roi = Number(item.potential_roi) || 0;
            const profit = Number(item.potential_profit) || 0;
            const payout = Number(item.potential_payout) || 0;
            const confirmedStake = Number(item.confirmed_stake) || 0;
            const isPositive = profit >= 0;

            if (!hasOdds) {
              return (
                <div
                  key={index}
                  className="profit-card neutral"
                  id={`profit-card-${index}`}
                >
                  <div className="profit-card-label">{item.name || `Esito ${index + 1}`}</div>
                  <div className="profit-card-percent" style={{ color: 'var(--text-dim)', fontSize: '1.4rem' }}>
                    -- %
                  </div>
                  <div className="profit-card-amount" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Quota non valida (&le; 1.0)
                  </div>
                  <div className="profit-card-payout">Nessuna copertura</div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`profit-card ${isPositive ? 'positive' : 'negative'}`}
                id={`profit-card-${index}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.2rem'
                  }}
                >
                  <span className="profit-card-label" title={item.name}>
                    Se vince: <strong>{item.name || `Esito ${index + 1}`}</strong>
                  </span>
                  {isPositive ? (
                    <TrendingUp size={16} color="var(--positive-light)" />
                  ) : (
                    <TrendingDown size={16} color="var(--negative-light)" />
                  )}
                </div>

                {/* Percentage Display - Primary user requirement */}
                <div className="profit-card-percent" id={`roi-percent-${index}`}>
                  {isPositive ? `+${roi.toFixed(2)}%` : `${roi.toFixed(2)}%`}
                </div>

                {/* Profit in Currency */}
                <div className="profit-card-amount" id={`profit-val-${index}`}>
                  {isPositive
                    ? `+€${profit.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `-€${Math.abs(profit).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>

                {/* Detailed breakdown pill */}
                <div className="profit-card-payout">
                  Puntata: €{confirmedStake} (Q. {Number(item.odds).toFixed(2)}) &bull; Incasso: €
                  {payout.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
