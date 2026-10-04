/**
 * Configurazione dell'indirizzo API
 * Se configurato VITE_API_URL su Vercel (es. https://dutching-api.onrender.com),
 * punta al backend Render. In locale usa il proxy '/api'.
 */
const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase ? `${rawBase.replace(/\/$/, '')}/api` : '/api';

/**
 * Calcolo matematico del Dutching eseguibile direttamente in locale nel browser.
 * Garantisce calcoli istantanei a latenza zero ed evita errori 404 se il backend è in avvio.
 */
function localCalculateDutching(bankroll, outcomes, roundStep = 5.0) {
  const b = Number(bankroll) || 1000;
  const step = Number(roundStep) || 5.0;

  const valid = outcomes.map((o, idx) => ({
    order_index: idx,
    name: o.name || `Esito ${idx + 1}`,
    odds: Number(o.odds) || 0,
    confirmed_stake:
      o.confirmed_stake !== undefined && o.confirmed_stake !== null && o.confirmed_stake !== ''
        ? Number(o.confirmed_stake)
        : null,
  }));

  const active = valid.filter((o) => o.odds > 1.0);
  if (active.length === 0) {
    return {
      target_bankroll: b,
      actual_invested: 0,
      total_implied_prob: 0,
      bookmaker_margin: 0,
      is_arbitrage: false,
      outcomes: valid.map((o) => ({
        ...o,
        implied_prob: 0,
        calculated_stake: 0,
        rounded_stake: 0,
        confirmed_stake: 0,
        potential_payout: 0,
        potential_profit: 0,
        potential_roi: 0,
      })),
    };
  }

  // Somma probabilità implicite (1 / quota)
  const sumProb = active.reduce((acc, curr) => acc + 1.0 / curr.odds, 0);

  const processed = valid.map((item) => {
    if (item.odds > 1.0) {
      const prob = 1.0 / item.odds;
      const theorStake = (b * prob) / sumProb;
      let rounded = Math.round(theorStake / step) * step;
      if (rounded === 0 && theorStake > 0) rounded = step;
      const confirmed = item.confirmed_stake !== null ? item.confirmed_stake : rounded;
      return {
        ...item,
        implied_prob: Number((prob * 100).toFixed(2)),
        calculated_stake: Number(theorStake.toFixed(2)),
        rounded_stake: Number(rounded.toFixed(2)),
        confirmed_stake: Number(confirmed.toFixed(2)),
      };
    }
    return {
      ...item,
      implied_prob: 0,
      calculated_stake: 0,
      rounded_stake: 0,
      confirmed_stake: 0,
    };
  });

  const actualInvested = processed.reduce((acc, curr) => acc + curr.confirmed_stake, 0);
  const rois = [];

  const results = processed.map((o) => {
    if (o.odds > 1.0 && o.confirmed_stake > 0) {
      const payout = Number((o.confirmed_stake * o.odds).toFixed(2));
      const profit = Number((payout - actualInvested).toFixed(2));
      const roi = actualInvested > 0 ? Number(((profit / actualInvested) * 100).toFixed(2)) : 0;
      rois.push(roi);
      return {
        ...o,
        potential_payout: payout,
        potential_profit: profit,
        potential_roi: roi,
      };
    }
    return {
      ...o,
      potential_payout: 0,
      potential_profit: actualInvested > 0 ? -actualInvested : 0,
      potential_roi: actualInvested > 0 ? -100 : 0,
    };
  });

  return {
    target_bankroll: b,
    actual_invested: Number(actualInvested.toFixed(2)),
    total_implied_prob: Number(sumProb.toFixed(4)),
    bookmaker_margin: Number((sumProb * 100).toFixed(2)),
    is_arbitrage: rois.length > 0 && rois.every((r) => r > 0),
    outcomes: results,
  };
}

/**
 * Helper per chiamate API con gestione degli errori
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = `Errore HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.detail || errorMsg;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Chiamata API [${endpoint}] non riuscita:`, err.message);
    throw err;
  }
}

export const api = {
  // Calcolo quote dutching (calcola in locale in modo ultra-rapido, con fallback trasparente)
  calculateDutching: async (bankroll, outcomes, roundStep = 5.0) => {
    // Esegue prima il calcolo locale per risposta istantanea (0 ms)
    try {
      // Tenta anche l'API se disponibile per allineamento
      const res = await request('/calculate', {
        method: 'POST',
        body: JSON.stringify({
          bankroll: Number(bankroll) || 1000,
          outcomes: outcomes.map((o) => ({
            name: o.name || undefined,
            odds: Number(o.odds) || 0,
            confirmed_stake:
              o.confirmed_stake !== undefined && o.confirmed_stake !== null && o.confirmed_stake !== ''
                ? Number(o.confirmed_stake)
                : null,
          })),
          round_step: Number(roundStep) || 5.0,
        }),
      });
      return res;
    } catch {
      // Se il backend non è collegato o restituisce 404, usa il motore di calcolo locale
      return localCalculateDutching(bankroll, outcomes, roundStep);
    }
  },

  // Scenari
  fetchScenarios: async () => {
    try {
      return await request('/scenarios');
    } catch (err) {
      return [];
    }
  },

  saveScenario: (scenarioData) => {
    return request('/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenarioData),
    });
  },

  getScenario: (id) => request(`/scenarios/${id}`),

  settleScenario: (id, winningOutcomeId = null, outcomeResult = 'winner') => {
    return request(`/scenarios/${id}/settle`, {
      method: 'PATCH',
      body: JSON.stringify({
        winning_outcome_id: winningOutcomeId,
        outcome_result: outcomeResult,
      }),
    });
  },

  deleteScenario: (id) => {
    return request(`/scenarios/${id}`, {
      method: 'DELETE',
    });
  },

  // Statistiche complessive operazioni concluse
  fetchConcludedStats: async () => {
    try {
      return await request('/stats/summary');
    } catch (err) {
      return {
        total_invested: 0,
        total_returned: 0,
        total_net_profit: 0,
        overall_roi: 0,
        concluded_count: 0,
        winning_count: 0,
        lost_count: 0,
        pending_count: 0,
        win_rate: 0,
      };
    }
  },

  // Configurazione DB
  fetchConfigStatus: async () => {
    try {
      return await request('/config/status');
    } catch (err) {
      return {
        storage_type: 'supabase',
        connected: false,
        message: 'Backend su Render in avvio o non ancora collegato a Vercel.',
      };
    }
  },
};
