"""Pydantic-схемы."""
from __future__ import annotations
from pydantic import BaseModel, Field


class CreateOrder(BaseModel):
    customer: str
    sku: str
    quantity: int
    due_at: str


class QtyOp(BaseModel):
    qty: int


class DelayScenario(BaseModel):
    shipment_id: str
    new_expected_at: str


class PlanRequest(BaseModel):
    finished_sku: str
    batch_qty: int
    start_from: str | None = None


class StartRequest(BaseModel):
    finished_sku: str
    batch_qty: int


class ScenarioOpt(BaseModel):
    shipment_id: str
    new_expected_at: str


class AiAsk(BaseModel):
    question: str
    scenario: ScenarioOpt | None = None


class AdminNow(BaseModel):
    now: str
