#!/usr/bin/env python3
"""

_CREATED_VERSION = "4.0.0"  # Versión en que fue creado este archivo
plan_engine.py — BAGO 4.1.5 Plan Engine

Genera y ejecuta planes paso a paso usando el provider activo.
Mantiene el plan en la sesión para ejecución progresiva.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from typing import Any

VALID_STEP_STATUSES = ("pending", "running", "done", "failed", "blocked")
VALID_PLAN_STATUSES = VALID_STEP_STATUSES


@dataclass
class Step:
    """Un paso de un plan."""
    number: int
    description: str
    status: str = "pending"  # pending | running | done | failed | blocked
    result: str = ""
    required_evidence: tuple[str, ...] = ()
    evidence: tuple[str, ...] = ()
    block_reason: str = ""
    block_code: str = ""


@dataclass
class Plan:
    """Plan generado con pasos numerados."""
    task: str
    steps: list[Step] = field(default_factory=list)
    status: str = "pending"  # pending | running | done | failed | blocked

    def to_text(self) -> str:
        lines = [f"📋 Plan: {self.task}", ""]
        for step in self.steps:
            icon = {
                "pending": "○",
                "running": "◐",
                "done": "✓",
                "failed": "✗",
                "blocked": "⧖",
            }.get(step.status, "○")
            extra = []
            if step.required_evidence:
                extra.append(f"evidencia={len(step.required_evidence)}")
            if step.evidence:
                extra.append(f"aportes={len(step.evidence)}")
            if step.block_reason:
                extra.append(f"bloqueo={step.block_reason}")
            suffix = f" [{' | '.join(extra)}]" if extra else ""
            lines.append(f"  {icon} {step.number}. {step.description}{suffix}")
        return "\n".join(lines)


class PlanEngine:
    """Genera planes usando el provider activo y los ejecuta paso a paso."""

    def __init__(self) -> None:
        self.current_plan: Plan | None = None

    @staticmethod
    def parse_steps(text: str) -> list[Step]:
        """Extrae pasos numerados de una respuesta de modelo."""
        steps: list[Step] = []
        # Busca líneas que empiecen con número + punto o guión
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            # Patrones: "1. Paso", "1) Paso", "- Paso", "Step 1: Paso"
            match = re.match(r"^(?:\d+[.\)]\s*|[-*]\s+|(?:Paso\s+|Step\s+)\d+[:.]?\s*)*(.+)$", line, re.IGNORECASE)
            if match:
                desc = match.group(1).strip()
                if desc and len(desc) > 5:
                    steps.append(Step(number=len(steps) + 1, description=desc))
        return steps

    def generate_prompt(self, task: str) -> str:
        """Prompt para pedir un plan paso a paso al modelo."""
        return (
            f"Genera un plan paso a paso conciso para esta tarea: {task}\n\n"
            "Responde SOLO con una lista numerada de pasos. "
            "Cada paso debe ser una acción concreta y ejecutable. "
            "No incluyas explicaciones adicionales."
        )

    def create_plan(self, task: str, model_response: str) -> Plan:
        """Crea un Plan a partir de la respuesta del modelo."""
        steps = self.parse_steps(model_response)
        if not steps:
            # Fallback: si no parseó bien, crea un paso con todo el texto
            steps = [Step(number=1, description=model_response.strip()[:200])]
        plan = Plan(task=task, steps=steps)
        self.current_plan = plan
        return plan

    @staticmethod
    def _coerce_status(status: str) -> str:
        normalized = str(status or "").strip().lower()
        if normalized not in VALID_STEP_STATUSES:
            raise ValueError(f"Estado inválido: {status}")
        return normalized

    def get_next_step(self) -> Step | None:
        """Retorna el siguiente paso pendiente."""
        if not self.current_plan:
            return None
        for step in self.current_plan.steps:
            if step.status == "pending":
                return step
        return None

    def mark_step(
        self,
        step: Step,
        status: str,
        result: str = "",
        *,
        evidence: tuple[str, ...] | list[str] | None = None,
        block_reason: str = "",
        block_code: str = "",
    ) -> None:
        normalized = self._coerce_status(status)
        evidence_tuple = tuple(str(item) for item in (evidence or ()))
        if normalized == "done" and not evidence_tuple:
            raise ValueError("done requiere evidencia")
        step.status = normalized
        if result:
            step.result = result
        step.evidence = evidence_tuple
        step.block_reason = block_reason if normalized == "blocked" else ""
        step.block_code = block_code if normalized == "blocked" else ""
        # Actualizar estado del plan
        if self.current_plan:
            if any(s.status == "blocked" for s in self.current_plan.steps):
                self.current_plan.status = "blocked"
            elif all(s.status == "done" for s in self.current_plan.steps):
                self.current_plan.status = "done"
            elif any(s.status == "running" for s in self.current_plan.steps):
                self.current_plan.status = "running"
            elif any(s.status == "failed" for s in self.current_plan.steps):
                self.current_plan.status = "failed"
            else:
                self.current_plan.status = "pending"

    def block_step(
        self,
        step: Step,
        reason: str,
        *,
        code: str = "",
        evidence: tuple[str, ...] | list[str] | None = None,
    ) -> None:
        """Marca el paso como bloqueado con causa estructurada."""
        self.mark_step(step, "blocked", evidence=evidence, block_reason=reason, block_code=code)

    def reset(self) -> None:
        self.current_plan = None


def _run_tests() -> int:
    engine = PlanEngine()

    # Test parse_steps
    text = """1. Instalar dependencias
    2. Crear archivo main.py
    3. Ejecutar tests
    4. Revisar resultados"""
    steps = engine.parse_steps(text)
    assert len(steps) == 4
    assert steps[0].description == "Instalar dependencias"
    assert steps[3].number == 4

    # Test plan creation
    plan = engine.create_plan("Crear una API", text)
    assert plan.task == "Crear una API"
    assert len(plan.steps) == 4
    assert "Crear una API" in plan.to_text()

    # Test next step
    next_step = engine.get_next_step()
    assert next_step and next_step.number == 1

    engine.mark_step(next_step, "done", "ok", evidence=("result:ok",))
    next_step = engine.get_next_step()
    assert next_step and next_step.number == 2

    blocked = engine.get_next_step()
    assert blocked is not None
    engine.block_step(blocked, "dependencia faltante", code="dep_missing")
    assert engine.current_plan.status == "blocked"
    assert blocked.block_reason == "dependencia faltante"

    print("plan_engine.py --test: ALL PASS")
    return 0


if __name__ == "__main__":
    if "--test" in sys.argv:
        raise SystemExit(_run_tests())
