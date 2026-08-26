def test_admin_can_create_support_user(client, admin_headers):
    resp = client.post(
        "/admin/users",
        json={"username": "newagent", "password": "supersecret1", "role": "support"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["username"] == "newagent"
    assert body["role"] == "support"
    assert "password" not in body
    assert "hashed_password" not in body

    login_resp = client.post("/auth/login", json={"username": "newagent", "password": "supersecret1"})
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["role"] == "support"


def test_admin_can_create_admin_user(client, admin_headers):
    resp = client.post(
        "/admin/users",
        json={"username": "newadmin", "password": "supersecret1", "role": "admin"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "admin"


def test_cannot_create_duplicate_username(client, admin_headers, support_user):
    resp = client.post(
        "/admin/users",
        json={"username": "alice", "password": "supersecret1", "role": "support"},
        headers=admin_headers,
    )
    assert resp.status_code == 400


def test_create_user_password_too_short(client, admin_headers):
    resp = client.post(
        "/admin/users",
        json={"username": "shortpw", "password": "short", "role": "support"},
        headers=admin_headers,
    )
    assert resp.status_code == 422


def test_non_admin_cannot_create_user(client, support_headers):
    resp = client.post(
        "/admin/users",
        json={"username": "sneaky", "password": "supersecret1", "role": "admin"},
        headers=support_headers,
    )
    assert resp.status_code == 403


def test_non_admin_cannot_list_users(client, support_headers):
    resp = client.get("/admin/users", headers=support_headers)
    assert resp.status_code == 403


def test_admin_lists_users(client, admin_headers, support_user, other_support_user):
    resp = client.get("/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    usernames = {u["username"] for u in resp.json()}
    assert {"admin", "alice", "bob"}.issubset(usernames)
    assert all(u["is_active"] for u in resp.json())


def test_admin_can_deactivate_and_reactivate_user(client, admin_headers, support_user):
    resp = client.patch(
        f"/admin/users/{support_user.id}/status", json={"is_active": False}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    resp = client.patch(
        f"/admin/users/{support_user.id}/status", json={"is_active": True}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True


def test_deactivated_user_cannot_log_in(client, admin_headers, support_user):
    client.patch(f"/admin/users/{support_user.id}/status", json={"is_active": False}, headers=admin_headers)
    resp = client.post("/auth/login", json={"username": "alice", "password": "alice123"})
    assert resp.status_code == 403


def test_deactivating_mid_session_invalidates_existing_token(client, admin_headers, support_headers, support_user):
    # support_headers was issued while the account was still active.
    resp = client.get("/tickets", headers=support_headers)
    assert resp.status_code == 200

    client.patch(f"/admin/users/{support_user.id}/status", json={"is_active": False}, headers=admin_headers)

    resp = client.get("/tickets", headers=support_headers)
    assert resp.status_code == 401


def test_admin_cannot_deactivate_own_account(client, admin_headers, admin_user):
    resp = client.patch(
        f"/admin/users/{admin_user.id}/status", json={"is_active": False}, headers=admin_headers
    )
    assert resp.status_code == 400


def test_non_admin_cannot_change_user_status(client, support_headers, other_support_user):
    resp = client.patch(
        f"/admin/users/{other_support_user.id}/status", json={"is_active": False}, headers=support_headers
    )
    assert resp.status_code == 403


def test_inactive_agent_excluded_from_assignable_lists(
    client, admin_headers, support_headers, other_support_headers, other_support_user
):
    client.patch(
        f"/admin/users/{other_support_user.id}/status", json={"is_active": False}, headers=admin_headers
    )

    resp = client.get("/admin/support-users", headers=admin_headers)
    assert "bob" not in {u["username"] for u in resp.json()}

    resp = client.get("/tickets/assignable-users", headers=support_headers)
    assert "bob" not in {u["username"] for u in resp.json()}
