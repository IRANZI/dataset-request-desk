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


def test_only_good_episode_can_be_assigned(client):
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

    request_response = client.post(
        "/requests",
        json={
            "task_name": "pick cup",
            "episodes_requested": 1,
            "deadline": "2026-10-30",
            "notes": "Assignment test",
        },
        headers=auth_header(client_token),
    )

    request_id = request_response.json()["id"]

    client.patch(
        f"/requests/{request_id}/status",
        json={"status": "in_progress"},
        headers=auth_header(operator_token),
    )

    episodes_response = client.get(
        "/episodes",
        headers=auth_header(operator_token),
    )

    bad_episode = next(
        (
            episode
            for episode in episodes_response.json()
            if episode["quality"] == "bad"
            and episode["task_name"] == "pick cup"
        ),
        None,
    )

    if bad_episode is None:
        return

    response = client.post(
        f"/episodes/{bad_episode['id']}/assign/{request_id}",
        headers=auth_header(operator_token),
    )

    assert response.status_code == 400
    assert "Only good episodes" in response.json()["detail"]