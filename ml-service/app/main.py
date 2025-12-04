"""
Vel-SCADA ML Service - FastAPI Application

Provides pricing calculation based on PLN base rate + supply/demand dynamics.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from .pricing import (
    calculate_price,
    PLN_BASE_PRICE,
    MIN_MULTIPLIER,
    MAX_MULTIPLIER,
    SupplyDemandInput,
    PriceOutput
)

app = FastAPI(
    title="Vel-SCADA ML Service",
    description="Energy pricing API based on PLN rates and supply/demand",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class PriceRequest(BaseModel):
    total_supply_kwh: float = 0.0
    total_demand_kwh: float = 0.0


class PriceResponse(BaseModel):
    success: bool
    data: PriceOutput
    calculated_at: str


class ConfigResponse(BaseModel):
    base_price: float
    base_price_source: str
    min_multiplier: float
    max_multiplier: float
    min_possible_price: float
    max_possible_price: float


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )


@app.get("/config", response_model=ConfigResponse)
async def get_config():
    """Get pricing configuration"""
    return ConfigResponse(
        base_price=PLN_BASE_PRICE,
        base_price_source="PLN R-1/TR 1.300 VA",
        min_multiplier=MIN_MULTIPLIER,
        max_multiplier=MAX_MULTIPLIER,
        min_possible_price=round(PLN_BASE_PRICE * MIN_MULTIPLIER, 2),
        max_possible_price=round(PLN_BASE_PRICE * MAX_MULTIPLIER, 2)
    )


@app.post("/price/calculate", response_model=PriceResponse)
async def calculate_energy_price(request: PriceRequest):
    """
    Calculate energy price based on current supply and demand.

    - **total_supply_kwh**: Total kWh available for sale on platform
    - **total_demand_kwh**: Total kWh bought in last 24 hours

    Returns calculated price with multiplier and market condition.
    """
    try:
        price_data = calculate_price(
            supply_kwh=request.total_supply_kwh,
            demand_kwh=request.total_demand_kwh
        )

        return PriceResponse(
            success=True,
            data=price_data,
            calculated_at=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/price/current")
async def get_current_price():
    """
    Get current price (without supply/demand input).
    Returns base PLN price.
    """
    price_data = calculate_price(supply_kwh=0, demand_kwh=0)

    return PriceResponse(
        success=True,
        data=price_data,
        calculated_at=datetime.now().isoformat()
    )
