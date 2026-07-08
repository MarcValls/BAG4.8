"""handlers_jobs.py - Pipeline/job endpoints for the BAGO HTTP bridge."""

from __future__ import annotations

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler


def _mgr(handler):
    from api_state import get_mgr

    return get_mgr(handler)


def _plan_payload(mgr: Any) -> dict[str, Any]:
    plan = getattr(getattr(mgr, "plan_engine", None), "current_plan", None)
    if not plan:
        return {}
    return {
        "execution_id": f"plan:{getattr(mgr, 'session_id', 'session')}:{str(getattr(plan, 'task', '')).strip().replace(' ', '_')[:48]}",
        "task": plan.task,
        "status": plan.status,
        "started_at": getattr(mgr, "created_at", ""),
        "updated_at": getattr(mgr, "last_switch_at", "") or "",
        "steps": [
            {
                "step_id": f"step-{step.number}",
                "label": step.description,
                "status": step.status,
                "started_at": "",
                "ended_at": "",
                "evidence_id": step.evidence[0] if step.evidence else "",
                "receipt_id": getattr(getattr(mgr, "last_receipt", None), "envelope_id", "") if step.status == "done" else "",
                "result": step.result,
                "block_reason": step.block_reason,
                "block_code": step.block_code,
            }
            for step in plan.steps
        ],
        "evidence": [
            {"id": step.evidence[0], "type": "step_evidence", "state": step.status}
            for step in plan.steps
            if step.evidence
        ],
    }


def _scheduled_jobs(mgr: Any) -> list[dict[str, Any]]:
    try:
        from repl_schedule import load_jobs
    except Exception:
        return []
    base_path = getattr(mgr, "base_path", None)
    if not base_path:
        return []
    try:
        jobs = load_jobs(base_path)
    except Exception:
        return []
    return [
        {
            "execution_id": str(j.id),
            "kind": str(getattr(j, "kind", "schedule")),
            "prompt": str(getattr(j, "prompt", "")),
            "cron_expr": str(getattr(j, "cron_expr", "")),
            "interval_s": getattr(j, "interval_s", None),
            "next_run_at": str(getattr(j, "next_run_at", "")),
            "last_run_at": str(getattr(j, "last_run_at", "")),
            "status": str(getattr(j, "status", "")),
            "created_at": str(getattr(j, "created_at", "")),
            "run_count": int(getattr(j, "run_count", 0) or 0),
            "error": str(getattr(j, "error", "")),
        }
        for j in jobs
    ]


def _job_list(mgr: Any) -> list[dict[str, Any]]:
    jobs = _scheduled_jobs(mgr)
    plan = _plan_payload(mgr)
    if plan:
        jobs.insert(0, {
            "execution_id": plan["execution_id"],
            "kind": "pipeline",
            "prompt": plan.get("task", ""),
            "status": plan.get("status", ""),
            "started_at": plan.get("started_at", ""),
            "updated_at": plan.get("updated_at", ""),
            "steps": plan.get("steps", []),
            "evidence": plan.get("evidence", []),
        })
    return jobs


def _job_summary(mgr: Any) -> dict[str, Any]:
    jobs = _job_list(mgr)
    counts: dict[str, int] = {}
    for job in jobs:
        key = str(job.get("status") or "unknown").lower()
        counts[key] = counts.get(key, 0) + 1
    scheduled = [job for job in jobs if str(job.get("kind")) == "schedule"]
    pipeline = next((job for job in jobs if str(job.get("kind")) == "pipeline"), {})
    return {
        "ok": True,
        "summary": {
            "total": len(jobs),
            "scheduled": len(scheduled),
            "pipeline": 1 if pipeline else 0,
            "states": counts,
        },
        "active_pipeline": pipeline,
        "jobs": jobs,
    }


def handle_list(handler: "BaseHTTPRequestHandler") -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    jobs = _job_list(mgr)
    send_json(handler, 200, {"ok": True, "jobs": jobs, "count": len(jobs)})


def handle_get(handler: "BaseHTTPRequestHandler", execution_id: str) -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    target = str(execution_id or "").strip()
    for job in _job_list(mgr):
        if str(job.get("execution_id") or "") == target:
            send_json(handler, 200, {"ok": True, "job": job})
            return
    send_json(handler, 404, {"ok": False, "state": "blocked", "error_code": "JOB_NOT_FOUND", "message": f"No existe el job {target}"})


def handle_cancel(handler: "BaseHTTPRequestHandler", execution_id: str) -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    plan = getattr(getattr(mgr, "plan_engine", None), "current_plan", None)
    if not plan or str(_plan_payload(mgr).get("execution_id", "")) != str(execution_id or "").strip():
        send_json(handler, 409, {"ok": False, "state": "blocked", "error_code": "JOB_CANCEL_UNAVAILABLE", "message": "No hay un pipeline activo cancelable"})
        return
    if hasattr(mgr.plan_engine, "reset"):
        mgr.plan_engine.reset()
    send_json(handler, 200, {"ok": True, "state": "done", "execution_id": execution_id, "message": "Pipeline cancelado"})


def handle_retry(handler: "BaseHTTPRequestHandler", execution_id: str) -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    target = str(execution_id or "").strip()
    plan = getattr(getattr(mgr, "plan_engine", None), "current_plan", None)
    if not plan or str(_plan_payload(mgr).get("execution_id", "")) != target:
        send_json(handler, 404, {"ok": False, "state": "blocked", "error_code": "JOB_NOT_FOUND", "message": f"No existe el job {target}"})
        return
    for step in plan.steps:
        if step.status in {"failed", "blocked"}:
            step.status = "pending"
            step.block_reason = ""
            step.block_code = ""
            step.result = ""
    plan.status = "pending"
    send_json(handler, 200, {"ok": True, "state": "done", "execution_id": target, "job": _plan_payload(mgr), "message": "Pipeline preparado para reintento"})


def handle_summary(handler: "BaseHTTPRequestHandler") -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    send_json(handler, 200, _job_summary(mgr))
