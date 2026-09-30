from app.database import SessionLocal
from app.models import Assignment


def login(client, email, password):
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200
    return response.json()["access_token"]


def auth_header(token):
    return {
        "Authorization": f"Bearer {token}",
    }


def create_request(client, token, episodes_requested=1):
    response = client.post(
        "/requests",
        json={
            "task_name": "pick cup",
            "episodes_requested": episodes_requested,
            "deadline": "2026-10-30",
            "notes": "Workflow test",
        },
        headers=auth_header(token),
    )

    assert response.status_code == 201
    return response.json()


def move_request_to_in_progress(client, token, request_id):
    response = client.patch(
        f"/requests/{request_id}/status",
        json={
            "status": "in_progress",
        },
        headers=auth_header(token),
    )

    assert response.status_code == 200
    return response.json()


def find_unassigned_assignable_episode(episodes):
    """
    Find a pick-cup episode that:
    - is good or usable
    - matches the request task
    - has not already been assigned
    """

    db = SessionLocal()

    try:
        assigned_episode_ids = {
            assignment.episode_id
            for assignment in db.query(Assignment).all()
        }

        for episode in episodes:
            if (
                episode["quality"] in {"good", "usable"}
                and episode["task_name"] == "pick cup"
                and episode["id"] not in assigned_episode_ids
            ):
                return episode

        return None

    finally:
        db.close()


def test_request_can_move_to_in_progress(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    request = create_request(
        client,
        client_token,
    )

    response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "in_progress",
        },
        headers=auth_header(operator_token),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_cannot_deliver_without_enough_episodes(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    request = create_request(
        client,
        client_token,
        episodes_requested=2,
    )

    move_request_to_in_progress(
        client,
        operator_token,
        request["id"],
    )

    response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "delivered",
        },
        headers=auth_header(operator_token),
    )

    assert response.status_code == 400
    assert "episodes assigned" in response.json()["detail"]


def test_invalid_status_transition_is_rejected(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    request = create_request(
        client,
        client_token,
    )

    response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "delivered",
        },
        headers=auth_header(operator_token),
    )

    assert response.status_code == 400
    assert "Invalid status transition" in response.json()["detail"]


def test_client_can_accept_delivered_request(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    request = create_request(
        client,
        client_token,
        episodes_requested=1,
    )

    move_request_to_in_progress(
        client,
        operator_token,
        request["id"],
    )

    episodes_response = client.get(
        "/episodes",
        headers=auth_header(operator_token),
    )

    assert episodes_response.status_code == 200

    assignable_pick_cup = find_unassigned_assignable_episode(
        episodes_response.json()
    )

    assert assignable_pick_cup is not None

    assign_response = client.post(
        f"/episodes/{assignable_pick_cup['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert assign_response.status_code == 200

    deliver_response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "delivered",
        },
        headers=auth_header(operator_token),
    )

    assert deliver_response.status_code == 200
    assert deliver_response.json()["status"] == "delivered"

    accept_response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "accepted",
        },
        headers=auth_header(client_token),
    )

    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"


def test_client_can_reject_delivered_request(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    request = create_request(
        client,
        client_token,
        episodes_requested=1,
    )

    move_request_to_in_progress(
        client,
        operator_token,
        request["id"],
    )

    episodes_response = client.get(
        "/episodes",
        headers=auth_header(operator_token),
    )

    assert episodes_response.status_code == 200

    assignable_pick_cup = find_unassigned_assignable_episode(
        episodes_response.json()
    )

    assert assignable_pick_cup is not None

    assign_response = client.post(
        f"/episodes/{assignable_pick_cup['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert assign_response.status_code == 200

    deliver_response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "delivered",
        },
        headers=auth_header(operator_token),
    )

    assert deliver_response.status_code == 200
    assert deliver_response.json()["status"] == "delivered"

    reject_response = client.patch(
        f"/requests/{request['id']}/status",
        json={
            "status": "rejected",
        },
        headers=auth_header(client_token),
    )

    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "rejected"