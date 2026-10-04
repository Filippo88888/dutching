const API_BASE = '/api';

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
        // ignore fallback
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`Chiamata API fallita [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Calcolo quote dutching
  calculateDutching: (bankroll, outcomes, roundStep = 5.0) => {
    return request('/calculate', {
      method: 'POST',
      body: JSON.stringify({
        bankroll: Number(bankroll) || 1000,
        outcomes: outcomes.map((o) => ({
          name: o.name || undefined,
          odds: Number(o.odds) || 0,
          confirmed_stake: o.confirmed_stake !== undefined && o.confirmed_stake !== null && o.confirmed_stake !== ''
            ? Number(o.confirmed_stake)
            : null,
        })),
        round_step: Number(roundStep) || 5.0,
      }),
    });
  },

  // Scenari
  fetchScenarios: () => request('/scenarios'),

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
  fetchConcludedStats: () => request('/stats/summary'),

  // Configurazione Supabase
  fetchConfigStatus: () => request('/config/status'),

  updateSupabaseConfig: (supabaseUrl, supabaseKey) => {
    return request('/config/supabase', {
      method: 'POST',
      body: JSON.stringify({
        supabase_url: supabaseUrl,
        supabase_key: supabaseKey,
      }),
    });
  },
};
