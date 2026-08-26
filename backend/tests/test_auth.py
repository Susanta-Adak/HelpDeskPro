def test_login_success(client, support_user):
    resp = client.post("/auth/login", json={"username": "alice", "password": "alice123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["user"]["username"] == "alice"
    assert body["user"]["role"] == "support"
    assert "hashed_password" not in body["user"]
    assert "password" not in body["user"]


def test_login_wrong_password(client, support_user):
    resp = client.post("/auth/login", json={"username": "alice", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post("/auth/login", json={"username": "nobody", "password": "x"})
    assert resp.status_code == 401


def test_protected_endpoint_requires_token(client):
    resp = client.get("/tickets")
    assert resp.status_code == 401
