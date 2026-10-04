"""
Database layer interfacing directly with Supabase.
All persistence and queries are executed on Supabase Cloud.
"""
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))).strip()

supabase_client = None

def init_supabase():
    global supabase_client, SUPABASE_URL, SUPABASE_KEY
    load_dotenv(override=True)
    SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))).strip()

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            return True
        except Exception as e:
            print(f"Errore inizializzazione client Supabase: {e}")
            supabase_client = None
            return False
    supabase_client = None
    return False

# Initialize at startup
init_supabase()


def get_db_status() -> Dict[str, Any]:
    global supabase_client, SUPABASE_URL, SUPABASE_KEY
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {
            "storage_type": "supabase",
            "connected": False,
            "supabase_url": None,
            "message": "Credenziali Supabase non trovate nel file .env"
        }

    if not supabase_client:
        init_supabase()

    if supabase_client:
        try:
            supabase_client.table("dutching_scenarios").select("id").limit(1).execute()
            return {
                "storage_type": "supabase",
                "connected": True,
                "supabase_url": SUPABASE_URL,
                "message": "Connesso a Supabase Cloud con successo (tabelle attive)."
            }
        except Exception as e:
            err_str = str(e)
            if "PGRST205" in err_str or "Could not find the table" in err_str:
                return {
                    "storage_type": "supabase",
                    "connected": False,
                    "supabase_url": SUPABASE_URL,
                    "message": "Connesso al progetto Supabase, ma le tabelle non sono ancora state create. Esegui lo script SQL nel tuo SQL Editor su Supabase."
                }
            return {
                "storage_type": "supabase",
                "connected": False,
                "supabase_url": SUPABASE_URL,
                "message": f"Errore di connessione Supabase: {err_str}"
            }

    return {
        "storage_type": "supabase",
        "connected": False,
        "supabase_url": SUPABASE_URL,
        "message": "Client Supabase non inizializzato."
    }


def update_supabase_credentials(url: str, key: str) -> Dict[str, Any]:
    global SUPABASE_URL, SUPABASE_KEY
    SUPABASE_URL = url.strip()
    SUPABASE_KEY = key.strip()

    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(f"SUPABASE_URL={SUPABASE_URL}\n")
        f.write(f"SUPABASE_KEY={SUPABASE_KEY}\n")

    init_supabase()
    return get_db_status()


# ==============================================================================
# CRUD Operations on Supabase
# ==============================================================================

