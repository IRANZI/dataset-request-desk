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


def test_client_can_only_see_own_requests(client):
    client_a_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    client_b_token = login(
        client,
        "client-b@example.com",
        "client123",
    )

    response = client.post(
        "/requests",
        json={
            "task_name": "pick cup",
            "episodes_requested": 1,
            "deadline": "2026-10-30",
            "notes": "Private request",
        },
        headers=auth_header(client_a_token),
    )

    assert response.status_code == 201

    request_id = response.json()["id"]

    own_request = client.get(
        f"/requests/{request_id}",
        headers=auth_header(client_a_token),
    )

    assert own_request.status_code == 200

    other_request = client.get(
        f"/requests/{request_id}",
        headers=auth_header(client_b_token),
    )

    assert other_request.status_code == 403


def test_client_cannot_access_operator_episode_list(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    response = client.get(
        "/episodes",
        headers=auth_header(client_token),
    )

    assert response.status_code == 403


def test_client_cannot_access_analytics(client):
    client_token = login(
        client,
        "client-a@example.com",
        "client123",
    )

    response = client.get(
        "/analytics/requests",
        headers=auth_header(client_token),
    )

    assert response.status_code == 403