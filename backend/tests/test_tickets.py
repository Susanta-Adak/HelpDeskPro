def create_ticket(client, headers, title="Printer is broken", description="It jams every time I print."):
    return client.post(
        "/tickets",
        data={"title": title, "description": description, "category": "technical", "priority": "medium"},
        headers=headers,
    )


def test_create_and_list_own_tickets(client, support_headers):
    resp = create_ticket(client, support_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "open"
    assert body["priority"] == "medium"
    assert body["category"] == "technical"
    assert body["creator"]["username"] == "alice"

    resp = client.get("/tickets", headers=support_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_create_ticket_validation_error(client, support_headers):
    resp = create_ticket(client, support_headers, title="ab", description="short")
    assert resp.status_code == 422


def test_cannot_view_unrelated_users_ticket(client, support_headers, other_support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.get(f"/tickets/{ticket['id']}", headers=other_support_headers)
    assert resp.status_code == 403


def test_assignee_can_view_and_list_ticket(
    client, support_headers, other_support_headers, admin_headers, other_support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )

    resp = client.get(f"/tickets/{ticket['id']}", headers=other_support_headers)
    assert resp.status_code == 200

    resp = client.get("/tickets", headers=other_support_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_update_ticket_while_open_succeeds(client, support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.put(
        f"/tickets/{ticket['id']}",
        json={"title": "Updated title here"},
        headers=support_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated title here"


def test_creator_can_update_ticket_after_it_is_no_longer_open(client, support_headers, admin_headers):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/status",
        json={"status": "in_progress"},
        headers=admin_headers,
    )
    resp = client.put(
        f"/tickets/{ticket['id']}",
        json={"title": "Still editable"},
        headers=support_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Still editable"


def test_non_creator_cannot_update_ticket(
    client, support_headers, other_support_headers, admin_headers, other_support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )
    resp = client.put(
        f"/tickets/{ticket['id']}",
        json={"title": "Bob trying to edit"},
        headers=other_support_headers,
    )
    assert resp.status_code == 403


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


def test_assignee_can_change_status(client, support_headers, other_support_headers, admin_headers, other_support_user):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )

    resp = client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=other_support_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"

    resp = client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "closed"}, headers=other_support_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


def test_non_assignee_cannot_change_status(client, support_headers, other_support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=other_support_headers
    )
    assert resp.status_code == 403


def test_creator_who_is_not_assignee_cannot_change_status(
    client, support_headers, other_support_headers, admin_headers, other_support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )
    resp = client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=support_headers
    )
    assert resp.status_code == 403


def test_admin_can_reopen_closed_ticket(
    client, support_headers, other_support_headers, admin_headers, other_support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )
    client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=other_support_headers
    )
    client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "closed"}, headers=other_support_headers
    )

    resp = client.patch(
        f"/admin/tickets/{ticket['id']}/status", json={"status": "open"}, headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "open"


def test_assignee_cannot_reopen_closed_ticket(
    client, support_headers, other_support_headers, admin_headers, other_support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )
    client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "in_progress"}, headers=other_support_headers
    )
    client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "closed"}, headers=other_support_headers
    )

    resp = client.patch(
        f"/tickets/{ticket['id']}/status", json={"status": "open"}, headers=other_support_headers
    )
    assert resp.status_code == 403


def test_assignee_can_reassign_ticket(
    client, support_headers, other_support_headers, admin_headers, other_support_user, support_user
):
    ticket = create_ticket(client, support_headers).json()
    client.patch(
        f"/admin/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=admin_headers,
    )

    resp = client.patch(
        f"/tickets/{ticket['id']}/assign",
        json={"assignee_id": support_user.id},
        headers=other_support_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["assignee"]["username"] == "alice"


def test_unrelated_user_cannot_reassign_ticket(client, support_headers, other_support_headers, other_support_user):
    ticket = create_ticket(client, support_headers).json()
    resp = client.patch(
        f"/tickets/{ticket['id']}/assign",
        json={"assignee_id": other_support_user.id},
        headers=other_support_headers,
    )
    assert resp.status_code == 403


def test_creator_can_comment_and_see_comments(client, support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.post(
        f"/tickets/{ticket['id']}/comments", json={"body": "Any update on this?"}, headers=support_headers
    )
    assert resp.status_code == 201
    assert resp.json()["author"]["username"] == "alice"

    resp = client.get(f"/tickets/{ticket['id']}", headers=support_headers)
    assert len(resp.json()["comments"]) == 1


def test_unrelated_user_cannot_comment(client, support_headers, other_support_headers):
    ticket = create_ticket(client, support_headers).json()
    resp = client.post(
        f"/tickets/{ticket['id']}/comments", json={"body": "Butting in"}, headers=other_support_headers
    )
    assert resp.status_code == 403


def test_list_assignable_users(client, support_headers, other_support_user):
    resp = client.get("/tickets/assignable-users", headers=support_headers)
    assert resp.status_code == 200
    usernames = {u["username"] for u in resp.json()}
    assert "bob" in usernames
