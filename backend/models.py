from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OutcomeInput(BaseModel):
    name: Optional[str] = None
    odds: float = Field(default=0.0, ge=0.0)
    confirmed_stake: Optional[float] = None

class CalculateRequest(BaseModel):
    bankroll: float = Field(default=1000.0, gt=0)
    outcomes: List[OutcomeInput]
    round_step: float = Field(default=5.0, ge=1.0)

class OutcomeCalculated(BaseModel):
    order_index: int
    name: str
    odds: float
    implied_prob: float
    calculated_stake: float
    rounded_stake: float
    confirmed_stake: float
    potential_payout: float
    potential_profit: float
    potential_roi: float

class CalculateResponse(BaseModel):
    target_bankroll: float
    actual_invested: float
    total_implied_prob: float
    bookmaker_margin: float
    is_arbitrage: bool
    outcomes: List[OutcomeCalculated]

class OutcomeCreate(BaseModel):
    id: Optional[str] = None
    outcome_name: str
    odds: float
    implied_prob: float
    calculated_stake: float
    rounded_stake: float
    confirmed_stake: float
    potential_payout: float
    potential_profit: float
    potential_roi: float
    order_index: int = 0
    is_winner: bool = False

class ScenarioCreate(BaseModel):
    name: str = Field(min_length=1)
    target_bankroll: float
    actual_invested: float
    notes: Optional[str] = None
    outcomes: List[OutcomeCreate]

class SettleRequest(BaseModel):
    winning_outcome_id: Optional[str] = None  # None means all lost or void
    outcome_result: str = "winner"  # "winner", "all_lost", "void"

class OutcomeDetail(BaseModel):
    id: str
    scenario_id: str
    outcome_name: str
    odds: float
    implied_prob: float
    calculated_stake: float
    rounded_stake: float
    confirmed_stake: float
    potential_payout: float
    potential_profit: float
    potential_roi: float
    is_winner: bool
    order_index: int

class ScenarioDetail(BaseModel):
    id: str
    name: str
    target_bankroll: float
    actual_invested: float
    status: str  # 'pending', 'settled', 'void'
    winning_outcome_id: Optional[str] = None
    winning_outcome_name: Optional[str] = None
    realized_payout: Optional[float] = None
    realized_profit: Optional[float] = None
    realized_roi: Optional[float] = None
    notes: Optional[str] = None
    created_at: str
    outcomes: List[OutcomeDetail] = []

class ConcludedStats(BaseModel):
    total_invested: float
    total_returned: float
    total_net_profit: float
    overall_roi: float
    concluded_count: int
    winning_count: int
    lost_count: int
    pending_count: int
    win_rate: float

class SupabaseConfig(BaseModel):
    supabase_url: str
    supabase_key: str

class ConfigStatus(BaseModel):
    storage_type: str  # "supabase" or "local_sqlite"
    connected: bool
    supabase_url: Optional[str] = None
    message: str
