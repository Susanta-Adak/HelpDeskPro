def create_ticket(client, headers, title="Printer is broken", description="It jams every time I print."):
    return client.post("/tickets", json={"title": title, "description": description}, headers=headers)


def test_support_user_cannot_hit_admin_endpoints(client, support_headers):
    resp = client.get("/admin/tickets", headers=support_headers)
    assert resp.status_code == 403


def test_admin_can_list_all_tickets(client, support_headers, other_support_headers, admin_headers):
    create_ticket(client, support_headers, title="Alice ticket one")
    create_ticket(client, other_support_headers, title="Bob ticket one")

    resp = client.get("/admin/tickets", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2


def test_admin_search_by_title(client, support_headers, admin_headers):
    create_ticket(client, support_headers, title="Printer jam issue")
    create_ticket(client, support_headers, title="Billing question")

    resp = client.get("/admin/tickets", params={"search": "printer"}, headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Printer jam issue"


def test_admin_search_by_username(client, support_headers, other_support_headers, admin_headers):
    create_ticket(client, support_headers, title="Alice issue")
    create_ticket(client, other_support_headers, title="Bob issue")

    resp = client.get("/admin/tickets", params={"search": "alice"}, headers=admin_headers)
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["creator"]["username"] == "alice"


def test_admin_filter_by_status(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    create_ticket(client, support_headers, title="Second ticket")
    client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=admin_headers
    )

    resp = client.get("/admin/tickets", params={"status": "open"}, headers=admin_headers)
    assert resp.json()["total"] == 1


def test_admin_status_transition_valid_sequence(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"

    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "closed"}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


def test_admin_cannot_skip_status_or_go_backward(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()

    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "closed"}, headers=admin_headers
    )
    assert resp.status_code == 400

    client.patch(f"/admin/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=admin_headers)
    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "open"}, headers=admin_headers
    )
    assert resp.status_code == 400


def test_admin_assign_ticket_to_support_user(client, support_headers, other_support_headers, admin_headers, other_support_user):
    ticket = create_ticket(client, support_headers).json()
    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["assignee"]["username"] == "bob"


def test_admin_assign_to_nonexistent_user_fails(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": 9999},
        headers=admin_headers,
    )
    assert resp.status_code == 400


def test_admin_delete_ticket(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.delete(f"/admin/tickets/{ticket['id']}", headers=admin_headers)
    assert resp.status_code == 204

    resp = client.get(f"/admin/tickets/{ticket['id']}", headers=admin_headers)
    assert resp.status_code == 404


def test_dashboard_stats(client, support_headers, admin_headers):
    t1 = create_ticket(client, support_headers, title="One").json()
    create_ticket(client, support_headers, title="Two")
    client.patch(f"/admin/tickets/{t1['id']}/status", json={"status": "in_progress"}, headers=admin_headers)

    resp = client.get("/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["open"] == 1
    assert body["in_progress"] == 1
    assert body["closed"] == 0
