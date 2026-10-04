"""
Dutching calculation engine.
Handles theoretical stakes, rounding to nearest multiples of 5,
payout and net profit / ROI calculations for each outcome.
"""
from typing import List, Dict, Any, Optional

def round_to_step(value: float, step: float = 5.0) -> float:
    """
    Rounds a number to the nearest multiple of step (default: 5.0).
    E.g. 182 -> 180, 183 -> 185, 187 -> 185, 188 -> 190.
    """
    if step <= 0:
        return round(value, 2)
    rounded = round(value / step) * step
    return float(rounded)

def calculate_dutching(
    bankroll: float,
    outcomes: List[Dict[str, Any]],
    round_step: float = 5.0
) -> Dict[str, Any]:
    """
    Calculates dutching stakes and returns detailed metrics for each outcome.

    outcomes format:
    [
        {"name": "Esito 1", "odds": 3.50, "confirmed_stake": None},
        ...
    ]
    """
    if bankroll <= 0:
        bankroll = 1000.0

    valid_outcomes = []
    for idx, item in enumerate(outcomes):
        name = item.get("name") or f"Esito {idx + 1}"
        try:
            odds = float(item.get("odds") or 0.0)
        except (ValueError, TypeError):
            odds = 0.0
        
        confirmed_stake = item.get("confirmed_stake")
        if confirmed_stake is not None:
            try:
                confirmed_stake = float(confirmed_stake)
            except (ValueError, TypeError):
                confirmed_stake = None

        valid_outcomes.append({
            "order_index": idx,
            "name": name,
            "odds": odds,
            "manual_stake": confirmed_stake
        })

    # Check which outcomes have valid odds > 1.0
    active_items = [o for o in valid_outcomes if o["odds"] > 1.0]

    if not active_items:
        # Return empty/default calculation
        return {
            "target_bankroll": bankroll,
            "actual_invested": 0.0,
            "total_implied_prob": 0.0,
            "bookmaker_margin": 0.0,
            "is_arbitrage": False,
            "outcomes": [
                {
                    "order_index": o["order_index"],
                    "name": o["name"],
                    "odds": o["odds"],
                    "implied_prob": 0.0,
                    "calculated_stake": 0.0,
                    "rounded_stake": 0.0,
                    "confirmed_stake": 0.0,
                    "potential_payout": 0.0,
                    "potential_profit": 0.0,
                    "potential_roi": 0.0
                }
                for o in valid_outcomes
            ]
        }

    # Sum of implied probabilities (1 / odds)
    total_implied_prob = sum(1.0 / item["odds"] for item in active_items)

    processed_outcomes = []
    for item in valid_outcomes:
        odds = item["odds"]
        if odds > 1.0:
            implied_prob = 1.0 / odds
            # Theoretical stake: (bankroll * implied_prob) / total_implied_prob
            calculated_stake = (bankroll * implied_prob) / total_implied_prob
            rounded_stake = round_to_step(calculated_stake, round_step)
            
            # If rounded to 0 but calculated > 0, set to minimum 5 if possible
            if rounded_stake == 0.0 and calculated_stake > 0:
                rounded_stake = round_step

            # If user manually confirmed stake, use that; otherwise use rounded_stake
            confirmed_stake = item["manual_stake"] if item["manual_stake"] is not None else rounded_stake
        else:
            implied_prob = 0.0
            calculated_stake = 0.0
            rounded_stake = 0.0
            confirmed_stake = 0.0

        processed_outcomes.append({
            "order_index": item["order_index"],
            "name": item["name"],
            "odds": odds,
            "implied_prob": round(implied_prob * 100, 2),
            "calculated_stake": round(calculated_stake, 2),
            "rounded_stake": round(rounded_stake, 2),
            "confirmed_stake": round(confirmed_stake, 2),
        })

    # Total actual stake invested is the sum of confirmed stakes
    actual_invested = sum(o["confirmed_stake"] for o in processed_outcomes)

    # Now calculate payout, net profit and ROI for each outcome
    results = []
    rois = []
    for o in processed_outcomes:
        odds = o["odds"]
        confirmed_stake = o["confirmed_stake"]
        if odds > 1.0 and confirmed_stake > 0:
            potential_payout = round(confirmed_stake * odds, 2)
            potential_profit = round(potential_payout - actual_invested, 2)
            potential_roi = round((potential_profit / actual_invested * 100), 2) if actual_invested > 0 else 0.0
            rois.append(potential_roi)
        else:
            potential_payout = 0.0
            potential_profit = round(-actual_invested, 2) if actual_invested > 0 else 0.0
            potential_roi = -100.0 if actual_invested > 0 else 0.0

        results.append({
            **o,
            "potential_payout": potential_payout,
            "potential_profit": potential_profit,
            "potential_roi": potential_roi
        })

    is_arbitrage = len(rois) > 0 and all(r > 0 for r in rois)
    bookmaker_margin = round(total_implied_prob * 100, 2)

    return {
        "target_bankroll": round(bankroll, 2),
        "actual_invested": round(actual_invested, 2),
        "total_implied_prob": round(total_implied_prob, 4),
        "bookmaker_margin": bookmaker_margin,
        "is_arbitrage": is_arbitrage,
        "outcomes": results
    }