def save_scenario(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves scenario and outcomes to Supabase.
    """
    if not supabase_client:
        init_supabase()
        if not supabase_client:
            raise RuntimeError("Client Supabase non configurato. Verifica SUPABASE_URL e SUPABASE_KEY nel file .env")

    scenario_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat() + "Z"

    scenario_record = {
        "id": scenario_id,
        "name": data["name"],
        "target_bankroll": data["target_bankroll"],
        "actual_invested": data["actual_invested"],
        "status": "pending",
        "winning_outcome_id": None,
        "winning_outcome_name": None,
        "realized_payout": None,
        "realized_profit": None,
        "realized_roi": None,
        "notes": data.get("notes") or "",
        "created_at": now_iso
    }

    outcomes_records = []
    for idx, o in enumerate(data["outcomes"]):
        outcomes_records.append({
            "id": str(uuid.uuid4()),
            "scenario_id": scenario_id,
            "outcome_name": o["outcome_name"],
            "odds": o["odds"],
            "implied_prob": o["implied_prob"],
            "calculated_stake": o["calculated_stake"],
            "rounded_stake": o["rounded_stake"],
            "confirmed_stake": o["confirmed_stake"],
            "potential_payout": o["potential_payout"],
            "potential_profit": o["potential_profit"],
            "potential_roi": o["potential_roi"],
            "is_winner": False,
            "order_index": o.get("order_index", idx),
            "created_at": now_iso
        })

    try:
        supabase_client.table("dutching_scenarios").insert(scenario_record).execute()
        supabase_client.table("dutching_outcomes").insert(outcomes_records).execute()
    except Exception as e:
        raise RuntimeError(f"Errore durante l'inserimento su Supabase: {str(e)}")

    scenario_record["outcomes"] = outcomes_records
    return scenario_record


def list_scenarios() -> List[Dict[str, Any]]:
    """
    Lists all scenarios ordered by created_at DESC with their outcomes from Supabase.
    """
    if not supabase_client:
        init_supabase()
        if not supabase_client:
            return []

    try:
        res = (
            supabase_client.table("dutching_scenarios")
            .select("*, dutching_outcomes(*)")
            .order("created_at", desc=True)
            .execute()
        )
        data = res.data or []
        for s in data:
            if "dutching_outcomes" in s:
                s["outcomes"] = sorted(s.pop("dutching_outcomes"), key=lambda x: x.get("order_index", 0))
        return data
    except Exception as e:
        print(f"Errore lettura scenari da Supabase: {e}")
        return []


def get_scenario(scenario_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single scenario by ID from Supabase.
    """
    if not supabase_client:
        init_supabase()
        if not supabase_client:
            return None

    try:
        res = (
            supabase_client.table("dutching_scenarios")
            .select("*, dutching_outcomes(*)")
            .eq("id", scenario_id)
            .execute()
        )
        if res.data and len(res.data) > 0:
            s = res.data[0]
            s["outcomes"] = sorted(s.pop("dutching_outcomes", []), key=lambda x: x.get("order_index", 0))
            return s
        return None
    except Exception as e:
        print(f"Errore get scenario Supabase: {e}")
        return None


def settle_scenario(
    scenario_id: str,
    winning_outcome_id: Optional[str] = None,
    outcome_result: str = "winner"
) -> Optional[Dict[str, Any]]:
    """
    Settles a scenario on Supabase.
    """
    if not supabase_client:
        init_supabase()
        if not supabase_client:
            return None

    scenario = get_scenario(scenario_id)
    if not scenario:
        return None

    actual_invested = float(scenario["actual_invested"])
    outcomes = scenario.get("outcomes", [])

    if outcome_result == "reset":
        status = "pending"
        winning_id = None
        winning_name = None
        realized_payout = None
        realized_profit = None
        realized_roi = None
        for o in outcomes:
            o["is_winner"] = False

    elif outcome_result == "void":
        status = "void"
        winning_id = None
        winning_name = "Annullato / Rimborso"
        realized_payout = actual_invested
        realized_profit = 0.0
        realized_roi = 0.0
        for o in outcomes:
            o["is_winner"] = False

    elif outcome_result == "all_lost" or not winning_outcome_id:
        status = "settled"
        winning_id = None
        winning_name = "Nessun esito vincente (Persa)"
        realized_payout = 0.0
        realized_profit = -actual_invested
        realized_roi = -100.0
        for o in outcomes:
            o["is_winner"] = False

    else:
        status = "settled"
        winning_id = winning_outcome_id
        winning_outcome = next((o for o in outcomes if str(o["id"]) == str(winning_outcome_id)), None)
        if not winning_outcome:
            return None

        winning_name = winning_outcome["outcome_name"]
        realized_payout = round(float(winning_outcome["confirmed_stake"]) * float(winning_outcome["odds"]), 2)
        realized_profit = round(realized_payout - actual_invested, 2)
        realized_roi = round((realized_profit / actual_invested * 100), 2) if actual_invested > 0 else 0.0

        for o in outcomes:
            o["is_winner"] = (str(o["id"]) == str(winning_outcome_id))

    try:
        supabase_client.table("dutching_scenarios").update({
            "status": status,
            "winning_outcome_id": winning_id,
            "winning_outcome_name": winning_name,
            "realized_payout": realized_payout,
            "realized_profit": realized_profit,
            "realized_roi": realized_roi
        }).eq("id", scenario_id).execute()

        for o in outcomes:
            supabase_client.table("dutching_outcomes").update({
                "is_winner": o["is_winner"]
            }).eq("id", o["id"]).execute()
    except Exception as e:
        print(f"Errore aggiornamento esito Supabase: {e}")
        raise RuntimeError(f"Errore Supabase durante l'aggiornamento: {str(e)}")

    return get_scenario(scenario_id)


def delete_scenario(scenario_id: str) -> bool:
    """
    Deletes a scenario and cascaded outcomes from Supabase.
    """
    if not supabase_client:
        init_supabase()
        if not supabase_client:
            return False

    try:
        supabase_client.table("dutching_scenarios").delete().eq("id", scenario_id).execute()
        return True
    except Exception as e:
        print(f"Errore eliminazione scenario Supabase: {e}")
        return False


def get_concluded_stats() -> Dict[str, Any]:
    """
    Aggregates concluded operations stats from Supabase scenarios.
    """
    scenarios = list_scenarios()

    total_invested = 0.0
    total_returned = 0.0
    total_net_profit = 0.0
    concluded_count = 0
    winning_count = 0
    lost_count = 0
    pending_count = 0

    for s in scenarios:
        status = s.get("status")
        if status in ("settled", "void"):
            concluded_count += 1
            invested = float(s.get("actual_invested") or 0.0)
            payout = float(s.get("realized_payout") or 0.0)
            profit = float(s.get("realized_profit") or 0.0)

            total_invested += invested
            total_returned += payout
            total_net_profit += profit

            if profit > 0:
                winning_count += 1
            elif profit < 0:
                lost_count += 1
        elif status == "pending":
            pending_count += 1

    overall_roi = round((total_net_profit / total_invested * 100), 2) if total_invested > 0 else 0.0
    win_rate = round((winning_count / concluded_count * 100), 1) if concluded_count > 0 else 0.0

    return {
        "total_invested": round(total_invested, 2),
        "total_returned": round(total_returned, 2),
        "total_net_profit": round(total_net_profit, 2),
        "overall_roi": overall_roi,
        "concluded_count": concluded_count,
        "winning_count": winning_count,
        "lost_count": lost_count,
        "pending_count": pending_count,
        "win_rate": win_rate
    }
