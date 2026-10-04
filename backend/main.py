from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from models import (
    CalculateRequest, CalculateResponse,
    ScenarioCreate, ScenarioDetail, SettleRequest,
    ConcludedStats, SupabaseConfig, ConfigStatus
)
from calculator import calculate_dutching
import database as db

app = FastAPI(
    title="Dutching Calculator & Betting Tracker API",
    description="Backend FastAPI per calcolo dutching con arrotondamento a 5 e tracciamento su Supabase",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server (and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Dutching Calculator API",
        "database": db.get_db_status()
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/config/status", response_model=ConfigStatus)
def get_config_status():
    """Restituisce lo stato attuale della connessione al database (Supabase o SQLite locale)."""
    return db.get_db_status()

@app.post("/api/config/supabase", response_model=ConfigStatus)
def update_supabase_config(config: SupabaseConfig):
    """Aggiorna le credenziali Supabase a runtime e salva nel file .env."""
    status_result = db.update_supabase_credentials(config.supabase_url, config.supabase_key)
    return status_result

@app.post("/api/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    """
    Calcola le puntate dutching teoriche e arrotondate (multipli di 5),
    la percentuale di guadagno/perdita per ciascun esito coperto.
    """
    outcomes_dict = [o.model_dump() for o in req.outcomes]
    result = calculate_dutching(
        bankroll=req.bankroll,
        outcomes=outcomes_dict,
        round_step=req.round_step
    )
    return result

@app.get("/api/scenarios", response_model=List[ScenarioDetail])
def list_scenarios():
    """Elenco di tutti gli scenari di dutching salvati."""
    return db.list_scenarios()

@app.post("/api/scenarios", response_model=ScenarioDetail, status_code=status.HTTP_201_CREATED)
def create_scenario(payload: ScenarioCreate):
    """Salva un nuovo scenario di dutching con gli importi confermati."""
    try:
        scenario = db.save_scenario(payload.model_dump())
        return scenario
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante il salvataggio dello scenario: {str(e)}"
        )

@app.get("/api/scenarios/{scenario_id}", response_model=ScenarioDetail)
def get_scenario(scenario_id: str):
    """Recupera i dettagli di uno scenario specifico."""
    scenario = db.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario non trovato")
    return scenario

@app.patch("/api/scenarios/{scenario_id}/settle", response_model=ScenarioDetail)
def settle_scenario(scenario_id: str, req: SettleRequest):
    """
    Segna l'esito vincente per calcolare il guadagno/perdita effettivo realizzato.
    Supporta:
    - req.outcome_result = 'winner' con req.winning_outcome_id
    - req.outcome_result = 'all_lost' (nessun esito vincente)
    - req.outcome_result = 'void' (gara annullata)
    - req.outcome_result = 'reset' (riporta in sospeso)
    """
    updated = db.settle_scenario(
        scenario_id=scenario_id,
        winning_outcome_id=req.winning_outcome_id,
        outcome_result=req.outcome_result
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Scenario non trovato o esito non valido")
    return updated

@app.delete("/api/scenarios/{scenario_id}")
def delete_scenario(scenario_id: str):
    """Elimina uno scenario salvato."""
    success = db.delete_scenario(scenario_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scenario non trovato")
    return {"message": "Scenario eliminato con successo", "id": scenario_id}

@app.get("/api/stats/summary", response_model=ConcludedStats)
def get_summary_stats():
    """Restituisce le statistiche complessive e aggregate di tutte le operazioni concluse."""
    return db.get_concluded_stats()

# In produzione/container, se è presente la build di frontend, serviamo l'app React da FastAPI
import os
from fastapi.staticfiles import StaticFiles

dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend_dist")

