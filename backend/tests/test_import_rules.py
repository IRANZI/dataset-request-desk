
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


def create_request(client, token):
    response = client.post(
        "/requests",
        json={
            "task_name": "pick cup",
            "episodes_requested": 1,
            "deadline": "2026-10-30",
            "notes": "Assignment test",
        },
        headers=auth_header(token),
    )

    assert response.status_code == 201

    return response.json()


def move_request_to_in_progress(client, token, request_id):
    response = client.patch(
        f"/requests/{request_id}/status",
        json={"status": "in_progress"},
        headers=auth_header(token),
    )

    assert response.status_code == 200


def find_unassigned_episode(episodes, quality):
    db = SessionLocal()

    try:
        assigned_episode_ids = {
            assignment.episode_id
            for assignment in db.query(Assignment).all()
        }

        for episode in episodes:
            if (
                episode["quality"] == quality
                and episode["task_name"] == "pick cup"
                and episode["id"] not in assigned_episode_ids
            ):
                return episode

        return None

    finally:
        db.close()


def test_bad_episode_cannot_be_assigned(client):
    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    request = create_request(
        client,
        client_token,
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

    bad_episode = next(
        (
            episode
            for episode in episodes_response.json()
            if episode["quality"] == "bad"
            and episode["task_name"] == "pick cup"
        ),
        None,
    )

    assert bad_episode is not None

    response = client.post(
        f"/episodes/{bad_episode['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert response.status_code == 400
    assert "good or usable" in response.json()["detail"]


def test_usable_episode_can_be_assigned(client):
    operator_token = login(
        client,
        "ops1@example.com",
        "ops123",
    )

    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    request = create_request(
        client,
        client_token,
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

    usable_episode = find_unassigned_episode(
        episodes_response.json(),
        "usable",
    )

    assert usable_episode is not None

    response = client.post(
        f"/episodes/{usable_episode['id']}/assign/{request['id']}",
        headers=auth_header(operator_token),
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Episode assigned successfully"
