from __future__ import annotations

import json


def test_import_collection_and_study(auth_client):
    payload = {"cards": [{"q": "Q1", "a": "A1"}, {"q": "Q2", "a": "A2"}]}
    data = {
        "name": "Test Collection",
    }
    files = {
        "file": ("cards.json", json.dumps(payload), "application/json"),
    }
    resp = auth_client.post("/api/collections/import", data=data, files=files)
    assert resp.status_code == 200
    result = resp.json()
    assert result["imported_count"] == 2

    list_resp = auth_client.get("/api/collections")
    assert list_resp.status_code == 200
    assert list_resp.json()[0]["total_cards"] == 2

    collection_id = result["collection_id"]
    study_resp = auth_client.get(f"/api/collections/{collection_id}/study-cards?limit=1&offset=0")
    assert study_resp.status_code == 200
    body = study_resp.json()
    assert body["remaining_cards"] == 2
    assert len(body["cards"]) == 1

    card_id = body["cards"][0]["id"]
    mark_resp = auth_client.post(
        f"/api/cards/{card_id}/progress",
        json={"card_id": card_id, "known": True},
    )
    assert mark_resp.status_code == 200

    study_resp = auth_client.get(f"/api/collections/{collection_id}/study-cards?limit=2&offset=0")
    assert study_resp.status_code == 200
    body = study_resp.json()
    assert body["remaining_cards"] == 1
