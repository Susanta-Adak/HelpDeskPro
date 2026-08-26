def create_ticket(client, headers, title="Printer is broken", description="It jams every time I print."):
    return client.post("/tickets", json={"title": title, "description": description}, headers=headers)


def test_create_and_list_own_tickets(client, support_headers):
    resp = create_ticket(client, support_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "open"
    assert body["creator"]["username"] == "alice"

    resp = client.get("/tickets", headers=support_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_create_ticket_validation_error(client, support_headers):
    resp = create_ticket(client, support_headers, title="ab", description="short")
    assert resp.status_code == 422


def test_cannot_view_other_users_ticket(client, support_headers, other_support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.get(f"/tickets/{ticket['id']}", headers=other_support_headers)
    assert resp.status_code == 403


def test_update_ticket_while_open_succeeds(client, support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.put(
        f"/tickets/{ticket['id']}",
        json={"title": "Updated title here"},
        headers=support_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated title here"


def test_update_ticket_blocked_when_not_open(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/status",
        json={"status": "in_progress"},
        headers=admin_headers,
    )
    resp = client.put(
        f"/tickets/{ticket['id']}",
        json={"title": "Should not work"},
        headers=support_headers,
    )
    assert resp.status_code == 400


def test_delete_ticket_while_open_succeeds(client, support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.delete(f"/tickets/{ticket['id']}", headers=support_headers)
    assert resp.status_code == 204


def test_delete_ticket_blocked_when_not_open(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/status",
        json={"status": "in_progress"},
        headers=admin_headers,
    )
    resp = client.delete(f"/tickets/{ticket['id']}", headers=support_headers)
    assert resp.status_code == 400


def test_cannot_delete_others_ticket(client, support_headers, other_support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.delete(f"/tickets/{ticket['id']}", headers=other_support_headers)
    assert resp.status_code == 403


def test_get_nonexistent_ticket_404(client, support_headers):
    resp = client.get("/tickets/9999", headers=support_headers)
    assert resp.status_code == 404
