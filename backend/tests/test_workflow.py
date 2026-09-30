
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
    return {"Authorization": f"Bearer {token}"}


def create_request(client, token, task_name="pick cup", episodes_requested=1):
    response = client.post(
        "/requests",
        json={
            "task_name": task_name,
            "episodes_requested": episodes_requested,
            "deadline": "2026-10-30",
            "notes": "Test request",
        },
        headers=auth_header(token),
    )

    assert response.status_code == 201

    return response.json()


def move_request(client, token, request_id, new_status):
    return client.patch(
        f"/requests/{request_id}/status",
        json={"status": new_status},
        headers=auth_header(token),
    )


def find_unassigned_good_episode(episodes):
    """
    Find a good-quality pick-cup episode that has not
    already been assigned to another request.
    """

    db = SessionLocal()

    try:
        assigned_episode_ids = {
            assignment.episode_id
            for assignment in db.query(Assignment).all()
        }

        for episode in episodes:
            if (
                episode["task_name"] == "pick cup"
                and episode["quality"] == "good"
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

    response = move_request(
        client,
        operator_token,
        request["id"],
        "in_progress",
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

    move_response = move_request(
        client,
        operator_token,
        request["id"],
        "in_progress",
    )

    assert move_response.status_code == 200

    delivery_response = move_request(
        client,
        operator_token,
        request["id"],
        "delivered",
    )

    assert delivery_response.status_code == 400
    assert "episodes assigned" in delivery_response.json()["detail"]


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

    response = move_request(
        client,
        operator_token,
        request["id"],
        "delivered",
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
    )

    move_response = move_request(
        client,
        operator_token,
        request["id"],
        "in_progress",
    )

    assert move_response.status_code == 200

    episodes_response = client.get(
        "/episodes",
        headers=auth_header(operator_token),
    )

    assert episodes_response.status_code == 200

    good_pick_cup = find_unassigned_good_episode(
        episodes_response.json()
    )

    assert good_pick_cup is not None

    assignment_response = client.post(
        f"/episodes/{good_pick_cup['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert assignment_response.status_code == 200

    delivery_response = move_request(
        client,
        operator_token,
        request["id"],
        "delivered",
    )

    assert delivery_response.status_code == 200
    assert delivery_response.json()["status"] == "delivered"

    accept_response = move_request(
        client,
        client_token,
        request["id"],
        "accepted",
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
    )

    move_response = move_request(
        client,
        operator_token,
        request["id"],
        "in_progress",
    )

    assert move_response.status_code == 200

    episodes_response = client.get(
        "/episodes",
        headers=auth_header(operator_token),
    )

    assert episodes_response.status_code == 200

    good_pick_cup = find_unassigned_good_episode(
        episodes_response.json()
    )

    assert good_pick_cup is not None

    assignment_response = client.post(
        f"/episodes/{good_pick_cup['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert assignment_response.status_code == 200

    delivery_response = move_request(
        client,
        operator_token,
        request["id"],
        "delivered",
    )

    assert delivery_response.status_code == 200
    assert delivery_response.json()["status"] == "delivered"

    reject_response = move_request(
        client,
        client_token,
        request["id"],
        "rejected",
    )

    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "rejected"

    resume_response = move_request(
        client,
        operator_token,
        request["id"],
        "in_progress",
    )

    assert resume_response.status_code == 200
    assert resume_response.json()["status"] == "in_progress"

