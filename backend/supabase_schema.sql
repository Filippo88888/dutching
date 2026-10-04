-- ==============================================================================
-- Schema Supabase per l'applicazione Dutching Calculator
-- Esegui questo script nell'editor SQL del tuo progetto Supabase
-- ==============================================================================

-- 1. Tabella degli Scenari di Dutching
CREATE TABLE IF NOT EXISTS public.dutching_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_bankroll NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    actual_invested NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'void')),
    winning_outcome_id UUID NULL,
    winning_outcome_name TEXT NULL,
    realized_payout NUMERIC(12, 2) NULL,
    realized_profit NUMERIC(12, 2) NULL,
    realized_roi NUMERIC(8, 2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabella dei singoli Esiti dello Scenario
CREATE TABLE IF NOT EXISTS public.dutching_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.dutching_scenarios(id) ON DELETE CASCADE,
    outcome_name TEXT NOT NULL,
    odds NUMERIC(10, 3) NOT NULL,
    implied_prob NUMERIC(8, 4) NOT NULL,
    calculated_stake NUMERIC(12, 2) NOT NULL,
    rounded_stake NUMERIC(12, 2) NOT NULL,
    confirmed_stake NUMERIC(12, 2) NOT NULL,
    potential_payout NUMERIC(12, 2) NOT NULL,
    potential_profit NUMERIC(12, 2) NOT NULL,
    potential_roi NUMERIC(8, 2) NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per velocizzare le query
CREATE INDEX IF NOT EXISTS idx_dutching_scenarios_status ON public.dutching_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_dutching_scenarios_created_at ON public.dutching_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dutching_outcomes_scenario_id ON public.dutching_outcomes(scenario_id);

-- Configurazione Row Level Security (RLS)
ALTER TABLE public.dutching_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dutching_outcomes ENABLE ROW LEVEL SECURITY;

-- Permetti accesso in lettura/scrittura con chiave anonima o autenticata
CREATE POLICY "Permetti accesso completo a tutti per dutching_scenarios"
    ON public.dutching_scenarios
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permetti accesso completo a tutti per dutching_outcomes"
    ON public.dutching_outcomes
    FOR ALL
    USING (true)
    WITH CHECK (true);
