from __future__ import annotations


def test_notes_crud(auth_client):
    tree_resp = auth_client.get("/api/notes/tree")
    assert tree_resp.status_code == 200
    assert tree_resp.json() == []

    folder_resp = auth_client.post("/api/notes/folder", json={"parent_path": "", "name": "docs"})
    assert folder_resp.status_code == 200

    file_resp = auth_client.post("/api/notes/file", json={"parent_path": "docs", "name": "a.md", "content": "# Hi"})
    assert file_resp.status_code == 200
    file_body = file_resp.json()
    assert file_body["path"] == "docs/a.md"

    tree_resp = auth_client.get("/api/notes/tree?path=docs")
    assert tree_resp.status_code == 200
    children = tree_resp.json()
    assert len(children) == 1
    assert children[0]["name"] == "a.md"

    read_resp = auth_client.get("/api/notes/file?path=docs/a.md")
    assert read_resp.status_code == 200
    assert read_resp.json()["content"] == "# Hi"

    delete_resp = auth_client.delete("/api/notes/path?path=docs/a.md")
    assert delete_resp.status_code == 200
