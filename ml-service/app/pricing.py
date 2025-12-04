"""
Energy Price Calculator for Vel-SCADA P2P Energy Trading

Base Price: PLN R-1/TR 1.300 VA = Rp 1.444,70/kWh
Multiplier based on supply/demand ratio
"""

from pydantic import BaseModel
from typing import Optional
import numpy as np


# PLN Base Rate (R-1/TR 1.300 VA)
PLN_BASE_PRICE = 1444.70

# Multiplier bounds
MIN_MULTIPLIER = 0.8  # High supply, low demand
MAX_MULTIPLIER = 1.3  # Low supply, high demand


class SupplyDemandInput(BaseModel):
    """Input data for price calculation"""
    total_supply_kwh: float  # Total kWh available for sale
    total_demand_kwh: float  # Total kWh bought in last 24h


class PriceOutput(BaseModel):
    """Output price calculation"""
    base_price: float
    multiplier: float
    final_price: float
    supply_kwh: float
    demand_kwh: float
    supply_demand_ratio: Optional[float]
    market_condition: str  # "high_supply", "balanced", "high_demand"


def calculate_multiplier(supply: float, demand: float) -> tuple[float, str]:
    """
    Calculate price multiplier based on supply/demand ratio.

    Logic:
    - If supply >> demand: multiplier < 1 (price goes down)
    - If supply == demand: multiplier = 1 (base price)
    - If supply << demand: multiplier > 1 (price goes up)

    Using sigmoid-like function for smooth transition.
    """
    # Handle edge cases
    if supply <= 0 and demand <= 0:
        return 1.0, "balanced"

    if supply <= 0:
        # No supply but there's demand = high demand
        return MAX_MULTIPLIER, "high_demand"

    if demand <= 0:
        # Supply but no demand = high supply
        return MIN_MULTIPLIER, "high_supply"

    # Calculate ratio (supply / demand)
    # ratio > 1 means more supply than demand
    # ratio < 1 means more demand than supply
    ratio = supply / demand

    # Use logarithmic scaling for smoother curve
    # log(ratio) = 0 when ratio = 1 (balanced)
    # log(ratio) > 0 when supply > demand
    # log(ratio) < 0 when demand > supply
    log_ratio = np.log(ratio)

    # Map to multiplier range using sigmoid-like function
    # Centered at 1.0, bounded by MIN and MAX
    # k controls steepness of transition
    k = 0.5

    # Inverse relationship: more supply = lower price
    # So we negate the log_ratio
    sigmoid = 1 / (1 + np.exp(k * log_ratio))

    # Scale to our multiplier range
    multiplier = MIN_MULTIPLIER + (MAX_MULTIPLIER - MIN_MULTIPLIER) * sigmoid

    # Determine market condition
    if ratio > 1.5:
        condition = "high_supply"
    elif ratio < 0.67:
        condition = "high_demand"
    else:
        condition = "balanced"

    return round(multiplier, 4), condition


def calculate_price(supply_kwh: float, demand_kwh: float) -> PriceOutput:
    """
    Calculate final energy price based on supply and demand.

    Args:
        supply_kwh: Total kWh available for sale on platform
        demand_kwh: Total kWh bought in last 24 hours

    Returns:
        PriceOutput with all calculation details
    """
    multiplier, condition = calculate_multiplier(supply_kwh, demand_kwh)

    final_price = round(PLN_BASE_PRICE * multiplier, 2)

    # Calculate ratio for display
    ratio = None
    if demand_kwh > 0:
        ratio = round(supply_kwh / demand_kwh, 4)

    return PriceOutput(
        base_price=PLN_BASE_PRICE,
        multiplier=multiplier,
        final_price=final_price,
        supply_kwh=supply_kwh,
        demand_kwh=demand_kwh,
        supply_demand_ratio=ratio,
        market_condition=condition
    )
