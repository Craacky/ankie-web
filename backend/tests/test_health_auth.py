from __future__ import annotations


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_auth_config(client):
    resp = client.get("/api/auth/config")
    assert resp.status_code == 200
    assert resp.json()["telegram_bot_username"] == "testbot"
